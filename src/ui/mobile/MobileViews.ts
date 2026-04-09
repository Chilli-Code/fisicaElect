import type { BabylonSceneManager } from '@scene/BabylonSceneManager'

type ViewType = 'perspective' | 'top' | 'iso' | 'front'

const VIEWS = [
  {
    id: 'perspective',
    label: '3D',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <path d="M8 2L14 5V11L8 14L2 11V5L8 2Z"/>
    </svg>`
  },
  {
    id: 'top',
    label: 'Top',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <rect x="3" y="3" width="10" height="10" rx="1"/><circle cx="8" cy="8" r="2"/>
    </svg>`
  },
  {
    id: 'iso',
    label: 'Iso',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <path d="M8 2L14 5V11L8 14L2 11V5L8 2Z"/><path d="M2 5L8 8L14 5"/><path d="M8 8V14"/>
    </svg>`
  },
  {
    id: 'front',
    label: 'Front',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <rect x="2" y="4" width="12" height="8" rx="1"/><path d="M5 8h6M8 6v4"/>
    </svg>`
  },
]

export function setupMobileViews(sm: BabylonSceneManager): void {
  // Inyectar botón flotante + menu
  document.getElementById('mobile-ui')?.insertAdjacentHTML('beforeend', `
    <div id="m-view-menu" style="
      display: none;
      position: fixed;
      bottom: 238px;
      right: 4px;
      background: rgba(28,28,30,0.95);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 6px;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      backdrop-filter: blur(12px);
      flex-direction: column;
      gap: 4px;
    ">
      ${VIEWS.map(v => `
        <button class="m-view-opt" data-view="${v.id}" style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #f5f5f7;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        ">
          ${v.icon}
          ${v.label}
        </button>
      `).join('')}
    </div>

    <button id="m-view-btn" style="
      position: fixed;
      bottom: 190px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(28,28,30,0.9);
      border: 1px solid rgba(255,255,255,0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 44;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      backdrop-filter: blur(8px);
    ">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round">
        <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z"/>
        <path d="M9 2V16M2 6L16 6"/>
      </svg>
    </button>
  `)

  const viewBtn  = document.getElementById('m-view-btn')
  const viewMenu = document.getElementById('m-view-menu')
  let menuOpen   = false

  // Toggle menu
  viewBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    menuOpen = !menuOpen
    if (viewMenu) {
      viewMenu.style.display = menuOpen ? 'flex' : 'none'
    }
    if (viewBtn) {
      viewBtn.style.background = menuOpen
        ? 'rgba(0,122,255,0.8)'
        : 'rgba(28,28,30,0.9)'
    }
  })

  // Cerrar al tocar fuera
  document.addEventListener('click', () => {
    if (!menuOpen) return
    menuOpen = false
    if (viewMenu) viewMenu.style.display = 'none'
    if (viewBtn) viewBtn.style.background = 'rgba(28,28,30,0.9)'
  })

  // Cambiar vista
  document.querySelectorAll<HTMLButtonElement>('.m-view-opt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const view = btn.dataset['view'] as ViewType
      applyView(sm, view)

      // Marcar activo
      document.querySelectorAll<HTMLButtonElement>('.m-view-opt').forEach(b => {
        b.style.background = 'transparent'
        b.style.color = '#f5f5f7'
      })
      btn.style.background = 'rgba(0,122,255,0.2)'
      btn.style.color = '#007AFF'

      // Cerrar menu
      menuOpen = false
      if (viewMenu) viewMenu.style.display = 'none'
      if (viewBtn) viewBtn.style.background = 'rgba(28,28,30,0.9)'
    })

    // Hover
    btn.addEventListener('mouseenter', () => {
      if (btn.style.color !== 'rgb(0, 122, 255)') {
        btn.style.background = 'rgba(255,255,255,0.05)'
      }
    })
    btn.addEventListener('mouseleave', () => {
      if (btn.style.color !== 'rgb(0, 122, 255)') {
        btn.style.background = 'transparent'
      }
    })
  })
}

function applyView(sm: BabylonSceneManager, view: ViewType): void {
  const camera = sm.camera as any

const targets: Record<ViewType, { alpha: number; beta: number; radius: number }> = {
  perspective: { alpha: -Math.PI / 4, beta: Math.PI / 4,   radius: 30 },
  top:         { alpha: -Math.PI / 2, beta: 0.01,           radius: 55 },
  iso:         { alpha: -Math.PI / 4, beta: Math.PI / 3.5,  radius: 45 },
  front:       { alpha: -Math.PI / 2, beta: Math.PI / 2,    radius: 30 },  // ← exactamente como la foto
}

  const target = targets[view]
  const duration = 400 // ms
  const start = Date.now()

  const fromAlpha  = camera.alpha
  const fromBeta   = camera.beta
  const fromRadius = camera.radius

  const animate = () => {
    const elapsed  = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3)

    camera.alpha  = fromAlpha  + (target.alpha  - fromAlpha)  * eased
    camera.beta   = fromBeta   + (target.beta   - fromBeta)   * eased
    camera.radius = fromRadius + (target.radius - fromRadius) * eased

    if (progress < 1) requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
}