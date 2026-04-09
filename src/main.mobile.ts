// main.mobile.ts
import { state } from '@core/state'
import { calculateCurrentFlow } from '@core/circuit'  // ← solo lógica pura, NO animaciones
import { emit, on, AppEvents } from '@core/events'
import { BabylonSceneManager } from '@scene/BabylonSceneManager'
import { BabylonComponentManager } from '@scene/BabylonComponentManager'
import { BabylonWireManager } from '@scene/BabylonWireManager'
import { setupMobileLayout } from '@ui/mobile/MobileLayout'
import { setupMobileControls } from '@ui/mobile/MobileControls'
import { getComponentTemplates } from '@components/templates'
import { saveBabylonSnapshot } from '@core/babylon-history'
import { animateLED } from '@utils/babylon-animations'
import { 
  setupExitProtection, 
  loadBackup, 
  clearBackup,
  setupBackupRestore 
} from '@core/session-backup'
import type { AppState } from '@core/types'

function isComponentInActiveCircuit(compId: string, state: AppState): boolean {
  const connected = new Set<string>()
  const queue = [compId]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (connected.has(current)) continue
    connected.add(current)
    state.wires.forEach(w => {
      if (w.startComp === current && !connected.has(w.endComp)) queue.push(w.endComp)
      if (w.endComp === current && !connected.has(w.startComp)) queue.push(w.startComp)
    })
  }

  return state.components.some(
    c => connected.has(c.id) && (c.type === 'battery' || c.type === 'ac-source')
  )
}






export function initMobile(): void {
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement
  const sceneManager = new BabylonSceneManager(canvas)
  const templates = getComponentTemplates()
  const componentManager = new BabylonComponentManager(sceneManager.scene, state, templates)
  const wireManager = new BabylonWireManager(sceneManager.scene, state)

  // ✅ Render loop — 100% Babylon, sin Three.js
sceneManager.onFrame(() => {
  const { hasCurrent } = calculateCurrentFlow(state)
  const time = Date.now() * 0.001

  state.components.forEach(comp => {
    if (comp.type !== 'led') return

    // ✅ Verificar que el LED está en el mismo circuito que la batería
    const ledInCircuit = isComponentInActiveCircuit(comp.id, state)

    animateLED(comp.mesh, state.isSimulating && hasCurrent && ledInCircuit, time)
  })

  wireManager.updateAll(hasCurrent, state.isSimulating)
})

  sceneManager.start()
  setupMobileLayout(state, sceneManager, componentManager, wireManager)
  setupMobileControls(sceneManager.scene, state, sceneManager.camera, wireManager, componentManager)

  on(AppEvents.STATE_CHANGED, () => {
    // solo UI, cables van en render loop
  })

  saveBabylonSnapshot(state, 'Estado inicial mobile')
  emit(AppEvents.STATE_CHANGED, null)
  setupExitProtection(state)
   // Verificar backup al iniciar
  const backup = loadBackup()
  if (backup) {
    setTimeout(() => {
      setupBackupRestore(backup, (b) => {
        b.components.forEach(c => {
          const comp = componentManager.add(c.type as any, c.position.x, c.position.z, c.id)
          if (comp) {
            comp.value = c.value
            comp.position.x = c.position.x
            comp.position.z = c.position.z
          }
        })
        setTimeout(() => {
          b.wires.forEach(w => {
            const sc = state.components.find(c => c.id === w.startComp)
            const ec = state.components.find(c => c.id === w.endComp)
            if (!sc || !ec) return
            const st = sc.terminals.find(t => t.type === w.startTerm)
            const et = ec.terminals.find(t => t.type === w.endTerm)
            if (!st || !et) return
            wireManager.create(sc, st, ec, et, {
              color: '#' + w.baseColor.toString(16).padStart(6, '0')
            })
          })
          state.idCounter = b.idCounter
          emit(AppEvents.STATE_CHANGED, null)
        }, 50)
      })
    }, 1500) // esperar a que la UI cargue
  }

  
}



