import type { AppState } from '@core/types'
import type { BabylonSceneManager } from '@scene/BabylonSceneManager'
import type { BabylonComponentManager } from '@scene/BabylonComponentManager'
import type { BabylonWireManager } from '@scene/BabylonWireManager'
import { on, AppEvents } from '@core/events'
import { saveBabylonSnapshot } from '@core/babylon-history'
import { COMPONENTS } from './MobileComponents'
import { setupComponentGrid } from './MobileComponents'
import { setupSimButton, updateMobileMetrics } from './MobileMetrics'
import { setupTools } from './MobileTools'
import { setupEditPopup } from './MobileEditPopup'
import { setupUndoRedo } from './MobileUndoRedo'
import { setupMobileViews } from './MobileViews'
import { setupMobileSettings } from './screens/MobileSettings'
import { setupMobileLibrary, renderLibrary } from './screens/MobileLibrary'
import { setupMobileExperiments } from './screens/MobileExperiments'
import { setupMobileAnalysis, renderAnalysis } from './screens/MobileAnalysis'


const NAV_ITEMS = [
  { view: 'workspace', label: 'Trabajo',   icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="16" height="16" rx="2"/><path d="M7 10h6M10 7v6"/></svg>` },
  { view: 'library',   label: 'Biblioteca',icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 6h12M4 10h8M4 14h10"/></svg>` },
  { view: 'analysis',  label: 'Análisis',  icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 14l4-4 3 3 5-7"/></svg>` },
  { view: 'settings',  label: 'Config',    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2"/></svg>` },
]

function buildMobileUI(): string {
  return `
  <div id="mobile-ui">
    <div id="m-topbar" class="m-topbar">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:28px;height:28px;background:#007AFF;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px">⚡</div>
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
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3V15M3 9H15M6 6L3 9L6 12M12 6L15 9L12 12M6 12L9 15L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
      <button class="m-fab" data-tool="delete">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h12M8 6V4h4v2M9 10v5M11 10v5M5 6l1 11h8l1-11"/></svg>
      </button>
      <button class="m-fab" id="m-undo">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 6h7a4 4 0 010 8H5"/><path d="M5 3L3 6l2 3"/></svg>
      </button>
      <button class="m-fab" id="m-redo" style="opacity:0.5;pointer-events:none">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M13 6H6a4 4 0 000 8h8"/><path d="M11 3l2 3-2 3"/></svg>
      </button>
    </div>

    <button id="m-sim-btn">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M3 2l9 5-9 5V2z"/></svg>
    </button>

    <button id="m-edit-btn" style="display:none;position:absolute;top:116px;right:12px;width:40px;height:40px;border-radius:12px;background:#007AFF;border:none;cursor:pointer;align-items:center;justify-content:center;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,0.2)">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="1.5"><path d="M13 3L17 7L7 17H3V13L13 3Z"/></svg>
    </button>

    <div id="m-sheet-overlay"></div>

    <div id="m-edit-popup" class="horizontal-m-sheet margn" style="display:none">
      <div id="m-sheet-handle"></div>
      <p id="edit-popup-title" style="font-size:11px;color:#636366;text-transform:uppercase;letter-spacing:.06em;padding:0 16px 10px;margin:0">Editar componente</p>
      <div id="edit-popup-fields" style="padding:0 16px 20px"></div>
      <button id="save-component-btn" style="margin:0 16px 20px;padding:12px;background:#007AFF;border:none;border-radius:12px;color:white;font-size:14px;font-weight:500;cursor:pointer">Guardar cambios</button>
    </div>

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
  <div class="m-metric"><div class="m-val" id="m-power">0W</div><div class="m-lbl">Potencia</div></div>
  <div class="m-sep"></div>
  <div class="m-metric"><div class="m-val" id="m-status" style="color:#FF3B30">Abierto</div><div class="m-lbl">Estado</div></div>
</div>

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

export function setupMobileLayout(
  state: AppState,
  sm: BabylonSceneManager,
  cm: BabylonComponentManager,
  wm: BabylonWireManager,
): void {
  saveBabylonSnapshot(state, 'Estado inicial')

  const restoreData = sessionStorage.getItem('babylon-undo-restore')
  if (restoreData) {
    try {
      const snapshot = JSON.parse(restoreData)
      state.idCounter = snapshot.idCounter
      sessionStorage.removeItem('babylon-undo-restore')
    } catch (e) {
      console.error('Error restoring state:', e)
    }
  }

  // Ocultar UI desktop
  ;['.menu-bar', '.sidebar', '.inspector', '.toolbar', '.bottom-toolbar'].forEach(sel => {
    const el = document.querySelector<HTMLElement>(sel)
    if (el) el.style.display = 'none'
  })

  // Canvas fullscreen
  const canvasArea = document.querySelector<HTMLElement>('.canvas-area')
  if (canvasArea) canvasArea.style.cssText = 'position:fixed;inset:0;width:100%!important;height:100%!important;z-index:0;margin:0;padding:0'
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement
  canvas.style.cssText = 'position:fixed;inset:0;width:100%!important;height:100%!important;z-index:0'

  // Inyectar UI
  document.body.insertAdjacentHTML('beforeend', buildMobileUI())

  // Setup de cada módulo
  setupComponentGrid(state, cm)
  setupSimButton(state)
  setupTools(state, document.getElementById('m-edit-btn'), sm.scene)
  updateMobileMetrics(state)
  setupEditPopup(state, cm)
  setupUndoRedo(state, sm.scene, cm, wm)
  setupMobileLibrary(state, cm, wm)
  setupMobileAnalysis(state)
setupMobileExperiments(state, cm, wm, () => {
  document.querySelector<HTMLElement>('.m-nav[data-view="workspace"]')?.click()
}, 'm-experiments-content')

  setupMobileViews(sm)

const WORKSPACE_ELS = [
  '.canvas-area', '#m-floating-tools', '#m-sim-btn',
  '#m-add-btn', '#m-metrics', '#m-view-btn', '#m-topbar'
]
function hideAllScreens(): void {
  WORKSPACE_ELS.forEach(sel => {
    const el = document.querySelector<HTMLElement>(sel)
    if (el) el.style.display = 'none'
  })
const library = document.getElementById('m-library-screen')
if (library) library.style.display = 'none'

const settings = document.getElementById('m-settings-screen')
if (settings) settings.style.display = 'none'

const experiments = document.getElementById('m-experiments-screen')
if (experiments) experiments.style.display = 'none'

const analysis = document.getElementById('m-analysis-screen')
if (analysis) analysis.style.display = 'none'
}


document.querySelectorAll<HTMLButtonElement>('.m-nav').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset['view']!

    // Marcar tab activo
    document.querySelectorAll<HTMLElement>('.m-nav').forEach(b => b.classList.remove('m-nav-active'))
    btn.classList.add('m-nav-active')

    // ✅ Ocultar todo primero — siempre
    hideAllScreens()

    // ✅ Luego mostrar solo lo que corresponde
    if (view === 'workspace') {
      WORKSPACE_ELS.forEach(sel => {
        const el = document.querySelector<HTMLElement>(sel)
        if (!el) return
        el.style.display = (sel === '#m-floating-tools' || sel === '#m-metrics') ? 'flex' : ''
      })
    } else if (view === 'library') {
      document.getElementById('m-library-screen')!.style.display = 'flex'
      renderLibrary(state, cm, wm)
    } else if (view === 'settings') {
      document.getElementById('m-settings-screen')!.style.display = 'flex'
} else if (view === 'analysis') {
  document.getElementById('m-analysis-screen')!.style.display = 'flex'
  renderAnalysis(state)  // ← actualizar al entrar
}
    // El nav NUNCA se oculta
  })
})

  // Métricas reactivas
  on(AppEvents.STATE_CHANGED, () => updateMobileMetrics(state))
  setupMobileSettings()

}