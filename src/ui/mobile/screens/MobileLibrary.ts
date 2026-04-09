import type { AppState } from '@core/types'
import type { BabylonComponentManager } from '@scene/BabylonComponentManager'
import type { BabylonWireManager } from '@scene/BabylonWireManager'
import { emit, AppEvents } from '@core/events'
import { saveBabylonSnapshot } from '@core/babylon-history'
import { showNotification } from '../MobileNotifications'

interface SavedCircuit {
  id: string
  name: string
  category: string
  thumbnail: string
  createdAt: number
  usageCount: number
  components: Array<{
    id: string; type: string; name: string
    value: number; position: { x: number; z: number }
  }>
  wires: Array<{
    id: string; startComp: string; startTerm: string
    endComp: string; endTerm: string; baseColor: number
  }>
}

const STORAGE_KEY = 'circuitlab_library'
let currentLoadedCircuitId: string | null = null

function loadAll(): SavedCircuit[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function saveAll(circuits: SavedCircuit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(circuits))
}

function captureThumbnail(state: AppState): string {
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement | null
  if (canvas) {
    try { return canvas.toDataURL('image/jpeg', 0.6) } catch { /* fallback */ }
  }
  const icons: Record<string, string> = {
    battery: '🔋', led: '💡', resistor: '▬', capacitor: '╫',
    inductor: '⊸', switch: '⏚', diode: '◄', transistor: '🔺',
    voltmeter: 'V', ammeter: 'A', 'ac-source': '⚡',
  }
  return [...new Set(state.components.map(c => c.type))].map(t => icons[t] ?? '⚙').join('')
}

function serializeState(state: AppState) {
  return {
    components: state.components.map(c => ({
      id: c.id, type: c.type, name: c.name, value: c.value,
      position: { x: c.position.x, z: c.position.z },
    })),
    wires: state.wires.map(w => ({
      id: w.id, startComp: w.startComp, startTerm: w.startTerm,
      endComp: w.endComp, endTerm: w.endTerm, baseColor: w.baseColor,
    })),
  }
}

function loadCircuitIntoScene(
  circuit: SavedCircuit,
  state: AppState,
  cm: BabylonComponentManager,
  wm: BabylonWireManager,
): void {
  cm.clear()
  wm.clear()
  state.idCounter = 0
  currentLoadedCircuitId = circuit.id

  circuit.components.forEach(c => {
    const comp = cm.add(c.type as any, c.position.x, c.position.z, c.id)
    if (comp) {
      comp.value = c.value
      comp.position.x = c.position.x
      comp.position.z = c.position.z
    }
  })

  setTimeout(() => {
    circuit.wires.forEach(w => {
      const startComp = state.components.find(c => c.id === w.startComp)
      const endComp   = state.components.find(c => c.id === w.endComp)
      if (!startComp || !endComp) return
      const startTerm = startComp.terminals.find(t => t.type === w.startTerm)
      const endTerm   = endComp.terminals.find(t => t.type === w.endTerm)
      if (!startTerm || !endTerm) return
      wm.create(startComp, startTerm, endComp, endTerm, {
        color: '#' + w.baseColor.toString(16).padStart(6, '0')
      })
    })
    saveBabylonSnapshot(state, `load:${circuit.name}`)
    emit(AppEvents.STATE_CHANGED, null)
    showNotification(`✅ "${circuit.name}" cargado`, 'success')

    // Volver al workspace — simular click en nav
    document.querySelector<HTMLElement>('.m-nav[data-view="workspace"]')?.click()
  }, 50)
}

function openSaveModal(state: AppState): void {
  const modal   = document.getElementById('m-lib-save-modal')!
  const nameEl  = document.getElementById('m-lib-name-input') as HTMLInputElement
  const preComp = document.getElementById('m-lib-preview-comp')
  const preWire = document.getElementById('m-lib-preview-wire')
  const overBtn = document.getElementById('m-lib-overwrite-btn')

  nameEl.value = `Circuito ${loadAll().length + 1}`
  if (preComp) preComp.textContent = `${state.components.length} componentes`
  if (preWire) preWire.textContent = `${state.wires.length} cables`
  if (overBtn) overBtn.style.display = currentLoadedCircuitId ? 'block' : 'none'

  modal.style.display = 'flex'
}

function closeSaveModal(): void {
  document.getElementById('m-lib-save-modal')!.style.display = 'none'
}

// ─── EXPORT: render de tarjetas ───────────────────────────────────────────────

export function renderLibrary(
  state: AppState,
  cm: BabylonComponentManager,
  wm: BabylonWireManager,
): void {
  const circuits = loadAll()
  const grid = document.getElementById('m-library-grid')
  if (!grid) return

  if (circuits.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:#636366">
        <div style="font-size:56px;margin-bottom:16px">📭</div>
        <div style="font-size:15px;font-weight:500;color:#aeaeb2;margin-bottom:6px">No hay circuitos guardados</div>
        <div style="font-size:13px">Construye un circuito y presiona Guardar</div>
      </div>`
    return
  }

  grid.innerHTML = circuits.map(c => `
    <div class="m-circuit-card" style="
      background:#2c2c2e;border-radius:14px;overflow:hidden;
      border:1px solid rgba(255,255,255,0.08);margin-bottom:12px
    ">
      <div style="height:90px;background:#1c1c1e;overflow:hidden">
        ${c.thumbnail.startsWith('data:')
          ? `<img src="${c.thumbnail}" style="width:100%;height:100%;object-fit:cover">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:32px">${c.thumbnail}</div>`
        }
      </div>
      <div style="padding:12px 14px">
        <div style="font-size:14px;font-weight:600;color:#f5f5f7;margin-bottom:2px">${c.name}</div>
        <div style="font-size:11px;color:#636366;margin-bottom:10px">
          ${c.category} · ${c.components.length} comp. · ${c.wires.length} cables
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <button data-action="load" data-id="${c.id}" style="
            grid-column:1/-1;padding:10px;background:#007AFF;border:none;
            border-radius:10px;color:white;font-size:13px;font-weight:600;cursor:pointer
          ">Cargar</button>
          <button data-action="export" data-id="${c.id}" style="
            padding:8px;background:#3a3a3c;border:none;border-radius:10px;
            color:#f5f5f7;font-size:12px;cursor:pointer
          ">📤 Exportar</button>
          <button data-action="duplicate" data-id="${c.id}" style="
            padding:8px;background:#3a3a3c;border:none;border-radius:10px;
            color:#f5f5f7;font-size:12px;cursor:pointer
          ">📋 Duplicar</button>
          <button data-action="delete" data-id="${c.id}" style="
            grid-column:1/-1;padding:8px;background:rgba(255,59,48,0.12);border:none;
            border-radius:10px;color:#FF3B30;font-size:12px;cursor:pointer
          ">🗑️ Eliminar</button>
        </div>
      </div>
    </div>
  `).join('')

  grid.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action   = btn.dataset['action']!
      const id       = btn.dataset['id']!
      const circuits = loadAll()

      if (action === 'load') {
        const circuit = circuits.find(c => c.id === id)
        if (circuit) loadCircuitIntoScene(circuit, state, cm, wm)
      }

      if (action === 'export') {
        const circuit = circuits.find(c => c.id === id)
        if (!circuit) return
        const blob = new Blob([JSON.stringify(circuit, null, 2)], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url
        a.download = `${circuit.name.replace(/\s+/g, '_')}.json`
        a.click()
        URL.revokeObjectURL(url)
        showNotification(`📤 "${circuit.name}" exportado`, 'success')
      }

      if (action === 'duplicate') {
        const circuit = circuits.find(c => c.id === id)
        if (!circuit) return
        saveAll([...circuits, {
          ...circuit,
          id: `circuit-${Date.now()}`,
          name: `${circuit.name} (copia)`,
        }])
        renderLibrary(state, cm, wm)
        showNotification('📋 Duplicado', 'success')
      }

      if (action === 'delete') {
        const circuit = circuits.find(c => c.id === id)
        if (!confirm(`¿Eliminar "${circuit?.name}"?`)) return
        saveAll(circuits.filter(c => c.id !== id))
        if (currentLoadedCircuitId === id) currentLoadedCircuitId = null
        renderLibrary(state, cm, wm)
        showNotification('🗑️ Eliminado', 'success')
      }
    })
  })
}

// ─── EXPORT: setup inicial ────────────────────────────────────────────────────

export function setupMobileLibrary(
  state: AppState,
  cm: BabylonComponentManager,
  wm: BabylonWireManager,
): void {
  // Inyectar pantalla biblioteca + modal guardar
  document.getElementById('mobile-ui')?.insertAdjacentHTML('beforeend', `
    <div id="m-library-screen" style="
      display:none;position:fixed;
      top:0;left:0;right:0;bottom:60px;
      background:#111112;flex-direction:column;z-index:100;
    ">
      <div style="
        display:flex;align-items:center;justify-content:space-between;
        padding:16px 20px;padding-top:calc(16px + env(safe-area-inset-top));
        background:#1c1c1e;border-bottom:1px solid rgba(255,255,255,0.08)
      ">
        <span style="font-size:17px;font-weight:700;color:#f5f5f7">Biblioteca</span>
        <div style="display:flex;gap:8px">
          <button id="m-lib-import-btn" style="padding:8px 12px;background:#3a3a3c;border:none;border-radius:10px;color:#f5f5f7;font-size:12px;cursor:pointer;font-weight:500">📥 Importar</button>
          <input id="m-lib-import-input" type="file" accept=".json" style="display:none">
          <button id="m-lib-save-btn" style="padding:8px 14px;background:#007AFF;border:none;border-radius:10px;color:white;font-size:12px;font-weight:600;cursor:pointer">💾 Guardar</button>
        </div>
      </div>
      <div style="padding:10px 16px;background:#1c1c1e;border-bottom:1px solid rgba(255,255,255,0.06)">
        <input id="m-lib-search" type="text" placeholder="🔍 Buscar circuito..."
          style="width:100%;padding:9px 14px;background:#2c2c2e;box-sizing:border-box;border:0.5px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:14px">
      </div>
      <div id="m-library-grid" style="flex:1;overflow-y:auto;padding:14px 16px"></div>
    </div>

    <div id="m-lib-save-modal" style="
      display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);
      z-index:3000;align-items:flex-end;justify-content:center
    ">
      <div style="background:#1c1c1e;border-radius:20px 20px 0 0;width:100%;padding:24px 20px;box-sizing:border-box;padding-bottom:calc(24px + env(safe-area-inset-bottom))">
        <p style="font-size:11px;color:#636366;text-transform:uppercase;letter-spacing:.06em;margin:0 0 16px">Guardar circuito</p>
        <input id="m-lib-name-input" type="text" placeholder="Nombre del circuito"
          style="width:100%;padding:12px;background:#2c2c2e;border:0.5px solid rgba(255,255,255,0.1);border-radius:12px;color:white;font-size:16px;box-sizing:border-box;margin-bottom:10px">
        <select id="m-lib-cat-input"
          style="width:100%;padding:12px;background:#2c2c2e;border:0.5px solid rgba(255,255,255,0.1);border-radius:12px;color:white;font-size:16px;box-sizing:border-box;margin-bottom:10px">
          <option>General</option>
          <option>Básico</option>
          <option>Avanzado</option>
          <option>Experimento</option>
        </select>
        <div style="font-size:12px;color:#636366;margin-bottom:16px">
          <span id="m-lib-preview-comp">0 componentes</span> · <span id="m-lib-preview-wire">0 cables</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button id="m-lib-save-confirm" style="padding:13px;background:#007AFF;border:none;border-radius:12px;color:white;font-size:15px;font-weight:600;cursor:pointer">Guardar</button>
          <button id="m-lib-overwrite-btn" style="display:none;padding:13px;background:#FF9500;border:none;border-radius:12px;color:white;font-size:15px;font-weight:600;cursor:pointer">🔄 Sobreescribir circuito actual</button>
          <button id="m-lib-save-cancel" style="padding:13px;background:#3a3a3c;border:none;border-radius:12px;color:white;font-size:15px;cursor:pointer">Cancelar</button>
        </div>
      </div>
    </div>
  `)

  // Búsqueda
  document.getElementById('m-lib-search')?.addEventListener('input', (e) => {
    const q = (e.target as HTMLInputElement).value.toLowerCase()
    document.querySelectorAll<HTMLElement>('.m-circuit-card').forEach(card => {
      const name = card.querySelector<HTMLElement>('div')?.textContent?.toLowerCase() ?? ''
      card.style.display = name.includes(q) ? '' : 'none'
    })
  })

  // Guardar
  document.getElementById('m-lib-save-btn')?.addEventListener('click', () => {
    if (state.components.length === 0) {
      showNotification('⚠️ Construye un circuito primero', 'warning')
      return
    }
    openSaveModal(state)
  })

  document.getElementById('m-lib-save-cancel')?.addEventListener('click', closeSaveModal)

  document.getElementById('m-lib-save-confirm')?.addEventListener('click', () => {
    const name = (document.getElementById('m-lib-name-input') as HTMLInputElement).value || 'Sin nombre'
    const cat  = (document.getElementById('m-lib-cat-input') as HTMLSelectElement).value || 'General'
    const circuit: SavedCircuit = {
      id: `circuit-${Date.now()}`, name, category: cat,
      thumbnail: captureThumbnail(state),
      createdAt: Date.now(), usageCount: 0,
      ...serializeState(state),
    }
    saveAll([...loadAll(), circuit])
    closeSaveModal()
    renderLibrary(state, cm, wm)
    showNotification(`✅ "${name}" guardado`, 'success')
  })

  // Sobreescribir
  document.getElementById('m-lib-overwrite-btn')?.addEventListener('click', () => {
    if (!currentLoadedCircuitId) return
    const circuits = loadAll()
    const index = circuits.findIndex(c => c.id === currentLoadedCircuitId)
    if (index === -1) return
    circuits[index] = { ...circuits[index]!, thumbnail: captureThumbnail(state), ...serializeState(state) }
    saveAll(circuits)
    closeSaveModal()
    renderLibrary(state, cm, wm)
    showNotification(`🔄 "${circuits[index]!.name}" sobreescrito`, 'success')
  })

  // Importar
  document.getElementById('m-lib-import-btn')?.addEventListener('click', () => {
    document.getElementById('m-lib-import-input')?.click()
  })

  document.getElementById('m-lib-import-input')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const circuit = JSON.parse(ev.target?.result as string) as SavedCircuit
        if (!circuit.id || !circuit.components || !Array.isArray(circuit.components)) throw new Error('invalid')
        circuit.id = `circuit-${Date.now()}`
        saveAll([...loadAll(), circuit])
        renderLibrary(state, cm, wm)
        showNotification(`📥 "${circuit.name}" importado`, 'success')
      } catch {
        showNotification('❌ Archivo JSON inválido', 'error')
      }
    }
    reader.readAsText(file)
    ;(e.target as HTMLInputElement).value = ''
  })
}