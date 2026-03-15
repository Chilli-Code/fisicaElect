// ============================================================
// src/ui/inspector.ts
// ============================================================

import { calculateCircuitMetrics, getVoltmeterReading } from '@core/circuit'
import type { AppState, ComponentTemplateMap } from '@core/types'

export function setupInspector(_state: AppState, _templates: ComponentTemplateMap): void {
  // Colapsar inspector
// ANTES:
document.querySelector('.collapse-btn')?.addEventListener('click', () => {
  document.querySelector('.inspector-content')?.classList.toggle('collapsed')
})

// DESPUÉS:
document.getElementById('collapse-inspector')?.addEventListener('click', () => {
  const inspector = document.querySelector('.inspector') as HTMLElement
  const btn = document.getElementById('collapse-inspector')!
  const isCollapsed = inspector.classList.toggle('inspector-collapsed')
  btn.textContent = isCollapsed ? '+' : '−'
})
}

export function updateInspector(state: AppState, _templates: ComponentTemplateMap): void {
  // Contadores
  const compCount = document.getElementById('comp-count')
  const wireCount = document.getElementById('wire-count')
  if (compCount) compCount.textContent = String(state.components.length)
  if (wireCount) wireCount.textContent = String(state.wires.length)

  // Métricas del circuito
  const metrics = calculateCircuitMetrics(state)
  const set = (id: string, val: string) => {
    const el = document.getElementById(id)
    if (el) el.textContent = val
  }
  set('total-voltage',    metrics.voltage)
  set('total-current',    metrics.current)
  set('total-resistance', metrics.resistance)
  set('total-power',      metrics.power)
  set('circuit-status',   metrics.status)
}

export function showComponentProperties(
  state: AppState,
  templates: ComponentTemplateMap,
): void {
  if (!state.selected) return
  const comp = state.selected
  const template = templates[comp.type]
  const propsSection = document.getElementById('component-props')
  const propsContent = document.getElementById('props-content')
  if (!propsSection || !propsContent) return

  const metrics = calculateCircuitMetrics(state)

  if (comp.type === 'voltmeter') {
    propsSection.style.display = 'block'
    propsContent.innerHTML = `
      <div style="margin-bottom:12px">
        <div style="font-size:11px;color:#999;margin-bottom:8px">Leyendo</div>
<div style="font-size:28px;font-weight:700;color:#34C759">${getVoltmeterReading(state, comp.id)}</div>
<div style="font-size:11px;color:#999;margin-top:4px">caída de voltaje en paralelo</div>
      </div>
    `
    return
  }

  if (comp.type === 'ammeter') {
    propsSection.style.display = 'block'
    propsContent.innerHTML = `
      <div style="margin-bottom:12px">
        <div style="font-size:11px;color:#999;margin-bottom:8px">Leyendo</div>
        <div style="font-size:28px;font-weight:700;color:#64D2FF">${metrics.current}</div>
        <div style="font-size:11px;color:#999;margin-top:4px">corriente del circuito</div>
      </div>
    `
    return
  }

  propsSection.style.display = 'block'
  propsContent.innerHTML = `
    <div style="margin-bottom:12px">
      <div style="font-size:11px;color:#999;margin-bottom:4px">Tipo</div>
      <div style="font-size:14px">${comp.name}</div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:11px;color:#999;margin-bottom:4px">Valor</div>
      <input
        type="number"
        value="${comp.value}"
        data-comp-id="${comp.id}"
        class="comp-value-input"
        style="width:100%;padding:8px;background:rgba(0,0,0,0.3);border:1px solid #444;border-radius:6px;color:white"
      >
      <div style="font-size:11px;color:#999;margin-top:4px">${template.unit}</div>
    </div>
    <button
      data-delete-id="${comp.id}"
      style="width:100%;padding:10px;background:#FF3B30;border:none;border-radius:8px;color:white;cursor:pointer"
    >Eliminar</button>
  `
}
