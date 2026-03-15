// ============================================================
// src/ui/viewButtons.ts
// ============================================================
import type { SceneManager } from '@scene/SceneManager'

export function setupViewButtons(sm: SceneManager): void {
  document.querySelectorAll<HTMLButtonElement>('.view-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset['view']
      if (v === 'top')   sm.setView('top')
      else if (v === 'front') sm.setView('front')
      else               sm.setView('perspective')
    })
  })
}
