// ============================================================
// src/ui/experiments.ts
// ============================================================
import * as THREE from 'three'
import { emit, AppEvents } from '@core/events'
import { saveSnapshot } from '@core/history'
import { showNotification } from './notifications'
import type { AppState, ComponentType } from '@core/types'
import type { SceneManager } from '@scene/SceneManager'
import type { ComponentManager } from '@scene/ComponentManager'
import type { WireManager } from '@scene/WireManager'

// ---------------------------------------------------------------------------
// Definición de experimentos
// Cada experimento declara componentes y cables a crear
// ---------------------------------------------------------------------------
interface ExpComponent { type: ComponentType; x: number; z: number }
interface ExpWire { from: number; fromTerm: string; to: number; toTerm: string }
interface Experiment { nombre: string; components: ExpComponent[]; wires: ExpWire[] }

const EXPERIMENTS: Record<string, Experiment> = {
  ledSimple: {
    nombre: 'LED Simple',
    components: [
      { type: 'battery', x: -4, z: 0 },
      { type: 'switch',  x:  0, z: 0 },
      { type: 'led',     x:  4, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input' },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'positive' },
      { from: 2, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  ledConResistor: {
    nombre: 'LED + Resistencia',
    components: [
      { type: 'battery',  x: -5, z: 0 },
      { type: 'resistor', x: -1, z: 0 },
      { type: 'led',      x:  3, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input' },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'positive' },
      { from: 2, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  serieComplejo: {
    nombre: 'Serie Complejo',
    components: [
      { type: 'battery',  x: -6, z: 0 },
      { type: 'resistor', x: -2, z: 0 },
      { type: 'resistor', x:  2, z: 0 },
      { type: 'led',      x:  6, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input' },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'input' },
      { from: 2, fromTerm: 'output',   to: 3, toTerm: 'positive' },
      { from: 3, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  cortocircuito: {
    nombre: 'Cortocircuito ⚠️',
    components: [
      { type: 'battery', x: -3, z: 0 },
      { type: 'switch',  x:  3, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input' },
      { from: 1, fromTerm: 'output',   to: 0, toTerm: 'negative' },
    ],
  },
  ledReverso: {
    nombre: 'LED al Revés ❌',
    components: [
      { type: 'battery', x: -4, z: 0 },
      { type: 'led',     x:  2, z: 0 },
    ],
    wires: [
      // polaridad invertida intencionalmente
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'negative' },
      { from: 1, fromTerm: 'positive', to: 0, toTerm: 'negative' },
    ],
  },
  switchIncompleto: {
    nombre: 'Switch Incompleto',
    components: [
      { type: 'battery', x: -4, z: 0 },
      { type: 'switch',  x:  2, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input' },
      // Sin cable de salida — circuito abierto
    ],
  },
}

// ---------------------------------------------------------------------------
export function setupExperiments(
  state: AppState,
  sm: SceneManager,
  cm: ComponentManager,
  wm: WireManager,
): void {
  document.querySelectorAll<HTMLButtonElement>('.experiment-btn[data-exp]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset['exp']!
      const exp = EXPERIMENTS[key]
      if (!exp) return

      // Limpiar escena
      cm.clear()
      wm.clear()

      // Crear componentes
      const created = exp.components.map(c => cm.add(c.type, c.x, c.z))

      // Esperar un frame para que Three.js actualice las matrices de mundo
      requestAnimationFrame(() => {
        exp.wires.forEach(w => {
          const startComp = created[w.from]
          const endComp   = created[w.to]
          if (!startComp || !endComp) return
          const startTerm = startComp.terminals.find(t => t.type === w.fromTerm)
          const endTerm   = endComp.terminals.find(t => t.type === w.toTerm)
          if (startTerm && endTerm) wm.create(startComp, startTerm, endComp, endTerm)
        })

        saveSnapshot(state, `Experimento: ${exp.nombre}`)
        emit(AppEvents.STATE_CHANGED, null)
        showNotification('success', '🧪 Experimento', exp.nombre)
      })
    })
  })
}
