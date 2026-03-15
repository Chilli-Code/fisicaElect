// ============================================================
// src/ui/wireLegendModal.ts
// Modal con la leyenda completa de colores de cables.
// Se abre desde un botón en la toolbar.
// ============================================================

const LEGEND = [
    {
    color: '#34C759',
    border: '#34C759',
    label: 'Salida (OUT)',
    standard: 'Terminal',
    description: 'Punto de salida del componente. El punto verde que ves en switches y resistencias.',
    example: 'Switch (out) → siguiente componente',
  },
  {
    color: '#FF3B3B',
    border: '#ff0000',
    label: 'Positivo DC',
    standard: 'NEC / IEC 60446',
    description: 'Desde el polo + de la batería. Indica el conductor activo con tensión positiva.',
    example: 'Batería (+) → Switch',
  },
  {
    color: '#444444',
    border: '#888888',
    label: 'Negativo / Tierra DC',
    standard: 'NEC / IEC 60446',
    description: 'Cierra el circuito de regreso al polo − de la fuente.',
    example: 'LED (−) → Batería (−)',
  },
  {
    color: '#FF8C00',
    border: '#ff8c00',
    label: 'Salida a carga',
    standard: 'Convención interna',
    description: 'Del terminal de salida de un componente hacia la entrada de la carga siguiente.',
    example: 'Switch (out) → Resistencia',
  },
  {
    color: '#0055DD',
    border: '#0000cd',
    label: 'Retorno de carga',
    standard: 'Convención interna',
    description: 'Retorno desde la salida de un componente hacia el negativo de la fuente.',
    example: 'Diodo (out) → Batería (−)',
  },
  {
    color: '#1E90FF',
    border: '#1e90ff',
    label: 'Neutro AC',
    standard: 'IEC 60446 (Europa)',
    description: 'Conductor neutro de corriente alterna. Sin potencial respecto a tierra.',
    example: 'Fuente AC (−) → carga',
  },
  {
    color: '#8B4513',
    border: '#8b4513',
    label: 'Fase AC',
    standard: 'IEC 60446 (Europa)',
    description: 'Conductor de fase con potencial oscilante de 120V / 220V AC.',
    example: 'Fuente AC (+) → carga',
  },
  {
    color: '#888888',
    border: '#808080',
    label: 'Cable genérico',
    standard: '—',
    description: 'Conexión entre terminales cuya polaridad no encaja en ningún estándar definido.',
    example: 'Cualquier conexión mixta',
  },
]

let modalEl: HTMLDivElement | null = null

function buildModal(): HTMLDivElement {
  const modal = document.createElement('div')
  modal.id = 'wire-legend-modal'
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(6px);
    opacity: 0; transition: opacity .2s ease;
    pointer-events: none;
  `

  modal.innerHTML = `
    <div style="
      background: #1c1c1e;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
      width: 540px;
      max-width: 95vw;
      max-height: 85vh;
      overflow-y: auto;
      transform: scale(0.96);
      transition: transform .2s ease;
    " id="wire-legend-box">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div>
          <h2 style="font-size:17px;font-weight:700;color:#f5f5f7;margin:0">
            Estándar de colores de cables
          </h2>
          <p style="font-size:12px;color:#aeaeb2;margin:4px 0 0">
            Basado en NEC (EEUU) e IEC 60446 (Europa)
          </p>
        </div>
        <button id="close-legend-modal" style="
          width:32px;height:32px;border:none;
          background:rgba(255,255,255,0.08);
          color:#f5f5f7;border-radius:8px;
          cursor:pointer;font-size:18px;
          display:flex;align-items:center;justify-content:center;
          transition:background .15s;
        ">✕</button>
      </div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
  ${LEGEND.map(item => `
    <div style="
      display:flex;gap:12px;align-items:flex-start;
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.07);
      border-radius:10px;padding:12px;
      border-left: 3px solid ${item.border};
    ">
      <div style="
        width:18px;height:18px;border-radius:50%;
        background:${item.color};flex-shrink:0;margin-top:2px;
        border:2px solid rgba(255,255,255,0.15);
      "></div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
          <span style="font-size:13px;font-weight:600;color:#f5f5f7">${item.label}</span>
          <span style="
            font-size:10px;color:#007AFF;
            background:rgba(0,122,255,0.12);
            border-radius:4px;padding:1px 6px;
          ">${item.standard}</span>
        </div>
        <p style="font-size:12px;color:#aeaeb2;margin:0 0 4px;line-height:1.5">
          ${item.description}
        </p>
        <div style="font-size:10px;color:#636366">
          Ej: <span style="color:#8e8e93;font-style:italic">${item.example}</span>
        </div>
      </div>
    </div>
  `).join('')}
</div>

      <div style="
        margin-top:16px;padding:12px;
        background:rgba(0,122,255,0.08);
        border:1px solid rgba(0,122,255,0.2);
        border-radius:10px;
        font-size:11px;color:#aeaeb2;line-height:1.6
      ">
        💡 <strong style="color:#f5f5f7">Tip:</strong>
        Pasa el mouse sobre cualquier cable en el simulador para ver su tipo y estándar al instante.
        Haz <strong style="color:#f5f5f7">clic derecho</strong> sobre un cable para eliminarlo.
      </div>
    </div>
  `

  document.body.appendChild(modal)
  return modal
}

export function openLegendModal(): void {
  if (!modalEl) modalEl = buildModal()

  modalEl.style.pointerEvents = 'auto'
  requestAnimationFrame(() => {
    modalEl!.style.opacity = '1'
    const box = document.getElementById('wire-legend-box')
    if (box) box.style.transform = 'scale(1)'
  })

  document.getElementById('close-legend-modal')?.addEventListener('click', closeLegendModal)
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeLegendModal()
  })
}

function closeLegendModal(): void {
  if (!modalEl) return
  modalEl.style.opacity = '0'
  modalEl.style.pointerEvents = 'none'
  const box = document.getElementById('wire-legend-box')
  if (box) box.style.transform = 'scale(0.96)'
}

export function setupLegendButton(): void {
  // Inyectar botón en la toolbar
  const toolbar = document.querySelector('.toolbar')
  if (!toolbar) return

  const group = document.createElement('div')
  group.className = 'tool-group'
  group.style.marginLeft = 'auto' // empujar a la derecha

  group.innerHTML = `
    <button
      id="legend-btn"
      class="tool-button"
      title="Leyenda de colores de cables"
      style="width:auto;padding:0 10px;gap:6px;font-size:11px;font-weight:500"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>
        <path d="M7 6.5V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="7" cy="4.5" r="0.75" fill="currentColor"/>
      </svg>
      Colores de cables
    </button>
  `
  toolbar.appendChild(group)

  document.getElementById('legend-btn')?.addEventListener('click', openLegendModal)
}
