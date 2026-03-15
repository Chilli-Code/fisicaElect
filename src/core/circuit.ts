// ============================================================
// src/core/circuit.ts
// Cálculo de métricas eléctricas. Sin dependencias de Three.js.
// ============================================================

import type { AppState, CircuitMetrics, CircuitComponent } from './types'

// ── Detectar si el circuito está cerrado ─────────────────────
export function isCircuitClosed(state: AppState): boolean {
  const batteries = state.components.filter(c => c.type === 'battery' || c.type === 'ac-source')
  if (batteries.length === 0) return false

  for (const battery of batteries) {
    const posTerminal = battery.terminals.find(t => t.type === 'positive')
    const negTerminal = battery.terminals.find(t => t.type === 'negative')
    if (!posTerminal || !negTerminal) continue

    const hasPosWire = state.wires.some(
      w => (w.startComp === battery.id && w.startTerm === 'positive') ||
           (w.endComp === battery.id && w.endTerm === 'positive')
    )
    const hasNegWire = state.wires.some(
      w => (w.startComp === battery.id && w.startTerm === 'negative') ||
           (w.endComp === battery.id && w.endTerm === 'negative')
    )
    if (hasPosWire && hasNegWire) return true
  }
  return false
}

// ── Verificar si hay switches abiertos bloqueando el circuito
function hasOpenSwitch(state: AppState): boolean {
  return state.components.some(c => c.type === 'switch' && c.isOn === false)
}

// ── Calcular resistencia total en serie ──────────────────────
function totalResistance(state: AppState): number {
  return state.components
    .filter(c => c.type === 'resistor')
    .reduce((sum, c) => sum + c.value, 0)
}

// ── Voltaje total de fuentes ──────────────────────────────────
function totalVoltage(state: AppState): number {
  return state.components
    .filter(c => c.type === 'battery' || c.type === 'ac-source')
    .reduce((sum, c) => sum + c.value, 0)
}

// ── Métricas del circuito ─────────────────────────────────────
export function calculateCircuitMetrics(state: AppState): CircuitMetrics {
  const closed = isCircuitClosed(state)
  const blocked = hasOpenSwitch(state)
  const hasCurrent = closed && !blocked && state.isSimulating

  const voltage = totalVoltage(state)
  const resistance = totalResistance(state)
  const current = (hasCurrent && resistance > 0) ? voltage / resistance : 0
  const power = voltage * current

  const resistanceStr = resistance === 0 ? '∞ Ω' : `${resistance.toFixed(1)} Ω`

  return {
    voltage: `${voltage.toFixed(1)} V`,
    current: `${current.toFixed(2)} A`,
    resistance: resistanceStr,
    power: `${power.toFixed(2)} W`,
    status: closed ? (blocked ? 'Abierto' : 'Cerrado') : 'Abierto',
    hasCurrent,
  }
}

export function calculateCurrentFlow(state: AppState): { hasCurrent: boolean } {
  return { hasCurrent: calculateCircuitMetrics(state).hasCurrent }
}

// ── Toggle switch ─────────────────────────────────────────────
export function toggleSwitch(component: CircuitComponent): boolean {
  component.isOn = !(component.isOn ?? true)
  return component.isOn
}

// ── Actualizar animación LED ──────────────────────────────────
export function updateLEDAnimation(component: CircuitComponent, hasCurrent: boolean): void {
  if (!component.mesh) return
  component.mesh.traverse(child => {
    // @ts-expect-error — material puede tener emissive si es MeshStandardMaterial
    if (child.isMesh && child.material?.emissive) {
      // @ts-expect-error
      child.material.emissiveIntensity = hasCurrent ? 1.5 : 0
    }
  })
}

export function getVoltmeterReading(state: AppState, voltmeterId: string): string {
  const metrics = calculateCircuitMetrics(state)
  if (!metrics.hasCurrent) return '0.00 V'

  const current = parseFloat(metrics.current)
  const wires = state.wires.filter(
    w => w.startComp === voltmeterId || w.endComp === voltmeterId
  )
  if (wires.length < 2) return '0.00 V'

  const connectedIds = wires.map(w =>
    w.startComp === voltmeterId ? w.endComp : w.startComp
  )
  const parallelComp = state.components.find(c => connectedIds.includes(c.id))
  if (!parallelComp) return '0.00 V'

  if (parallelComp.type === 'resistor') return `${(current * parallelComp.value).toFixed(2)} V`
  if (parallelComp.type === 'led')      return '1.80 V'
  if (parallelComp.type === 'battery')  return `${parallelComp.value.toFixed(2)} V`

  return metrics.voltage
}
