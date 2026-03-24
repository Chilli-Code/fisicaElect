import { state } from '@core/state'
import { saveSnapshot } from '@core/history'
import { calculateCurrentFlow, updateLEDAnimation } from '@core/circuit'
import { emit, on, AppEvents } from '@core/events'
import { WireManager } from '@scene/WireManager'
import { getComponentTemplates } from '@components/templates'
import { animateWireFlow } from '@utils/animations'
import { BabylonSceneManager } from '@scene/BabylonSceneManager'
import { BabylonComponentManager } from '@scene/BabylonComponentManager'
import { BabylonWireManager } from '@scene/BabylonWireManager'
import { setupMobileLayout } from '@ui/mobile/MobileLayout'
import { setupMobileControls } from '@ui/mobile/MobileControls'


export function initMobile(): void {
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement
  const sceneManager = new BabylonSceneManager(canvas)
  const templates = getComponentTemplates()
  const componentManager = new BabylonComponentManager(sceneManager.scene, state, templates)
  const wireManager = new BabylonWireManager(sceneManager.scene, state)

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
  setupMobileLayout(state, sceneManager, componentManager, wireManager)
setupMobileControls(sceneManager.scene, state, sceneManager.camera)

  on(AppEvents.STATE_CHANGED, () => {
    wireManager.updateAll(calculateCurrentFlow(state).hasCurrent, state.isSimulating)
  })

  saveSnapshot(state, 'Estado inicial mobile')
  emit(AppEvents.STATE_CHANGED, null)
}