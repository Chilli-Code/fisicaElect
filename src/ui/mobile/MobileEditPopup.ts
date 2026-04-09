import type { AppState } from '@core/types'
import type { BabylonComponentManager } from '@scene/BabylonComponentManager'
import { emit, on, AppEvents } from '@core/events'
import { saveBabylonSnapshot } from '@core/babylon-history'
import { showNotification } from './MobileNotifications'

const UNIT_MAP: Record<string, { label: string; step: string; placeholder: string }> = {
  battery:    { label: 'Voltaje (V)',       step: '0.1',      placeholder: 'Ej: 9.0'      },
  resistor:   { label: 'Resistencia (Ω)',   step: '10',       placeholder: 'Ej: 100'      },
  capacitor:  { label: 'Capacitancia (F)',  step: '0.000001', placeholder: 'Ej: 0.000001' },
  inductor:   { label: 'Inductancia (H)',   step: '0.001',    placeholder: 'Ej: 0.01'     },
  led:        { label: 'Voltaje umbral (V)',step: '0.1',      placeholder: 'Ej: 2.0'      },
  diode:      { label: 'Voltaje umbral (V)',step: '0.1',      placeholder: 'Ej: 0.7'      },
  'ac-source':{ label: 'Voltaje RMS (V)',   step: '1',        placeholder: 'Ej: 120'      },
}

const TITLES: Record<string, string> = {
  battery: 'Batería', resistor: 'Resistencia', switch: 'Interruptor',
  led: 'LED', 'ac-source': 'Fuente AC', capacitor: 'Capacitor',
  inductor: 'Inductor', diode: 'Diodo', voltmeter: 'Voltímetro',
  ammeter: 'Amperímetro', transistor: 'Transistor',
}

export function setupEditPopup(state: AppState, cm: BabylonComponentManager): void {
  const editBtn    = document.getElementById('m-edit-btn')
  const popup      = document.getElementById('m-edit-popup')
  const overlay    = document.getElementById('m-sheet-overlay')
  const titleEl    = document.getElementById('edit-popup-title')
  const fieldsEl   = document.getElementById('edit-popup-fields')
  const saveBtn    = document.getElementById('save-component-btn')

  function closePopup() {
    popup?.classList.remove('m-sheet-open')
    overlay?.classList.remove('m-overlay-open')
    setTimeout(() => {
      if (popup && !popup.classList.contains('m-sheet-open')) {
        popup.style.display = 'none'
      }
    }, 350)
  }

  function openPopup() {
    if (popup) {
      popup.style.display = 'block'
      void popup.offsetWidth
      popup.classList.add('m-sheet-open')
    }
    overlay?.classList.add('m-overlay-open')
  }

  overlay?.addEventListener('click', () => {
    if (popup?.style.display === 'block') closePopup()
  })

  saveBtn?.addEventListener('click', () => closePopup())

  editBtn?.addEventListener('click', () => {
    const comp = state.selected
    if (!comp) return

    if (titleEl) titleEl.textContent = `Editar ${TITLES[comp.type] || 'Componente'}`

    if (fieldsEl) {
      const unitConfig = UNIT_MAP[comp.type]

      if (unitConfig) {
        fieldsEl.innerHTML = `
          <div style="margin-bottom:16px">
            <label style="display:block;font-size:13px;color:#8e8e93;margin-bottom:8px">${unitConfig.label}</label>
            <input type="number" id="edit-value" step="${unitConfig.step}" value="${comp.value}"
              placeholder="${unitConfig.placeholder}"
              style="width:100%;padding:12px;background:#2c2c2e;border:0.5px solid rgba(255,255,255,0.1);border-radius:12px;color:white;font-size:16px">
          </div>`
      } else if (comp.type === 'switch') {
        fieldsEl.innerHTML = `
          <div style="margin-bottom:16px">
            <label style="display:block;font-size:13px;color:#8e8e93;margin-bottom:8px">Estado</label>
            <select id="edit-state"
              style="width:100%;padding:12px;background:#2c2c2e;border:0.5px solid rgba(255,255,255,0.1);border-radius:12px;color:white;font-size:16px">
              <option value="0" ${comp.value === 1 ? 'selected' : ''}>Cerrado</option>
              <option value="1" ${comp.value === 0 ? 'selected' : ''}>Abierto</option>
            </select>
          </div>`
      } else {
        fieldsEl.innerHTML = `
          <div style="margin-bottom:16px">
            <label style="display:block;font-size:13px;color:#8e8e93;margin-bottom:8px">Valor</label>
            <input type="text" value="${comp.value}" disabled
              style="width:100%;padding:12px;background:#2c2c2e;border:0.5px solid rgba(255,255,255,0.1);border-radius:12px;color:#666;font-size:16px">
          </div>`
      }

      // Input numérico
      let saveTimeout: number | undefined
      fieldsEl.querySelector<HTMLInputElement>('#edit-value')?.addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value)
        const selected = state.selected
        if (!selected || isNaN(val)) return
        selected.value = val
        emit(AppEvents.STATE_CHANGED, null)
        clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          saveBabylonSnapshot(state, `edit:${selected.type}`)
        }, 500) as unknown as number
      })



      
      // Select switch
// Select switch
fieldsEl.querySelector<HTMLSelectElement>('#edit-state')?.addEventListener('change', (e) => {
  if (!state.selected) return
  saveBabylonSnapshot(state, 'Modificar estado')
  const val = parseInt((e.target as HTMLSelectElement).value)
  state.selected.value = val
  state.selected.isOn = val === 1  // ← AGREGAR ESTA LÍNEA
  emit(AppEvents.STATE_CHANGED, null)
})
    }

    openPopup()
  })

  // Visibilidad del botón editar
  const updateVisibility = () => {
    const shouldShow = state.selected !== null && state.currentTool === 'select'
    if (editBtn) editBtn.style.display = shouldShow ? 'flex' : 'none'
    if (!shouldShow) closePopup()
  }

  on(AppEvents.STATE_CHANGED, updateVisibility)
  updateVisibility()
}