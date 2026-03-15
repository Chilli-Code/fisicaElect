// ============================================================
// src/ui/keyboard.ts
// ============================================================
import { emit, AppEvents } from '@core/events'
import { getUndoSnapshot, getRedoSnapshot } from '@core/history'
import type { AppState } from '@core/types'
import type { SceneManager } from '@scene/SceneManager'
import type { ComponentManager } from '@scene/ComponentManager'
import type { WireManager } from '@scene/WireManager'
import { showTerminalIndicators, hideTerminalIndicators } from './terminalIndicators'
import { showNotification } from './notifications'

export function setupKeyboard(
  state: AppState,
  sm: SceneManager,
  cm: ComponentManager,
  wm: WireManager,
): void {
  document.addEventListener('keydown', (e) => {
    const inInput = (e.target as HTMLElement).matches('input, textarea, select')

    // Ctrl+Z Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      const snap = getUndoSnapshot(state)
      if (!snap) { showNotification('info', 'Deshacer', 'Sin más acciones'); return }
      cm.clear(); wm.clear()
      snap.components.forEach(c => cm.restoreFromSnapshot(c))
      state.idCounter = snap.idCounter
      emit(AppEvents.STATE_CHANGED, null)
      showNotification('success', 'Deshacer', snap.action)
      return
    }
    // Ctrl+Y / Ctrl+Shift+Z Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault()
      const snap = getRedoSnapshot(state)
      if (!snap) { showNotification('info', 'Rehacer', 'Sin más acciones'); return }
      cm.clear(); wm.clear()
      snap.components.forEach(c => cm.restoreFromSnapshot(c))
      state.idCounter = snap.idCounter
      emit(AppEvents.STATE_CHANGED, null)
      showNotification('success', 'Rehacer', snap.action)
      return
    }

    if (inInput) return

    const toolMap: Record<string, string> = { v: 'select', c: 'wire', m: 'move' }
    const tool = toolMap[e.key.toLowerCase()]
    if (tool) {
      e.preventDefault()
      document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'))
      document.querySelector<HTMLElement>(`.tool-button[data-tool="${tool}"]`)?.classList.add('active')
      state.currentTool = tool as any
      tool === 'wire' ? showTerminalIndicators(state, sm.scene) : hideTerminalIndicators(sm.scene)
      showNotification('info', 'Herramienta', { select: 'Seleccionar', wire: 'Conectar', move: 'Mover' }[tool]!)
      return
    }

    // Movimiento con flechas
    if (!state.selected) return
    const speed = 0.5
    const mesh = state.selected.mesh
    let moved = false
    if (['ArrowUp', 'w'].includes(e.key))    { mesh.position.z -= speed; state.selected.position.z -= speed; moved = true }
    if (['ArrowDown', 's'].includes(e.key))  { mesh.position.z += speed; state.selected.position.z += speed; moved = true }
    if (['ArrowLeft', 'a'].includes(e.key))  { mesh.position.x -= speed; state.selected.position.x -= speed; moved = true }
    if (['ArrowRight', 'd'].includes(e.key)) { mesh.position.x += speed; state.selected.position.x += speed; moved = true }
    if (['Delete', 'Backspace'].includes(e.key)) {
      wm.removeAllByComponent(state.selected.id)
      cm.delete(state.selected.id)
      state.selected = null
      e.preventDefault()
      emit(AppEvents.STATE_CHANGED, null)
    }
    if (moved) { emit(AppEvents.STATE_CHANGED, null); e.preventDefault() }
  })
}
