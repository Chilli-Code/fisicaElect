import type { AppState } from '@core/types'
import { emit, AppEvents } from '@core/events'
import { calculateCircuitMetrics } from '@core/circuit'
import { showNotification } from './MobileNotifications'
import { playSound } from './screens/MobileSettings'


export function updateMobileMetrics(state: AppState): void {
  const metrics = calculateCircuitMetrics(state)
  const set = (id: string, val: string) => {
    const el = document.getElementById(id)
    if (el) el.textContent = val
  }
  set('m-voltage',    metrics.voltage)
  set('m-current',    metrics.current)
  set('m-resistance', metrics.resistance)
  set('m-power',      metrics.power)     // ← agregar

  const statusEl = document.getElementById('m-status')
  if (statusEl) {
    statusEl.textContent = metrics.status
    statusEl.style.color = metrics.status === 'Cerrado' ? '#34C759' : '#FF3B30'
  }
}

export function setupSimButton(state: AppState): void {
  document.getElementById('m-sim-btn')?.addEventListener('click', () => {
    if (!state.isSimulating) {
      const groups = detectIndependentCircuits(state)
      const connectedGroups = groups.filter(group =>
        group.some(compId =>
          state.wires.some(w => w.startComp === compId || w.endComp === compId)
        )
      )
      if (connectedGroups.length > 1) {
        showNotification('⚠️ Hay 2 circuitos en la escena. Desconecta uno para simular.', 'warning')
        
        return
      }
    }

    state.isSimulating = !state.isSimulating
    playSound('simulate')
    const btn = document.getElementById('m-sim-btn')!
    btn.style.background = state.isSimulating ? '#FF3B30' : '#34C759'
    btn.innerHTML = state.isSimulating
      ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="white"><rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M3 2l9 5-9 5V2z"/></svg>`

    emit(AppEvents.STATE_CHANGED, null)
    updateMobileMetrics(state)
  })
}

function detectIndependentCircuits(state: AppState): string[][] {
  const adjacency = new Map<string, Set<string>>()
  state.components.forEach(c => adjacency.set(c.id, new Set()))
  state.wires.forEach(wire => {
    adjacency.get(wire.startComp)?.add(wire.endComp)
    adjacency.get(wire.endComp)?.add(wire.startComp)
  })

  const visited = new Set<string>()
  const groups: string[][] = []

  state.components.forEach(comp => {
    if (visited.has(comp.id)) return
    const group: string[] = []
    const queue = [comp.id]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      group.push(current)
      adjacency.get(current)?.forEach(n => { if (!visited.has(n)) queue.push(n) })
    }
    groups.push(group)
  })

  return groups
}