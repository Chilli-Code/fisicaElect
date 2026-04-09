import type { AppState, ComponentType } from '@core/types'
import type { BabylonComponentManager } from '@scene/BabylonComponentManager'
import { emit, AppEvents } from '@core/events'
import { saveBabylonSnapshot } from '@core/babylon-history'
import { playSound } from './screens/MobileSettings'
export const COMPONENTS = [
  { type: 'battery',    icon: '🔋', name: 'Batería',    sub: '9V DC'    },
  { type: 'resistor',   icon: '▬',  name: 'Resist.',    sub: '100Ω'     },
  { type: 'led',        icon: '💡', name: 'LED',        sub: 'Emisor'   },
  { type: 'switch',     icon: '⏚',  name: 'Switch',     sub: 'ON/OFF'   },
  { type: 'voltmeter',  icon: 'V',  name: 'Voltím.',    sub: 'Medir V'  },
  { type: 'ammeter',    icon: 'A',  name: 'Amper.',     sub: 'Medir A'  },
  { type: 'capacitor',  icon: '╫',  name: 'Capac.',     sub: 'Faradios' },
  { type: 'inductor',   icon: '⊸',  name: 'Inductor',   sub: 'Henrios'  },
  { type: 'diode',      icon: '◄',  name: 'Diodo',      sub: '0.7V'     },
  { type: 'transistor', icon: '🔺', name: 'Transistor', sub: 'NPN'      },
  { type: 'ac-source',  icon: '⚡', name: 'Fuente AC',  sub: '120V'     },
]

export function setupComponentGrid(state: AppState, cm: BabylonComponentManager): void {
  document.querySelectorAll<HTMLElement>('.m-comp').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset['type'] as ComponentType
      if (!type) return
      cm.add(type, (Math.random() * 10) - 5, (Math.random() * 10) - 5)
      saveBabylonSnapshot(state, `add:${type}`)
      closeSheet()
      emit(AppEvents.STATE_CHANGED, null)
      playSound('add')
    })
  })

  document.getElementById('m-add-btn')?.addEventListener('click', openSheet)
  document.getElementById('m-sheet-overlay')?.addEventListener('click', closeSheet)
}

export function openSheet(): void {
  document.getElementById('m-sheet')?.classList.add('m-sheet-open')
  document.getElementById('m-sheet-overlay')?.classList.add('m-overlay-open')
}

export function closeSheet(): void {
  document.getElementById('m-sheet')?.classList.remove('m-sheet-open')
  document.getElementById('m-sheet-overlay')?.classList.remove('m-overlay-open')
}