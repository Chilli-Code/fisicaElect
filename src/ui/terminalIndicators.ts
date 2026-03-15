// ============================================================
// src/ui/terminalIndicators.ts
// ============================================================

import * as THREE from 'three'
import type { AppState } from '@core/types'

const indicators: THREE.Mesh[] = []

const COLORS: Record<string, number> = {
  positive: 0xff3b30,
  negative: 0x007aff,
  input:    0xff9500,
  output:   0x34c759,
}

export function showTerminalIndicators(
  state: AppState,
  scene: THREE.Scene,
): void {
  hideTerminalIndicators(scene)
  if (state.currentTool !== 'wire') return

  state.components.forEach(comp => {
    comp.terminals.forEach(term => {
      const color = COLORS[term.type] ?? 0xffffff

      const geo = new THREE.SphereGeometry(0.25, 32, 32)
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
      const indicator = new THREE.Mesh(geo, mat)

      const worldPos = new THREE.Vector3()
      term.mesh.getWorldPosition(worldPos)
      indicator.position.copy(worldPos)

      // Borde blanco
      const edge = new THREE.Mesh(
        new THREE.SphereGeometry(0.27, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.BackSide }),
      )
      indicator.add(edge)

      indicator.userData = {
        componentId: comp.id,
        terminalType: term.type,
        terminal: term,
        isIndicator: true,
      }
      scene.add(indicator)
      indicators.push(indicator)
    })
  })
}

export function hideTerminalIndicators(scene: THREE.Scene): void {
  indicators.forEach(ind => scene.remove(ind))
  indicators.length = 0
}

export function getIndicators(): THREE.Mesh[] {
  return indicators
}
