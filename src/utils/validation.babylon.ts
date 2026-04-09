// ============================================================
// src/utils/validation.babylon.ts
// Highlight de errores para Babylon.js (Mobile) - SOLO ESTO
// ============================================================

import type { AppState, CircuitError } from '@core/types'
import { Color3 } from '@babylonjs/core/Maths/math.color'

export function highlightErrorsBabylon(
  errors: CircuitError[],
  state: AppState,
  scene: any  // Babylon Scene
): void {
  errors.forEach(error => {
    error.componentIds?.forEach(id => {
      const comp = state.components.find(c => c.id === id)
      if (!comp) return
      
      const node = scene?.getNodeByName?.(id) as any
      if (!node) return
      
      node.getChildMeshes?.().forEach((mesh: any) => {
        if (mesh.metadata?.isTerminal) return  // Ignorar terminales
        const mat = mesh.material
        if (mat) {
          mat.emissiveColor = new Color3(1, 0, 0).scale(0.8)
          mat.diffuseColor = new Color3(0.3, 0, 0)
        }
      })
    })
  })
}

export function clearErrorHighlightsBabylon(
  state: AppState,
  scene: any
): void {
  state.components.forEach(comp => {
    const node = scene?.getNodeByName?.(comp.id) as any
    if (!node) return
    node.getChildMeshes?.().forEach((mesh: any) => {
      if (mesh.metadata?.isTerminal) return
      const mat = mesh.material
      if (mat) {
        mat.emissiveColor = new Color3(0, 0, 0)
      }
    })
  })
}