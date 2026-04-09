import type { AppState, ComponentType } from '@core/types'
import type { BabylonComponentManager } from '@scene/BabylonComponentManager'
import type { BabylonWireManager } from '@scene/BabylonWireManager'
import { emit, AppEvents } from '@core/events'
import { saveBabylonSnapshot } from '@core/babylon-history'
import { showNotification } from '../MobileNotifications'

interface ExpComponent { type: ComponentType; x: number; z: number }
interface ExpWire { from: number; fromTerm: string; to: number; toTerm: string }
interface Experiment {
  id: string
  nombre: string
  descripcion: string
  categoria: 'DC' | 'AC' | 'Mixto'
  icono: string
  components: ExpComponent[]
  wires: ExpWire[]
}

const CATEGORIES: Array<'DC' | 'AC' | 'Mixto'> = ['DC', 'AC', 'Mixto']
const CATEGORY_ICONS = { DC: '🔋', AC: '⚡', Mixto: '🔀' }
const CATEGORY_DESC  = { DC: 'Corriente Directa', AC: 'Corriente Alterna', Mixto: 'Circuitos Avanzados' }

const EXPERIMENTS: Experiment[] = [
  {
    id: 'ley-ohm',
    nombre: 'Ley de Ohm',
    descripcion: 'V = I × R — batería 9V con resistencia 100Ω → corriente 0.09A',
    categoria: 'DC', icono: '⚡',
    components: [
      { type: 'battery',  x: -4, z: 0 },
      { type: 'resistor', x:  0, z: 0 },
      { type: 'ammeter',  x:  4, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'input'    },
      { from: 2, fromTerm: 'output',   to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'diferencia-potencial',
    nombre: 'Diferencia de Potencial',
    descripcion: 'Voltímetro mide la caída de voltaje en la resistencia',
    categoria: 'DC', icono: '🔋',
    components: [
      { type: 'battery',   x: -5, z: 0 },
      { type: 'resistor',  x:  0, z: 0 },
      { type: 'voltmeter', x:  4, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'positive' },
      { from: 2, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'led-simple',
    nombre: 'Circuito LED con Switch',
    descripcion: 'Switch controla el encendido del LED — circuito abierto/cerrado',
    categoria: 'DC', icono: '💡',
    components: [
      { type: 'battery', x: -4, z: 0 },
      { type: 'switch',  x:  0, z: 0 },
      { type: 'led',     x:  4, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'positive' },
      { from: 2, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'led-protegido',
    nombre: 'LED con Resistencia Protectora',
    descripcion: 'Resistencia limita I para proteger el LED',
    categoria: 'DC', icono: '🔌',
    components: [
      { type: 'battery',  x: -5, z: 0 },
      { type: 'resistor', x: -1, z: 0 },
      { type: 'led',      x:  3, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'positive' },
      { from: 2, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'resistencias-serie',
    nombre: 'Resistencias en Serie',
    descripcion: 'Rtotal = R1+R2 = 200Ω — corriente igual en todo el circuito',
    categoria: 'DC', icono: '▬▬',
    components: [
      { type: 'battery',  x: -6, z: 0 },
      { type: 'resistor', x: -2, z: 0 },
      { type: 'resistor', x:  2, z: 0 },
      { type: 'ammeter',  x:  6, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'input'    },
      { from: 2, fromTerm: 'output',   to: 3, toTerm: 'input'    },
      { from: 3, fromTerm: 'output',   to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'circuito-rc',
    nombre: 'Circuito RC',
    descripcion: 'Resistencia + Capacitor en serie — carga y descarga exponencial',
    categoria: 'DC', icono: '╫',
    components: [
      { type: 'battery',   x: -5, z: 0 },
      { type: 'resistor',  x: -1, z: 0 },
      { type: 'capacitor', x:  3, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'positive' },
      { from: 2, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'cortocircuito',
    nombre: 'Cortocircuito ⚠️',
    descripcion: 'Sin resistencia de carga — error del simulador',
    categoria: 'DC', icono: '⚠️',
    components: [
      { type: 'battery', x: -3, z: 0 },
      { type: 'switch',  x:  3, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'ac-basico',
    nombre: 'Fuente AC con Resistencia',
    descripcion: 'Corriente alterna 120V — I = V/R en corriente alterna',
    categoria: 'AC', icono: '⚡',
    components: [
      { type: 'ac-source', x: -4, z: 0 },
      { type: 'resistor',  x:  0, z: 0 },
      { type: 'ammeter',   x:  4, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'input'    },
      { from: 2, fromTerm: 'output',   to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'ac-diodo',
    nombre: 'Rectificador con Diodo',
    descripcion: 'Diodo convierte AC → DC — solo pasa semiciclo positivo',
    categoria: 'AC', icono: '◄',
    components: [
      { type: 'ac-source', x: -6, z: 0 },
      { type: 'diode',     x: -2, z: 0 },
      { type: 'resistor',  x:  2, z: 0 },
      { type: 'led',       x:  6, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'input'    },
      { from: 2, fromTerm: 'output',   to: 3, toTerm: 'positive' },
      { from: 3, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'ac-rl',
    nombre: 'Circuito RL — Ley de Faraday',
    descripcion: 'Inductor en AC genera reactancia inductiva',
    categoria: 'AC', icono: '⊸',
    components: [
      { type: 'ac-source', x: -5, z: 0 },
      { type: 'resistor',  x: -1, z: 0 },
      { type: 'inductor',  x:  3, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'input'    },
      { from: 2, fromTerm: 'output',   to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'medicion-completa',
    nombre: 'Medición Completa V e I',
    descripcion: 'Amperímetro + voltímetro en serie — observa V e I simultáneamente',
    categoria: 'Mixto', icono: '📊',
    components: [
      { type: 'battery',   x: -6, z: 0 },
      { type: 'resistor',  x: -2, z: 0 },
      { type: 'ammeter',   x:  2, z: 0 },
      { type: 'voltmeter', x:  6, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'input'    },
      { from: 2, fromTerm: 'output',   to: 3, toTerm: 'positive' },
      { from: 3, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'serie-led-res',
    nombre: 'Serie Complejo con LED',
    descripcion: '2 resistencias + LED en serie — voltaje se divide entre los 3',
    categoria: 'Mixto', icono: '🔗',
    components: [
      { type: 'battery',  x: -6, z: 0 },
      { type: 'resistor', x: -2, z: 0 },
      { type: 'resistor', x:  2, z: 0 },
      { type: 'led',      x:  6, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'input'    },
      { from: 2, fromTerm: 'output',   to: 3, toTerm: 'positive' },
      { from: 3, fromTerm: 'negative', to: 0, toTerm: 'negative' },
    ],
  },
  {
    id: 'rl-dc',
    nombre: 'Circuito RL en DC',
    descripcion: 'Inductor almacena energía magnética en DC',
    categoria: 'Mixto', icono: '⊸🔋',
    components: [
      { type: 'battery',  x: -5, z: 0 },
      { type: 'resistor', x: -1, z: 0 },
      { type: 'inductor', x:  3, z: 0 },
    ],
    wires: [
      { from: 0, fromTerm: 'positive', to: 1, toTerm: 'input'    },
      { from: 1, fromTerm: 'output',   to: 2, toTerm: 'input'    },
      { from: 2, fromTerm: 'output',   to: 0, toTerm: 'negative' },
    ],
  },
]

function buildExperimentsHTML(): string {
  return CATEGORIES.map(cat => `
    <div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:18px">${CATEGORY_ICONS[cat]}</span>
        <div>
          <div style="font-size:13px;font-weight:700;color:#f5f5f7">${cat}</div>
          <div style="font-size:11px;color:#636366">${CATEGORY_DESC[cat]}</div>
        </div>
      </div>
      ${EXPERIMENTS.filter(e => e.categoria === cat).map(exp => `
        <div class="m-exp-card" data-exp="${exp.id}" style="
          background:#2c2c2e;border-radius:14px;padding:14px 16px;
          margin-bottom:8px;border:1px solid rgba(255,255,255,0.06);
          display:flex;align-items:center;gap:12px;cursor:pointer;
        ">
          <div style="
            width:44px;height:44px;border-radius:12px;
            background:rgba(0,122,255,0.12);
            display:flex;align-items:center;justify-content:center;
            font-size:20px;flex-shrink:0
          ">${exp.icono}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:600;color:#f5f5f7;margin-bottom:2px">${exp.nombre}</div>
            <div style="font-size:11px;color:#636366;line-height:1.4">${exp.descripcion}</div>
          </div>
          <div style="color:#636366;font-size:18px;flex-shrink:0">›</div>
        </div>
      `).join('')}
    </div>
  `).join('')
}

export function setupMobileExperiments(
  state: AppState,
  cm: BabylonComponentManager,
  wm: BabylonWireManager,
  onLoad: () => void,
  containerId: string = 'mobile-ui'
): void {
  const target = document.getElementById(containerId)
  if (!target) return

  // Si se inyecta en un contenedor existente (tab de análisis)
  if (containerId !== 'mobile-ui') {
    target.innerHTML = buildExperimentsHTML()
  } else {
    // Inyectar pantalla propia
    document.getElementById('mobile-ui')?.insertAdjacentHTML('beforeend', `
      <div id="m-experiments-screen" style="
        display:none;position:fixed;
        top:0;left:0;right:0;bottom:60px;
        background:#111112;flex-direction:column;z-index:100;
      ">
        <div style="
          padding:16px 20px;padding-top:calc(16px + env(safe-area-inset-top));
          background:#1c1c1e;border-bottom:1px solid rgba(255,255,255,0.08)
        ">
          <span style="font-size:17px;font-weight:700;color:#f5f5f7">Experimentos</span>
        </div>
        <div style="flex:1;overflow-y:auto;padding:14px 16px">
          ${buildExperimentsHTML()}
        </div>
      </div>
    `)
  }

  // ── Listeners en tarjetas ──
  document.querySelectorAll<HTMLElement>('.m-exp-card').forEach(card => {
    card.addEventListener('click', () => {
      const id  = card.dataset['exp']!
      const exp = EXPERIMENTS.find(e => e.id === id)
      if (!exp) return

      cm.clear()
      wm.clear()

      const created = exp.components.map(c => cm.add(c.type, c.x, c.z))

      setTimeout(() => {
        exp.wires.forEach(w => {
          const startComp = created[w.from]
          const endComp   = created[w.to]
          if (!startComp || !endComp) return
          const startTerm = startComp.terminals.find(t => t.type === w.fromTerm)
          const endTerm   = endComp.terminals.find(t => t.type === w.toTerm)
          if (startTerm && endTerm) wm.create(startComp, startTerm, endComp, endTerm)
        })

        saveBabylonSnapshot(state, `exp:${exp.nombre}`)
        emit(AppEvents.STATE_CHANGED, null)
        showNotification(`🧪 ${exp.nombre} cargado`, 'success')
        onLoad()
      }, 80)

      card.style.background = 'rgba(0,122,255,0.15)'
      setTimeout(() => card.style.background = '#2c2c2e', 300)
    })
  })
}