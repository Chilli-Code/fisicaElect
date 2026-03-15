// ============================================================
// src/ui/library.ts
// Biblioteca de circuitos guardados en localStorage
// ============================================================
import { emit, AppEvents } from '@core/events'
import { showNotification } from './notifications'
import type { AppState, SerializedComponent, SerializedWire } from '@core/types'
import type { ComponentManager } from '@scene/ComponentManager'
import type { WireManager } from '@scene/WireManager'

// ---------------------------------------------------------------------------
// Estructura de un circuito guardado
// ---------------------------------------------------------------------------
interface SavedCircuit {
  id: string
  name: string
  category: string
  thumbnail: string
  createdAt: number
  usageCount: number
  components: SerializedComponent[]
  wires: SerializedWire[]
}

const STORAGE_KEY = 'circuitlab_library'
let currentLoadedCircuitId: string | null = null 

function loadAll(): SavedCircuit[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch { return [] }
}

function saveAll(circuits: SavedCircuit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(circuits))
}

// DESPUÉS:
function thumbnail(state: AppState): string {
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement | null
  if (canvas) {
    try { return canvas.toDataURL('image/jpeg', 0.6) } catch { /* fallback */ }
  }
  // fallback emoji si falla
  const icons: Record<string, string> = {
    battery:'🔋', led:'💡', resistor:'▬', capacitor:'╫',
    inductor:'⊸', switch:'⏚', diode:'◄', transistor:'🔺',
    voltmeter:'V', ammeter:'A', 'ac-source':'⚡',
  }
  return [...new Set(state.components.map(c => c.type))].map(t => icons[t] ?? '⚙').join('')
}

// ---------------------------------------------------------------------------
export function setupLibrary(
  state: AppState,
  cm: ComponentManager,
  wm: WireManager,
): void {
  // Vistas del menú
document.querySelectorAll<HTMLButtonElement>('.menu-item[data-view]').forEach(item => {
  item.addEventListener('click', () => {
    switchView(item.dataset['view']!)
    if (item.dataset['view'] === 'library') refreshLibraryView(state, cm, wm)
  })
})

document.getElementById('overwrite-save-circuit')?.addEventListener('click', () => {
  if (!currentLoadedCircuitId) return
  const circuits = loadAll()
  const index = circuits.findIndex(c => c.id === currentLoadedCircuitId)
  if (index === -1) return
  circuits[index] = {
    ...circuits[index]!,
    thumbnail: thumbnail(state),
    components: state.components.map(c => ({
      id: c.id, type: c.type, name: c.name, value: c.value,
      position: { x: c.position.x, z: c.position.z },
    })),
    wires: state.wires.map(w => ({
      id: w.id, startComp: w.startComp, startTerm: w.startTerm,
      endComp: w.endComp, endTerm: w.endTerm, baseColor: w.baseColor,
    })),
  }
  saveAll(circuits)
  closeSaveModal()
  refreshLibraryView(state, cm, wm)
  showNotification('success', 'Sobreescrito', `"${circuits[index]!.name}" actualizado`)
})

  document.getElementById('library-search')?.addEventListener('input', (e) => {
  const query = (e.target as HTMLInputElement).value.toLowerCase()
  document.querySelectorAll<HTMLElement>('.circuit-card').forEach(card => {
    const name = card.querySelector('.circuit-name')?.textContent?.toLowerCase() ?? ''
    card.style.display = name.includes(query) ? '' : 'none'
  })
})
  // Guardar circuito actual
  document.getElementById('save-current-circuit')?.addEventListener('click', () => {
    if (state.components.length === 0) {
      showNotification('warning', 'Vacío', 'Construye un circuito primero')
      return
    }
    openSaveModal(state)
  })

  // Confirmar guardado
  document.getElementById('confirm-save-circuit')?.addEventListener('click', () => {
    const nameEl   = document.getElementById('circuit-name-input')    as HTMLInputElement
    const catEl    = document.getElementById('circuit-category-input') as HTMLInputElement
    const name     = nameEl?.value || 'Sin nombre'
    const category = catEl?.value  || 'General'

    const circuits = loadAll()
    const circuit: SavedCircuit = {
      id: `circuit-${Date.now()}`,
      name,
      category,
      thumbnail: thumbnail(state),
      createdAt: Date.now(),
      usageCount: 0,
      components: state.components.map(c => ({
        id: c.id, type: c.type, name: c.name, value: c.value,
        position: { x: c.position.x, z: c.position.z },
      })),
      wires: state.wires.map(w => ({
        id: w.id, startComp: w.startComp, startTerm: w.startTerm,
        endComp: w.endComp, endTerm: w.endTerm, baseColor: w.baseColor,
      })),
    }
    circuits.push(circuit)
    saveAll(circuits)
    closeSaveModal()
    refreshLibraryView(state, cm, wm)
    showNotification('success', 'Guardado', `"${name}" en Biblioteca`)
  })

  // Cancelar modal
  document.getElementById('cancel-save-circuit')?.addEventListener('click', closeSaveModal)

  // Importar JSON
  document.getElementById('import-circuit')?.addEventListener('click', () => {
    document.getElementById('import-file-input')?.click()
  })
  document.getElementById('import-file-input')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const circuit = JSON.parse(ev.target?.result as string) as SavedCircuit
        if (!circuit.id || !circuit.components) throw new Error('invalid')
        const circuits = loadAll()
        circuit.id = `circuit-${Date.now()}` // nuevo id para evitar colisiones
        circuits.push(circuit)
        saveAll(circuits)
        refreshLibraryView(state, cm, wm)
        showNotification('success', 'Importado', `"${circuit.name}"`)
      } catch {
        showNotification('error', 'Error', 'Archivo inválido')
      }
    }
    reader.readAsText(file)
    ;(e.target as HTMLInputElement).value = ''
  })

  // Delegación de eventos en la grilla
  document.getElementById('circuits-grid')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]')
    if (!btn) return
    const action = btn.dataset['action']!
    const id     = btn.dataset['id']!
    const circuits = loadAll()

    if (action === 'load')      loadCircuit(id, circuits, state, cm, wm)
    if (action === 'delete')    deleteCircuit(id, circuits, state, cm, wm)
    if (action === 'export')    exportCircuit(id, circuits)
    if (action === 'duplicate') duplicateCircuit(id, circuits, state, cm, wm)
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function switchView(viewName: string): void {
  document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'))
  document.getElementById(`${viewName}-view`)?.classList.add('active')
  document.querySelector<HTMLElement>(`.menu-item[data-view="${viewName}"]`)?.classList.add('active')
  
}



function openSaveModal(state: AppState): void {
  const modal = document.getElementById('save-circuit-modal')
  if (!modal) return
  modal.style.display = 'flex'
  const nameEl = document.getElementById('circuit-name-input') as HTMLInputElement
  if (nameEl) nameEl.value = `Circuito ${loadAll().length + 1}`
  const preComp = document.getElementById('preview-components')
  const preWire = document.getElementById('preview-wires')
  if (preComp) preComp.textContent = `${state.components.length} componentes`
  if (preWire) preWire.textContent = `${state.wires.length} cables`
  const overwriteBtn = document.getElementById('overwrite-save-circuit')
if (overwriteBtn) overwriteBtn.style.display = currentLoadedCircuitId ? 'block' : 'none'
}

function closeSaveModal(): void {
  const modal = document.getElementById('save-circuit-modal')
  if (modal) modal.style.display = 'none'
}

function refreshLibraryView(state: AppState, cm: ComponentManager, wm: WireManager): void {
  const circuits = loadAll()

  // Stats
  const categories = new Set(circuits.map(c => c.category))
  const mostUsed = [...categories].reduce((a, b) =>
    circuits.filter(c => c.category === a).length >= circuits.filter(c => c.category === b).length ? a : b,
    categories.values().next().value ?? '—',
  )
  const set = (id: string, val: string) => { const el = document.getElementById(id); if (el) el.textContent = val }
  set('stat-total',      String(circuits.length))
  set('stat-categories', String(categories.size))
  set('stat-favorite',   mostUsed)

  const grid = document.getElementById('circuits-grid')
  if (!grid) return

  if (circuits.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon"><animated-icons
  src="https://animatedicons.co/get-icon?name=No%20Data&style=minimalistic&token=49b1299b-1bb0-4144-8e32-4265bddc1e65"
  trigger="loop"
  attributes='{"variationThumbColour":"#536DFE","variationName":"Two Tone","variationNumber":2,"numberOfGroups":2,"backgroundIsGroup":false,"strokeWidth":1,"defaultColours":{"group-1":"#000000","group-2":"#536DFE","background":"#FFFFFF"}}'
  height="100"
  width="100"
></animated-icons></div><h3>No hay circuitos guardados</h3><p>Construye un circuito y presiona "Guardar"</p></div>`
    return
  }

  grid.innerHTML = circuits.map(c => `
    <div class="circuit-card">
      <div class="circuit-thumbnail" style="padding:0;overflow:hidden;height:80px;border-radius:8px 8px 0 0">
  ${c.thumbnail.startsWith('data:')
    ? `<img src="${c.thumbnail}" style="width:100%;height:100%;object-fit:cover">`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;background:#2c2c2e">${c.thumbnail}</div>`
  }
</div>
      <div class="circuit-info">
        <div class="circuit-name">${c.name}</div>
        <span class="circuit-category">${c.category}</span>
      </div>
      <div class="circuit-meta">
        <span>${c.components.length} comp.</span>
        <span>${c.wires.length} cables</span>
      </div>
      <div class="circuit-actions">
        <button data-action="load"      data-id="${c.id}">Cargar</button>
        <button data-action="export"    data-id="${c.id}">Exportar</button>
        <button data-action="duplicate" data-id="${c.id}">Duplicar</button>
        <button data-action="delete"    data-id="${c.id}" class="delete">Eliminar</button>
      </div>
    </div>`).join('')
}

function loadCircuit(
  id: string,
  circuits: SavedCircuit[],
  state: AppState,
  cm: ComponentManager,
  wm: WireManager,
): void {
  const circuit = circuits.find(c => c.id === id)
  if (!circuit) return

  cm.clear(); wm.clear(); state.idCounter = 0
  currentLoadedCircuitId = id 

  const created = circuit.components.map(c => cm.restoreFromSnapshot(c))

  requestAnimationFrame(() => {
    circuit.wires.forEach(w => {
      const startComp = state.components.find(c => c.id === w.startComp)
      const endComp   = state.components.find(c => c.id === w.endComp)
      if (!startComp || !endComp) return
      const startTerm = startComp.terminals.find(t => t.type === w.startTerm)
      const endTerm   = endComp.terminals.find(t => t.type === w.endTerm)
      if (startTerm && endTerm) wm.create(startComp, startTerm, endComp, endTerm)
    })
    switchView('workspace')
    emit(AppEvents.STATE_CHANGED, null)
    showNotification('success', 'Cargado', `"${circuit.name}"`)
  })
}

function deleteCircuit(
  id: string,
  circuits: SavedCircuit[],
  state: AppState,
  cm: ComponentManager,
  wm: WireManager,
): void {
  if (!confirm('¿Eliminar este circuito?')) return
  saveAll(circuits.filter(c => c.id !== id))
  refreshLibraryView(state, cm, wm)
  showNotification('info', 'Eliminado', 'Circuito removido')
}

function exportCircuit(id: string, circuits: SavedCircuit[]): void {
  const circuit = circuits.find(c => c.id === id)
  if (!circuit) return
  const blob = new Blob([JSON.stringify(circuit, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${circuit.name.replace(/\s+/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
  showNotification('success', 'Exportado', circuit.name)
}

function duplicateCircuit(
  id: string,
  circuits: SavedCircuit[],
  state: AppState,
  cm: ComponentManager,
  wm: WireManager,
): void {
  const circuit = circuits.find(c => c.id === id)
  if (!circuit) return
  const dup: SavedCircuit = { ...circuit, id: `circuit-${Date.now()}`, name: `${circuit.name} (copia)` }
  saveAll([...circuits, dup])
  refreshLibraryView(state, cm, wm)
  showNotification('success', 'Duplicado', dup.name)
}
