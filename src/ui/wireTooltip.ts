// ============================================================
// src/ui/wireTooltip.ts
// Tooltip que aparece al hacer hover sobre un cable.
// Muestra el color, tipo y estándar IEC.
// ============================================================

import * as THREE from 'three'
import type { AppState, Wire } from '@core/types'
import type { SceneManager } from '@scene/SceneManager'

// ── Datos de cada color de cable ─────────────────────────────
interface WireInfo {
  label: string
  colorHex: string
  standard: string
  description: string
}

const WIRE_INFO: Record<number, WireInfo> = {
  0xff0000: {
    label: 'Positivo DC',
    colorHex: '#FF3B3B',
    standard: 'NEC / IEC 60446',
    description: 'Conductor activo. Lleva corriente desde el polo + de la fuente.',
  },
  0x000000: {
    label: 'Negativo / Tierra DC',
    colorHex: '#555555',
    standard: 'NEC / IEC 60446',
    description: 'Conductor de retorno. Cierra el circuito hacia el polo − de la fuente.',
  },
  0xff8c00: {
    label: 'Salida a carga',
    colorHex: '#FF8C00',
    standard: 'Convención interna',
    description: 'Conecta la salida de un componente con la entrada de la carga.',
  },
  0x0000cd: {
    label: 'Retorno de carga',
    colorHex: '#0055DD',
    standard: 'Convención interna',
    description: 'Cable de retorno desde la salida hacia el negativo de la fuente.',
  },
  0x1e90ff: {
    label: 'Neutro AC',
    colorHex: '#1E90FF',
    standard: 'IEC 60446 (Europa)',
    description: 'Conductor neutro de corriente alterna. No tiene potencial respecto a tierra.',
  },
  0x8b4513: {
    label: 'Fase AC',
    colorHex: '#8B4513',
    standard: 'IEC 60446 (Europa)',
    description: 'Conductor de fase. Tiene potencial oscilante de 120V o 220V AC.',
  },
  0x808080: {
    label: 'Cable genérico',
    colorHex: '#808080',
    standard: '—',
    description: 'Conexión entre terminales de tipo no específico.',
  },
}

function getWireInfo(color: number): WireInfo {
  return WIRE_INFO[color] ?? {
    label: 'Cable',
    colorHex: '#808080',
    standard: '—',
    description: 'Conexión entre componentes.',
  }
}

// ── DOM del tooltip ───────────────────────────────────────────
let tooltipEl: HTMLDivElement | null = null
let lastHoveredWire: Wire | null = null

function ensureTooltip(): HTMLDivElement {
  if (tooltipEl) return tooltipEl
  tooltipEl = document.createElement('div')
  tooltipEl.id = 'wire-tooltip'
  tooltipEl.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 500;
    background: rgba(28,28,30,0.96);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 10px 14px;
    min-width: 200px;
    max-width: 260px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    opacity: 0;
    transform: translateY(4px);
    transition: opacity .15s ease, transform .15s ease;
    font-family: -apple-system, 'SF Pro Display', sans-serif;
  `
  document.body.appendChild(tooltipEl)
  return tooltipEl
}

function showTooltip(wire: Wire, x: number, y: number): void {
  const el = ensureTooltip()
  const info = getWireInfo(wire.baseColor)

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <div style="
        width:14px;height:14px;border-radius:50%;
        background:${info.colorHex};
        border:2px solid rgba(255,255,255,0.2);
        flex-shrink:0
      "></div>
      <span style="font-size:13px;font-weight:600;color:#f5f5f7">${info.label}</span>
    </div>
    <div style="font-size:11px;color:#aeaeb2;margin-bottom:6px;line-height:1.5">
      ${info.description}
    </div>
    <div style="
      display:inline-block;
      font-size:10px;
      color:#007AFF;
      background:rgba(0,122,255,0.12);
      border-radius:4px;
      padding:2px 6px
    ">${info.standard}</div>
  `

  // Posicionar evitando bordes
  const vw = window.innerWidth
  const vh = window.innerHeight
  let left = x + 16
  let top  = y - 20
  if (left + 280 > vw) left = x - 280
  if (top + 120 > vh)  top  = y - 120

  el.style.left    = `${left}px`
  el.style.top     = `${top}px`
  el.style.opacity = '1'
  el.style.transform = 'translateY(0)'
}

function hideTooltip(): void {
  if (!tooltipEl) return
  tooltipEl.style.opacity    = '0'
  tooltipEl.style.transform  = 'translateY(4px)'
}

// ── Setup público ─────────────────────────────────────────────
export function setupWireTooltip(
  state: AppState,
  sm: SceneManager,
  canvas: HTMLCanvasElement,
): void {
  canvas.addEventListener('mousemove', (e) => {
    sm.updateMouseFromEvent(e, canvas)
    sm.raycaster.setFromCamera(sm.mouse, sm.camera)
    sm.raycaster.params.Line = { threshold: 0.3 }

    const wireMeshes = state.wires.map(w => w.mesh)
    const hits = sm.raycaster.intersectObjects(wireMeshes)

    if (hits.length > 0) {
      const wire = state.wires.find(w => w.mesh === hits[0]!.object)
      if (wire && wire !== lastHoveredWire) {
        lastHoveredWire = wire
        showTooltip(wire, e.clientX, e.clientY)
      } else if (wire) {
        // Solo reposicionar
        const el = ensureTooltip()
        const vw = window.innerWidth
        const vh = window.innerHeight
        let left = e.clientX + 16
        let top  = e.clientY - 20
        if (left + 280 > vw) left = e.clientX - 280
        if (top + 120 > vh)  top  = e.clientY - 120
        el.style.left = `${left}px`
        el.style.top  = `${top}px`
      }
    } else {
      if (lastHoveredWire) {
        lastHoveredWire = null
        hideTooltip()
      }
    }
  })

  canvas.addEventListener('mouseleave', () => {
    lastHoveredWire = null
    hideTooltip()
  })
}
