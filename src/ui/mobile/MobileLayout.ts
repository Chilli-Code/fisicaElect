import type { AppState, ComponentType } from '@core/types'
import { emit, AppEvents } from '@core/events'
import { saveSnapshot } from '@core/history'
import { calculateCircuitMetrics } from '@core/circuit'
import type { BabylonSceneManager } from '@scene/BabylonSceneManager'
import type { BabylonComponentManager } from '@scene/BabylonComponentManager'
import type { BabylonWireManager } from '@scene/BabylonWireManager'

export function setupMobileLayout(
  state: AppState,
  sm: BabylonSceneManager,
  cm: BabylonComponentManager,
  wm: BabylonWireManager,
): void {
  // Ocultar todo el UI desktop
const hide = (sel: string) => {
  const el = document.querySelector<HTMLElement>(sel)
  if (el) el.style.display = 'none'
}
hide('.menu-bar')
hide('.sidebar')
hide('.inspector')
hide('.toolbar')
hide('.bottom-toolbar')

document.addEventListener('componentDragStart', () => {
  sm.camera.detachControl()
})
document.addEventListener('componentDragEnd', () => {
  sm.camera.attachControl(
    document.getElementById('three-canvas') as HTMLCanvasElement, true
  )
})

// Hacer que el canvas-area ocupe toda la pantalla
const canvasArea = document.querySelector<HTMLElement>('.canvas-area')
if (canvasArea) {
  canvasArea.style.cssText = 'position:fixed;inset:0;width:100%!important;height:100%!important;z-index:0;margin:0;padding:0'
}
  // Canvas ocupa toda la pantalla
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement
  canvas.style.cssText = 'position:fixed;inset:0;width:100%!important;height:100%!important;z-index:0'

  // Inyectar UI mobile
  document.body.insertAdjacentHTML('beforeend', buildMobileUI())

  // Conectar lógica
  setupComponentGrid(state, cm)
  setupSimButton(state)
  setupNavigation()
  setupTools(state)
  updateMobileMetrics(state)

  // Actualizar métricas cuando cambia estado
  document.addEventListener('stateChanged', () => updateMobileMetrics(state))
}

function buildMobileUI(): string {
  return `
  <div id="mobile-ui">

    <div id="m-topbar" class="m-topbar">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="horizontal-icon" style="width:28px;height:28px;background:#007AFF;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px">⚡</div>
        <span style="color:#f5f5f7;font-size:14px;font-weight:500">Circuit Lab</span>
      </div>
      <span id="m-user-avatar" style="font-size:20px">🧑‍🔬</span>
    </div>

    <div id="m-floating-tools" class="horizontal-m-floating-tools">
      <button class="m-fab m-fab-active" data-tool="select">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 2l10 6-6 1-2 5z"/></svg>
      </button>
      
      <button class="m-fab" data-tool="wire">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 8h12M10 5l3 3-3 3"/></svg>
      </button>
      <button class="m-fab" data-tool="move">
       <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3V15M3 9H15M6 6L3 9L6 12M12 6L15 9L12 12M6 12L9 15L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
              </svg>
      </button>
      <button class="m-fab" id="m-undo">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 6h7a4 4 0 010 8H5"/><path d="M5 3L3 6l2 3"/></svg>
      </button>
    </div>

    <button id="m-sim-btn">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M3 2l9 5-9 5V2z"/></svg>
    </button>

    <button id="m-add-btn" class="horizontal-m-add-btn">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M11 4v14M4 11h14"/></svg>
    </button>

    <div id="m-metrics" class="horizontal-m-metrics">
      <div class="m-metric"><div class="m-val" id="m-voltage">0V</div><div class="m-lbl">Voltaje</div></div>
      <div class="m-sep"></div>
      <div class="m-metric"><div class="m-val" id="m-current">0A</div><div class="m-lbl">Corriente</div></div>
      <div class="m-sep"></div>
      <div class="m-metric"><div class="m-val" id="m-resistance">∞Ω</div><div class="m-lbl">Resist.</div></div>
      <div class="m-sep"></div>
      <div class="m-metric"><div class="m-val" id="m-status" style="color:#FF3B30">Abierto</div><div class="m-lbl">Estado</div></div>
    </div>

    <div id="m-sheet-overlay"></div>
    <div id="m-sheet" class="horizontal-m-sheet">
      <div id="m-sheet-handle"></div>
      <p style="font-size:11px;color:#636366;text-transform:uppercase;letter-spacing:.06em;padding:0 16px 10px;margin:0">Agregar componente</p>
      <div class="container-component-grid">
      <div id="m-comp-grid" class="horizontal-m-comp-grid">
        ${COMPONENTS.map(c => `
          <div class="m-comp" data-type="${c.type}">
            <div class="mc-icon">${c.icon}</div>
            <div class="mc-name">${c.name}</div>
            <div class="mc-sub">${c.sub}</div>
          </div>`).join('')}
      </div>
      </div>
    </div>

    <div id="m-bottom-nav" class="horizontal-m-bottom-nav">
      ${NAV_ITEMS.map((n, i) => `
        <button class="m-nav ${i === 0 ? 'm-nav-active' : ''}" data-view="${n.view}">
          ${n.icon}
          <span>${n.label}</span>
        </button>`).join('')}
    </div>

  </div>`
}

const COMPONENTS = [
  { type: 'battery',     icon: '🔋', name: 'Batería',    sub: '9V DC'    },
  { type: 'resistor',    icon: '▬',  name: 'Resist.',    sub: '100Ω'     },
  { type: 'led',         icon: '💡', name: 'LED',        sub: 'Emisor'   },
  { type: 'switch',      icon: '⏚',  name: 'Switch',     sub: 'ON/OFF'   },
  { type: 'voltmeter',   icon: 'V',  name: 'Voltím.',    sub: 'Medir V'  },
  { type: 'ammeter',     icon: 'A',  name: 'Amper.',     sub: 'Medir A'  },
  { type: 'capacitor',   icon: '╫',  name: 'Capac.',     sub: 'Faradios' },
  { type: 'inductor',    icon: '⊸',  name: 'Inductor',   sub: 'Henrios'  },
  { type: 'diode',       icon: '◄',  name: 'Diodo',      sub: '0.7V'     },
  { type: 'transistor',  icon: '🔺', name: 'Transistor', sub: 'NPN'      },
  { type: 'ac-source',   icon: '⚡', name: 'Fuente AC',  sub: '120V'     },
]

const NAV_ITEMS = [
  { view: 'workspace', label: 'Trabajo',   icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="16" height="16" rx="2"/><path d="M7 10h6M10 7v6"/></svg>` },
  { view: 'library',   label: 'Biblioteca', icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 6h12M4 10h8M4 14h10"/></svg>` },
  { view: 'analysis',  label: 'Análisis',   icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 14l4-4 3 3 5-7"/></svg>` },
  { view: 'settings',  label: 'Config',     icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2"/></svg>` },
]

function setupComponentGrid(state: AppState, cm: BabylonComponentManager): void {
  document.querySelectorAll<HTMLElement>('.m-comp').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset['type'] as ComponentType
      if (!type) return
      saveSnapshot(state, `Agregar ${type}`)
      cm.add(type, (Math.random() * 10) - 5, (Math.random() * 10) - 5)
      saveSnapshot(state, `Agregado ${type}`)
      closeSheet()
      emit(AppEvents.STATE_CHANGED, null)
      updateMobileMetrics(state)
    })
  })

  document.getElementById('m-add-btn')?.addEventListener('click', openSheet)
  document.getElementById('m-sheet-overlay')?.addEventListener('click', closeSheet)
}

function openSheet(): void {
  document.getElementById('m-sheet')?.classList.add('m-sheet-open')
  document.getElementById('m-sheet-overlay')?.classList.add('m-overlay-open')
}

function closeSheet(): void {
  document.getElementById('m-sheet')?.classList.remove('m-sheet-open')
  document.getElementById('m-sheet-overlay')?.classList.remove('m-overlay-open')
}

function setupSimButton(state: AppState): void {
  document.getElementById('m-sim-btn')?.addEventListener('click', () => {
    state.isSimulating = !state.isSimulating
    const btn = document.getElementById('m-sim-btn')!
    btn.style.background = state.isSimulating ? '#FF3B30' : '#34C759'
    btn.innerHTML = state.isSimulating
      ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="white"><rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M3 2l9 5-9 5V2z"/></svg>`
    emit(AppEvents.STATE_CHANGED, null)
    updateMobileMetrics(state)
  })
}
export let mobileCurrentTool = 'select'

function setupTools(state: AppState): void {
  document.querySelectorAll<HTMLButtonElement>('.m-fab[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      document.querySelectorAll('.m-fab[data-tool]').forEach(b => b.classList.remove('m-fab-active'))
      btn.classList.add('m-fab-active')
      mobileCurrentTool = btn.dataset['tool'] ?? 'select'
      state.currentTool = mobileCurrentTool as any
    })
  })
}

function setupNavigation(): void {
  document.querySelectorAll<HTMLButtonElement>('.m-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.m-nav').forEach(b => b.classList.remove('m-nav-active'))
      btn.classList.add('m-nav-active')
    })
  })
}


function updateMobileMetrics(state: AppState): void {
  const metrics = calculateCircuitMetrics(state)
  const set = (id: string, val: string) => {
    const el = document.getElementById(id)
    if (el) el.textContent = val
  }
  set('m-voltage', metrics.voltage)
  set('m-current', metrics.current)
  set('m-resistance', metrics.resistance)
  const statusEl = document.getElementById('m-status')
  if (statusEl) {
    statusEl.textContent = metrics.status
    statusEl.style.color = metrics.status === 'Cerrado' ? '#34C759' : '#FF3B30'
  }
}


