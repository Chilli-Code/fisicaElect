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

const isMobile = window.innerWidth < 768 || 'ontouchstart' in window

if (isMobile) {
  import('./main.mobile').then(m => m.initMobile())
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
}