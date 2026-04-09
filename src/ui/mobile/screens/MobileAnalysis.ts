import type { AppState } from '@core/types'
import { calculateCircuitMetrics } from '@core/circuit'

// ─── Colores IEC por color hex ────────────────────────────────────────────────
function getWireLabel(baseColor: number): { label: string; color: string; standard: string } {
  const hex = baseColor.toString(16).padStart(6, '0').toUpperCase()
  const map: Record<string, { label: string; color: string; standard: string }> = {
    'FF0000': { label: 'Positivo DC',    color: '#FF0000', standard: 'NEC / IEC 60446' },
    '000000': { label: 'Negativo / GND', color: '#444444', standard: 'NEC / IEC 60446' },
    'FF8C00': { label: 'Salida a carga', color: '#FF8C00', standard: 'Convención interna' },
    '0000CD': { label: 'Retorno carga',  color: '#0000CD', standard: 'Convención interna' },
    '1E90FF': { label: 'Neutro AC',      color: '#1E90FF', standard: 'IEC 60446 (Europa)' },
    '8B4513': { label: 'Fase AC',        color: '#8B4513', standard: 'IEC 60446 (Europa)' },
    '808080': { label: 'Cable genérico', color: '#808080', standard: '—' },
  }
  return map[hex] ?? { label: 'Cable genérico', color: '#808080', standard: '—' }
}

// ─── Icono por tipo de componente ─────────────────────────────────────────────
function getComponentIcon(type: string): string {
  const icons: Record<string, string> = {
    battery: '🔋', resistor: '▬', led: '💡', switch: '⏚',
    voltmeter: 'V', ammeter: 'A', capacitor: '╫', inductor: '⊸',
    diode: '◄', transistor: '🔺', 'ac-source': '⚡',
  }
  return icons[type] ?? '⚙️'
}

// ─── Análisis del circuito ────────────────────────────────────────────────────
function analyzeCircuit(state: AppState) {
  const metrics = calculateCircuitMetrics(state)

  // Componentes conectados vs sueltos
  const connectedCompIds = new Set<string>()
  state.wires.forEach(w => {
    connectedCompIds.add(w.startComp)
    connectedCompIds.add(w.endComp)
  })

  const connectedComps = state.components.filter(c => connectedCompIds.has(c.id))
  const floatingComps  = state.components.filter(c => !connectedCompIds.has(c.id))

  // Tipos de cable únicos usados
  const wireTypes = new Map<number, number>()
  state.wires.forEach(w => {
    wireTypes.set(w.baseColor, (wireTypes.get(w.baseColor) ?? 0) + 1)
  })

  // Detectar tipo de circuito
  const hasAC  = state.components.some(c => c.type === 'ac-source')
  const hasDC  = state.components.some(c => c.type === 'battery')
  const circuitType = hasAC && hasDC ? 'Mixto (AC + DC)' : hasAC ? 'Corriente Alterna (AC)' : hasDC ? 'Corriente Directa (DC)' : 'Sin fuente'

  // Topología
  const resistors = state.components.filter(c => c.type === 'resistor')
  const hasSeries = resistors.length > 1 && state.wires.some(w => {
    const r1 = resistors.find(r => r.id === w.startComp || r.id === w.endComp)
    return r1 !== undefined
  })

  return { metrics, connectedComps, floatingComps, wireTypes, circuitType, hasSeries, resistors }
}

// ─── Render ───────────────────────────────────────────────────────────────────
export function renderAnalysis(state: AppState): void {
  const container = document.getElementById('m-analysis-content')
  if (!container) return

  if (state.components.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:#636366">
        <div style="font-size:56px;margin-bottom:16px">🔬</div>
        <div style="font-size:15px;font-weight:500;color:#aeaeb2;margin-bottom:6px">Sin circuito</div>
        <div style="font-size:13px">Construye un circuito en el área de trabajo para ver el análisis</div>
      </div>`
    return
  }

  const { metrics, connectedComps, floatingComps, wireTypes, circuitType, resistors } = analyzeCircuit(state)

  const isClosed   = metrics.status === 'Cerrado'
  const statusColor = isClosed ? '#34C759' : '#FF3B30'
  const statusIcon  = isClosed ? '✅' : '⚠️'

  container.innerHTML = `

    <!-- ESTADO GENERAL -->
    <div style="background:#2c2c2e;border-radius:14px;padding:16px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.06)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:13px;font-weight:600;color:#aeaeb2;text-transform:uppercase;letter-spacing:.06em">Estado del Circuito</span>
        <span style="font-size:13px;font-weight:700;color:${statusColor}">${statusIcon} ${metrics.status}</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span style="padding:4px 10px;background:rgba(255,255,255,0.06);border-radius:8px;font-size:12px;color:#aeaeb2">${circuitType}</span>
        <span style="padding:4px 10px;background:rgba(255,255,255,0.06);border-radius:8px;font-size:12px;color:#aeaeb2">${state.components.length} componentes</span>
        <span style="padding:4px 10px;background:rgba(255,255,255,0.06);border-radius:8px;font-size:12px;color:#aeaeb2">${state.wires.length} cables</span>
      </div>
    </div>

    <!-- MÉTRICAS ELÉCTRICAS -->
    <div style="margin-bottom:8px">
      <p style="font-size:11px;color:#636366;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px 4px">Métricas Eléctricas</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      ${[
        { label: 'Voltaje',     value: metrics.voltage,    icon: '⚡', color: '#FFD700' },
        { label: 'Corriente',   value: metrics.current,    icon: '↯',  color: '#007AFF' },
        { label: 'Resistencia', value: metrics.resistance, icon: '▬',  color: '#FF8C00' },
        { label: 'Potencia',    value: metrics.power,      icon: '⚙️', color: '#34C759' },
      ].map(m => `
        <div style="background:#2c2c2e;border-radius:12px;padding:14px;border:1px solid rgba(255,255,255,0.06)">
          <div style="font-size:11px;color:#636366;margin-bottom:6px">${m.icon} ${m.label}</div>
          <div style="font-size:20px;font-weight:700;color:${m.color}">${m.value}</div>
        </div>
      `).join('')}
    </div>

    <!-- COMPONENTES CONECTADOS -->
    ${connectedComps.length > 0 ? `
    <div style="margin-bottom:8px">
      <p style="font-size:11px;color:#636366;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px 4px">Componentes en Circuito</p>
    </div>
    <div style="background:#2c2c2e;border-radius:14px;overflow:hidden;margin-bottom:16px">
      ${connectedComps.map((c, i) => `
        <div style="
          display:flex;align-items:center;gap:12px;padding:12px 16px;
          ${i < connectedComps.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.06)' : ''}
        ">
          <span style="font-size:20px">${getComponentIcon(c.type)}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500;color:#f5f5f7">${c.name}</div>
            <div style="font-size:11px;color:#636366">${c.value} ${c.type === 'battery' ? 'V' : c.type === 'resistor' ? 'Ω' : c.type === 'capacitor' ? 'μF' : c.type === 'inductor' ? 'mH' : ''}</div>
          </div>
          <span style="font-size:10px;color:#34C759;background:rgba(52,199,89,0.12);padding:3px 8px;border-radius:6px">Conectado</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- COMPONENTES SUELTOS -->
    ${floatingComps.length > 0 ? `
    <div style="background:rgba(255,59,48,0.08);border:1px solid rgba(255,59,48,0.2);border-radius:14px;padding:14px 16px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:600;color:#FF3B30;margin-bottom:8px">⚠️ Componentes sin conectar</div>
      ${floatingComps.map(c => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span>${getComponentIcon(c.type)}</span>
          <span style="font-size:13px;color:#aeaeb2">${c.name}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- CABLES USADOS -->
    ${wireTypes.size > 0 ? `
    <div style="margin-bottom:8px">
      <p style="font-size:11px;color:#636366;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px 4px">Cables Utilizados (IEC 60446)</p>
    </div>
    <div style="background:#2c2c2e;border-radius:14px;overflow:hidden;margin-bottom:16px">
      ${Array.from(wireTypes.entries()).map(([color, count], i) => {
        const info = getWireLabel(color)
        return `
          <div style="
            display:flex;align-items:center;gap:12px;padding:12px 16px;
            ${i < wireTypes.size - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.06)' : ''}
          ">
            <div style="width:20px;height:20px;border-radius:50%;background:${info.color};flex-shrink:0;border:2px solid rgba(255,255,255,0.15)"></div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:500;color:#f5f5f7">${info.label}</div>
              <div style="font-size:11px;color:#636366">${info.standard}</div>
            </div>
            <span style="font-size:12px;color:#636366">${count} cable${count > 1 ? 's' : ''}</span>
          </div>`
      }).join('')}
    </div>
    ` : ''}

    <!-- LEY DE OHM APLICADA -->
    ${isClosed ? `
    <div style="margin-bottom:8px">
      <p style="font-size:11px;color:#636366;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px 4px">Fórmulas Aplicadas</p>
    </div>
    <div style="background:#2c2c2e;border-radius:14px;padding:16px;margin-bottom:16px">
      <div style="font-size:12px;color:#636366;margin-bottom:8px">Ley de Ohm</div>
      <div style="font-size:14px;color:#f5f5f7;font-family:monospace;margin-bottom:4px">V = ${metrics.voltage} = I × R</div>
      <div style="font-size:14px;color:#f5f5f7;font-family:monospace;margin-bottom:4px">I = ${metrics.current} = V ÷ R</div>
      <div style="font-size:14px;color:#f5f5f7;font-family:monospace;margin-bottom:12px">P = ${metrics.power} = V × I</div>
      ${resistors.length > 1 ? `
        <div style="font-size:12px;color:#636366;margin-bottom:4px">Resistencias en serie</div>
        <div style="font-size:13px;color:#f5f5f7;font-family:monospace">
          Rtotal = ${resistors.map(r => r.value + 'Ω').join(' + ')} = ${resistors.reduce((a, r) => a + r.value, 0)}Ω
        </div>
      ` : ''}
    </div>
    ` : `
    <div style="background:rgba(255,149,0,0.08);border:1px solid rgba(255,149,0,0.2);border-radius:14px;padding:14px 16px;margin-bottom:16px">
      <div style="font-size:13px;color:#FF9500;font-weight:600;margin-bottom:4px">💡 Circuito abierto</div>
      <div style="font-size:12px;color:#aeaeb2;line-height:1.5">
        Conecta todos los componentes formando un loop cerrado desde el positivo de la batería hasta el negativo para que fluya corriente.
      </div>
    </div>
    `}
  `
}

// ─── Setup ────────────────────────────────────────────────────────────────────
export function setupMobileAnalysis(state: AppState): void {
  document.getElementById('mobile-ui')?.insertAdjacentHTML('beforeend', `
    <div id="m-analysis-screen" style="
      display:none;position:fixed;
      top:0;left:0;right:0;bottom:60px;
      background:#111112;flex-direction:column;z-index:100;
    ">
      <!-- Header -->
      <div style="
        padding:16px 20px;padding-top:calc(16px + env(safe-area-inset-top));
        background:#1c1c1e;border-bottom:1px solid rgba(255,255,255,0.08)
      ">
        <span style="font-size:17px;font-weight:700;color:#f5f5f7">Análisis</span>
        <div style="font-size:12px;color:#636366;margin-top:2px">Resumen del circuito actual</div>
      </div>

      <!-- Tabs: Análisis / Experimentos -->
      <div style="
        display:flex;background:#1c1c1e;
        border-bottom:1px solid rgba(255,255,255,0.06)
      ">
        <button id="m-tab-analysis" style="
          flex:1;padding:10px;background:transparent;border:none;
          color:#007AFF;font-size:13px;font-weight:600;cursor:pointer;
          border-bottom:2px solid #007AFF;
        ">Análisis</button>
        <button id="m-tab-experiments" style="
          flex:1;padding:10px;background:transparent;border:none;
          color:#636366;font-size:13px;cursor:pointer;
          border-bottom:2px solid transparent;
        ">Experimentos</button>
      </div>

      <!-- Contenido análisis -->
      <div id="m-analysis-content" style="flex:1;overflow-y:auto;padding:14px 16px;display:block"></div>

      <!-- Contenido experimentos -->
      <div id="m-experiments-content" style="flex:1;overflow-y:auto;padding:14px 16px;display:none"></div>
    </div>
  `)

  // ── Tabs ──
  const tabAnalysis     = document.getElementById('m-tab-analysis')!
  const tabExperiments  = document.getElementById('m-tab-experiments')!
  const contentAnalysis = document.getElementById('m-analysis-content')!
  const contentExp      = document.getElementById('m-experiments-content')!

  tabAnalysis.addEventListener('click', () => {
    tabAnalysis.style.color       = '#007AFF'
    tabAnalysis.style.borderColor = '#007AFF'
    tabExperiments.style.color       = '#636366'
    tabExperiments.style.borderColor = 'transparent'
    contentAnalysis.style.display = 'block'
    contentExp.style.display      = 'none'
    renderAnalysis(state)
  })

  tabExperiments.addEventListener('click', () => {
    tabExperiments.style.color       = '#007AFF'
    tabExperiments.style.borderColor = '#007AFF'
    tabAnalysis.style.color       = '#636366'
    tabAnalysis.style.borderColor = 'transparent'
    contentAnalysis.style.display = 'none'
    contentExp.style.display      = 'block'
  })
}