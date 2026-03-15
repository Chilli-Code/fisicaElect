// ============================================================
// src/utils/validation.ts
// Reglas de validación del circuito. Sin Three.js.
// ============================================================

import * as THREE from 'three'
import type { AppState, CircuitError } from '@core/types'

export function validateCircuit(state: AppState): CircuitError[] {
  const errors: CircuitError[] = []

  // Cortocircuito: cable + a - directo sin resistencia
  const battery = state.components.find(c => c.type === 'battery')
  if (battery) {
    const posWires = state.wires.filter(
      w => (w.startComp === battery.id && w.startTerm === 'positive') ||
           (w.endComp === battery.id && w.endTerm === 'positive'),
    )
    const negWires = state.wires.filter(
      w => (w.startComp === battery.id && w.startTerm === 'negative') ||
           (w.endComp === battery.id && w.endTerm === 'negative'),
    )
    const posComponents = new Set(posWires.map(w =>
      w.startComp === battery.id ? w.endComp : w.startComp,
    ))
    const negComponents = new Set(negWires.map(w =>
      w.startComp === battery.id ? w.endComp : w.startComp,
    ))
    posComponents.forEach(id => {
      if (negComponents.has(id)) {
        const comp = state.components.find(c => c.id === id)
        if (comp && comp.type !== 'resistor' && comp.type !== 'led' && comp.type !== 'voltmeter') {
          errors.push({
            message: '⚡ Cortocircuito',
            description: `${comp.name} conectado directo entre + y −`,
            solution: 'Agrega una resistencia para limitar la corriente',
            severity: 'error',
            componentIds: [id],
          })
        }
      }
    })
  }

  // LED sin resistencia protectora
  const leds = state.components.filter(c => c.type === 'led')
  const resistors = state.components.filter(c => c.type === 'resistor')
  if (leds.length > 0 && resistors.length === 0) {
    errors.push({
      message: '💡 LED sin protección',
      description: 'El LED puede quemarse sin resistencia en serie',
      solution: 'Agrega una resistencia de 100Ω-1kΩ',
      severity: 'warning',
    })
  }

  return errors
}

export function highlightErrors(
  errors: CircuitError[],
  state: AppState,
  scene: THREE.Scene,
): void {
  errors.forEach(error => {
    error.componentIds?.forEach(id => {
      const comp = state.components.find(c => c.id === id)
      if (!comp) return
      comp.mesh.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
          if (m.emissive) {
            m.emissive.setHex(0xff0000)
            m.emissiveIntensity = 0.5
          }
        }
      })
    })
  })
}

export function clearErrorHighlights(state: AppState): void {
  state.components.forEach(comp => {
    comp.mesh.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (m.emissive) {
          m.emissive.setHex(0x000000)
          m.emissiveIntensity = 0
        }
      }
    })
  })
}
