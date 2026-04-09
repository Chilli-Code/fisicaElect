// src/ui/mobile/ComponentPopup.ts

import type { AppState, CircuitComponent } from '@core/types'
import { emit, AppEvents } from '@core/events'
import { saveSnapshot } from '@core/history'

// Extender el tipo para propiedades específicas
interface ExtendedComponent extends CircuitComponent {
  frequency?: number
  state?: 'open' | 'closed'
}

// src/ui/mobile/ComponentPopup.ts

// ... imports ...

export function setupComponentPopup(state: AppState, onDelete: () => void): void {
  console.log('🎯 setupComponentPopup inicializado')
  
  const popup = document.getElementById('m-component-popup')
  const overlay = document.getElementById('m-popup-overlay')
  const closeBtn = document.getElementById('m-popup-close')
  const titleEl = document.getElementById('m-popup-title')
  const fieldsContainer = document.getElementById('m-popup-fields')
  const deleteBtn = document.getElementById('m-popup-delete')
  const editBtn = document.getElementById('m-edit-btn')

  console.log('Popup elements:', { popup, overlay, editBtn })

  function closePopup() {
    console.log('🔒 Cerrando popup')
    if (popup) popup.style.display = 'none'
    if (overlay) overlay.style.display = 'none'
  }

  function openPopup() {
    console.log('🔓 Abriendo popup')
    if (popup) popup.style.display = 'block'
    if (overlay) overlay.style.display = 'block'
  }

  closeBtn?.addEventListener('click', closePopup)
  overlay?.addEventListener('click', closePopup)

  // Eliminar componente
  deleteBtn?.addEventListener('click', () => {
    if (state.selected) {
      console.log('🗑️ Eliminando componente:', state.selected.type)
      saveSnapshot(state, `Eliminar ${state.selected.type}`)
      onDelete()
      closePopup()
    }
  })

  // Botón de edición: abre el popup con los parámetros
  editBtn?.addEventListener('click', () => {
    console.log('✏️ Botón Editar clickeado')
    const comp = state.selected
    if (!comp || !popup) {
      console.log('No hay componente seleccionado')
      return
    }

    console.log('Abriendo popup para:', comp.type)
    
    if (titleEl) titleEl.textContent = getComponentDisplayName(comp.type)
    if (fieldsContainer) {
      fieldsContainer.innerHTML = generateFields(comp as ExtendedComponent)
      
      const valueInput = fieldsContainer.querySelector('#comp-value')
      const freqInput = fieldsContainer.querySelector('#comp-frequency')
      const stateSelect = fieldsContainer.querySelector('#comp-state')
      
      // Remover listeners anteriores para evitar duplicados
      const newValueInput = valueInput?.cloneNode(true)
      const newFreqInput = freqInput?.cloneNode(true)
      const newStateSelect = stateSelect?.cloneNode(true)
      
      if (valueInput && newValueInput) {
        valueInput.parentNode?.replaceChild(newValueInput, valueInput)
        newValueInput.addEventListener('change', (e) => {
          const input = e.target as HTMLInputElement
          if (state.selected) {
            saveSnapshot(state, `Modificar ${state.selected.type}`)
            state.selected.value = parseFloat(input.value) || 0
            emit(AppEvents.STATE_CHANGED, null)
          }
        })
      }
      
      if (freqInput && newFreqInput) {
        freqInput.parentNode?.replaceChild(newFreqInput, freqInput)
        newFreqInput.addEventListener('change', (e) => {
          const input = e.target as HTMLInputElement
          if (state.selected) {
            saveSnapshot(state, `Modificar ${state.selected.type}`)
            ;(state.selected as any).frequency = parseFloat(input.value) || 60
            emit(AppEvents.STATE_CHANGED, null)
          }
        })
      }
      
      if (stateSelect && newStateSelect) {
        stateSelect.parentNode?.replaceChild(newStateSelect, stateSelect)
        newStateSelect.addEventListener('change', (e) => {
          const select = e.target as HTMLSelectElement
          if (state.selected) {
            saveSnapshot(state, `Modificar ${state.selected.type}`)
            ;(state.selected as any).state = select.value
            emit(AppEvents.STATE_CHANGED, null)
          }
        })
      }
    }

    openPopup()
  })

  // ✅ EVENT LISTENER QUE MUESTRA/OCULTA EL BOTÓN
  const updateEditButtonVisibility = () => {
    const comp = state.selected
    const isSelectMode = state.currentTool === 'select'
    const shouldShow = comp !== null && isSelectMode
    
    console.log('🔍 Actualizando visibilidad botón edición:', {
      componente: comp?.type || 'ninguno',
      modo: state.currentTool,
      debeMostrar: shouldShow
    })
    
    if (editBtn) {
      editBtn.style.display = shouldShow ? 'flex' : 'none'
    }
    
    if (!shouldShow) {
      closePopup()
    }
  }

  // Escuchar cambios de selección Y cambios de herramienta
  document.addEventListener('stateChanged', updateEditButtonVisibility)
  
  // Ejecutar inmediatamente para asegurar estado inicial
  updateEditButtonVisibility()
}

// ... resto de las funciones (getComponentDisplayName, generateFields, bindComponentPopupChanges) se mantienen igual ...

function getComponentDisplayName(type: string): string {
  const names: Record<string, string> = {
    battery: 'Batería',
    'ac-source': 'Fuente AC',
    resistor: 'Resistencia',
    capacitor: 'Capacitor',
    inductor: 'Inductor',
    led: 'LED',
    diode: 'Diodo',
    switch: 'Interruptor',
    voltmeter: 'Voltímetro',
    ammeter: 'Amperímetro',
    transistor: 'Transistor',
  }
  return names[type] || 'Componente'
}

function generateFields(comp: ExtendedComponent): string {
  switch (comp.type) {
    case 'battery':
      return `
        <div class="m-popup-field">
          <label>Voltaje (V)</label>
          <input type="number" id="comp-value" step="0.1" value="${comp.value}" placeholder="Ej: 9.0">
        </div>
      `
    case 'ac-source':
      return `
        <div class="m-popup-field">
          <label>Voltaje RMS (V)</label>
          <input type="number" id="comp-value" step="1" value="${comp.value}" placeholder="Ej: 120">
        </div>
        <div class="m-popup-field">
          <label>Frecuencia (Hz)</label>
          <input type="number" id="comp-frequency" step="1" value="${comp.frequency || 60}" placeholder="Ej: 60">
        </div>
      `
    case 'resistor':
      return `
        <div class="m-popup-field">
          <label>Resistencia (Ω)</label>
          <input type="number" id="comp-value" step="10" value="${comp.value}" placeholder="Ej: 100">
        </div>
      `
    case 'capacitor':
      return `
        <div class="m-popup-field">
          <label>Capacitancia (F)</label>
          <input type="number" id="comp-value" step="0.000001" value="${comp.value}" placeholder="Ej: 0.000001">
        </div>
      `
    case 'inductor':
      return `
        <div class="m-popup-field">
          <label>Inductancia (H)</label>
          <input type="number" id="comp-value" step="0.001" value="${comp.value}" placeholder="Ej: 0.01">
        </div>
      `
    case 'led':
    case 'diode':
      return `
        <div class="m-popup-field">
          <label>Voltaje umbral (V)</label>
          <input type="number" id="comp-value" step="0.1" value="${comp.value}" placeholder="Ej: 2.0">
        </div>
      `
    case 'switch':
      return `
        <div class="m-popup-field">
          <label>Estado</label>
          <select id="comp-state">
            <option value="closed" ${comp.state === 'closed' ? 'selected' : ''}>Cerrado</option>
            <option value="open" ${comp.state === 'open' ? 'selected' : ''}>Abierto</option>
          </select>
        </div>
      `
    default:
      return `
        <div class="m-popup-field">
          <label>Valor</label>
          <input type="text" id="comp-value" value="${comp.value}" disabled>
        </div>
      `
  }
}

export function bindComponentPopupChanges(state: AppState): void {
  const fieldsContainer = document.getElementById('m-popup-fields')
  if (!fieldsContainer) return

  fieldsContainer.addEventListener('change', (e) => {
    const target = e.target as HTMLElement
    if (!state.selected) return

    const comp = state.selected as ExtendedComponent
    saveSnapshot(state, `Modificar ${comp.type}`)

    if (target.id === 'comp-value') {
      const input = target as HTMLInputElement
      comp.value = parseFloat(input.value) || 0
    } else if (target.id === 'comp-frequency') {
      const input = target as HTMLInputElement
      comp.frequency = parseFloat(input.value) || 60
    } else if (target.id === 'comp-state') {
      const select = target as HTMLSelectElement
      comp.state = select.value as 'open' | 'closed'
    }

    emit(AppEvents.STATE_CHANGED, null)
  })
}