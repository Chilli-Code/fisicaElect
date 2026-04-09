import type { AppState } from '@core/types'
import type { BabylonComponentManager } from '@scene/BabylonComponentManager'
import type { BabylonWireManager } from '@scene/BabylonWireManager'
import { on, AppEvents } from '@core/events'
import {
  getBabylonUndoSnapshot,
  getBabylonRedoSnapshot,
  rebuildSceneFromBabylonSnapshot,
  canUndoBabylon,
  canRedoBabylon
} from '@core/babylon-history'
import { showNotification } from './MobileNotifications'

export function setupUndoRedo(
  state: AppState,
  scene: any,
  cm: BabylonComponentManager,
  wm: BabylonWireManager
): void {
  const undoBtn = document.getElementById('m-undo')
  const redoBtn = document.getElementById('m-redo')

  const updateButtons = () => {
    if (undoBtn) {
      undoBtn.style.opacity = canUndoBabylon(state) ? '1' : '0.5'
      undoBtn.style.pointerEvents = canUndoBabylon(state) ? 'auto' : 'none'
    }
    if (redoBtn) {
      redoBtn.style.opacity = canRedoBabylon(state) ? '1' : '0.5'
      redoBtn.style.pointerEvents = canRedoBabylon(state) ? 'auto' : 'none'
    }
  }

  undoBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    const snapshot = getBabylonUndoSnapshot(state)
    if (snapshot) {
      rebuildSceneFromBabylonSnapshot(snapshot, cm, wm, scene)
      showNotification(`↩️ ${snapshot.action}`, 'success')
      updateButtons()
    }
  })

  redoBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    const snapshot = getBabylonRedoSnapshot(state)
    if (snapshot) {
      rebuildSceneFromBabylonSnapshot(snapshot, cm, wm, scene)
      showNotification(`↪️ ${snapshot.action}`, 'success')
      updateButtons()
    }
  })

  on(AppEvents.STATE_CHANGED, updateButtons)
  updateButtons()
}