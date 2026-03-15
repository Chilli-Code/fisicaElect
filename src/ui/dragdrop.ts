// ============================================================
// src/ui/dragdrop.ts
// ============================================================
import { emit, AppEvents } from '@core/events'
import { saveSnapshot } from '@core/history'
import type { AppState } from '@core/types'
import type { SceneManager } from '@scene/SceneManager'
import type { ComponentManager } from '@scene/ComponentManager'
import type { WireManager } from '@scene/WireManager'

export function setupDragDrop(
  state: AppState,
  container: HTMLElement,
  _sm: SceneManager,
  cm: ComponentManager,
  _wm: WireManager,
): void {
  document.querySelectorAll<HTMLElement>('.component-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      e.dataTransfer?.setData('componentType', card.dataset['type'] ?? '')
    })
  })

  container.addEventListener('dragover', e => e.preventDefault())
  container.addEventListener('drop', e => {
    e.preventDefault()
    const type = e.dataTransfer?.getData('componentType') as any
    if (!type) return
    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 20 - 10
    const z = ((e.clientY - rect.top) / rect.height) * 20 - 10
    saveSnapshot(state, `Antes de agregar ${type}`)
    cm.add(type, x, z)
    saveSnapshot(state, `Agregar ${type}`)
    emit(AppEvents.STATE_CHANGED, null)
  })
}
