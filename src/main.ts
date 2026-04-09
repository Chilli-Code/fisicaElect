// ============================================================
// src/main.ts
// ============================================================
import { state } from '@core/state'
import { saveSnapshot } from '@core/history'
import { calculateCurrentFlow, updateLEDAnimation } from '@core/circuit'
import { emit, on, AppEvents } from '@core/events'
import type { NotificationEvent } from '@core/types'

import { SceneManager } from '@scene/SceneManager'
import { ComponentManager } from '@scene/ComponentManager'
import { WireManager } from '@scene/WireManager'

import { getComponentTemplates } from '@components/templates'
import { animateWireFlow } from '@utils/animations'
import { setupNotifications, showNotification } from '@ui/notifications'
import { setupToolbar } from '@ui/toolbar'
import { setupInspector, updateInspector } from '@ui/inspector'
import { setupDragDrop } from '@ui/dragdrop'
import { setupKeyboard } from '@ui/keyboard'
import { setupExperiments } from '@ui/experiments'
import { setupLibrary } from '@ui/library'
import { setupViewButtons } from '@ui/viewButtons'
import { setupWireTooltip } from '@ui/wireTooltip'
import { setupLegendButton } from '@ui/wireLegendModal'
import { setupTour } from '@ui/appTour'
import { getSession, renderUserBadge } from '@ui/auth'
import { showLoginScreen } from '@ui/loginScreen'
import { setupSettingsModal } from '@ui/settingsModal'
import { 
  setupExitProtection,
  loadBackup,
  clearBackup,
  setupBackupRestore
} from '@core/session-backup'

const isMobile = window.innerWidth < 768 || 'ontouchstart' in window

if (isMobile) {
  // ✅ Mostrar loader inmediatamente
  const loader = document.getElementById('app-loader')!
  loader.style.display = 'flex'

  import('./main.mobile').then(m => {
    m.initMobile()
    // ✅ Quitar loader cuando mobile está listo
    setTimeout(() => {
      loader.style.opacity = '0'
      loader.style.transition = 'opacity 0.3s ease'
      setTimeout(() => loader.remove(), 300)
    }, 300)
  })
} else {
  const user = getSession()
  if (!user) {
    showLoginScreen(() => initApp())
  } else {
    initApp()
  }
}
function initApp(): void {
  renderUserBadge()
  setupSettingsModal()

  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement
  const container = document.querySelector('.canvas-area') as HTMLElement

  const sceneManager = new SceneManager(canvas, container)
  const templates = getComponentTemplates()
  const componentManager = new ComponentManager(sceneManager.scene, state, templates)
  const wireManager = new WireManager(sceneManager.scene, state)

  sceneManager.onFrame(() => {
    if (state.isSimulating) {
      const { hasCurrent } = calculateCurrentFlow(state)
      state.components.forEach(comp => {
        if (comp.type === 'led') updateLEDAnimation(comp, hasCurrent)
      })
      if (hasCurrent) {
        state.wires.forEach(wire => animateWireFlow(wire, Date.now() * 0.001))
      }
    }
  })
  sceneManager.start()

  setupNotifications()
  setupToolbar(state, sceneManager, componentManager, wireManager)
  setupInspector(state, templates)
  setupDragDrop(state, container, sceneManager, componentManager, wireManager)
  setupKeyboard(state, sceneManager, componentManager, wireManager)
  setupExperiments(state, sceneManager, componentManager, wireManager)
  setupLibrary(state, componentManager, wireManager)
  setupViewButtons(sceneManager)
  setupWireTooltip(state, sceneManager, canvas)
  setupLegendButton()
  setupTour()

  on(AppEvents.STATE_CHANGED, () => {
    updateInspector(state, templates)
    wireManager.updateAll(calculateCurrentFlow(state).hasCurrent, state.isSimulating)
  })

  on<NotificationEvent>(AppEvents.NOTIFICATION, ({ type, title, message }) => {
    showNotification(type, title, message)
  })

  saveSnapshot(state, 'Estado inicial')
  emit(AppEvents.STATE_CHANGED, null)
  emit<NotificationEvent>(AppEvents.NOTIFICATION, {
    type: 'success',
    title: '¡Listo!',
    message: 'Circuit Lab Pro cargado ⚡',
  })
  setupExitProtection(state)
   // Verificar backup
  const backup = loadBackup()
  if (backup) {
    setTimeout(() => {
      setupBackupRestore(backup, (b) => {
b.components.forEach(c => {
componentManager.restoreFromSnapshot(c)
})
        requestAnimationFrame(() => {
          b.wires.forEach(w => {
            const sc = state.components.find(c => c.id === w.startComp)
            const ec = state.components.find(c => c.id === w.endComp)
            if (!sc || !ec) return
            const st = sc.terminals.find(t => t.type === w.startTerm)
            const et = ec.terminals.find(t => t.type === w.endTerm)
            if (!st || !et) return
            wireManager.create(sc, st, ec, et)
          })
          state.idCounter = b.idCounter
          emit(AppEvents.STATE_CHANGED, null)
        })
      })
    }, 500)
  }
}