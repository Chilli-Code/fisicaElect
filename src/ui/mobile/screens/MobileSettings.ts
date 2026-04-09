import { clearSession } from '@ui/auth'
import { showNotification } from '../MobileNotifications'

// ─── Sonidos ──────────────────────────────────────────────────────────────────

const AudioContext = window.AudioContext || (window as any).webkitAudioContext

let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

// Volúmenes guardados en localStorage
const VOLUME_KEY = 'circuitlab_volumes'

interface Volumes {
  master: number   // 0-1
  connect: number  // cable conectado
  simulate: number // simular ON/OFF
  error: number    // error de conexión
  delete: number   // eliminar
  add: number      // agregar componente
  click: number    // click general
}

function loadVolumes(): Volumes {
  try {
    return JSON.parse(localStorage.getItem(VOLUME_KEY) ?? '{}')
  } catch { return {} as Volumes }
}

function saveVolumes(v: Volumes): void {
  localStorage.setItem(VOLUME_KEY, JSON.stringify(v))
}

let volumes: Volumes = Object.assign(
  {
    master: 0.8,
    connect: 0.9,
    simulate: 0.8,
    error: 0.7,
    delete: 0.6,
    add: 0.7,
    click: 0.4,
  },
  loadVolumes()
)
// ─── Generadores de sonido con Web Audio API ──────────────────────────────────

export function playSound(type: keyof Omit<Volumes, 'master'>): void {
  if (volumes.master === 0) return
  const vol = volumes[type] * volumes.master

  try {
    const ctx = getAudioCtx()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(vol, ctx.currentTime)

    switch (type) {
      case 'connect': {
        // Chispa eléctrica — ruido corto con pitch descendente
        const osc = ctx.createOscillator()
        const g   = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15)
        g.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start(); osc.stop(ctx.currentTime + 0.15)
        // Segunda chispa
        const osc2 = ctx.createOscillator()
        const g2   = ctx.createGain()
        osc2.connect(g2); g2.connect(ctx.destination)
        osc2.type = 'square'
        osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.05)
        osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2)
        g2.gain.setValueAtTime(vol * 0.2, ctx.currentTime + 0.05)
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc2.start(ctx.currentTime + 0.05); osc2.stop(ctx.currentTime + 0.2)
        break
      }
      case 'simulate': {
        // Click eléctrico + tono ascendente
        const osc = ctx.createOscillator()
        const g   = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
        g.gain.setValueAtTime(vol * 0.4, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc.start(); osc.stop(ctx.currentTime + 0.2)
        break
      }
      case 'error': {
        // Buzzer de error — dos tonos bajos
        [0, 0.15].forEach((delay, i) => {
          const osc = ctx.createOscillator()
          const g   = ctx.createGain()
          osc.connect(g); g.connect(ctx.destination)
          osc.type = 'square'
          osc.frequency.setValueAtTime(i === 0 ? 220 : 180, ctx.currentTime + delay)
          g.gain.setValueAtTime(vol * 0.25, ctx.currentTime + delay)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12)
          osc.start(ctx.currentTime + delay)
          osc.stop(ctx.currentTime + delay + 0.12)
        })
        break
      }
      case 'delete': {
        // Tono descendente corto
        const osc = ctx.createOscillator()
        const g   = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(500, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.18)
        g.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
        osc.start(); osc.stop(ctx.currentTime + 0.18)
        break
      }
      case 'add': {
        // Pop suave ascendente
        const osc = ctx.createOscillator()
        const g   = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(400, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.1)
        g.gain.setValueAtTime(vol * 0.25, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start(); osc.stop(ctx.currentTime + 0.15)
        break
      }
      case 'click': {
        // Click sutil
        const osc = ctx.createOscillator()
        const g   = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1000, ctx.currentTime)
        g.gain.setValueAtTime(vol * 0.15, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
        osc.start(); osc.stop(ctx.currentTime + 0.05)
        break
      }
    }
  } catch (e) {
    console.warn('Audio error:', e)
  }
}



// ─── Setup ────────────────────────────────────────────────────────────────────

export function setupMobileSettings(): void {
  document.getElementById('mobile-ui')?.insertAdjacentHTML('beforeend', `
    <div id="m-settings-screen" style="
      display:none;position:fixed;
      top:0;left:0;right:0;bottom:60px;
      background:#111112;flex-direction:column;z-index:100;
      overflow-y:auto;
    ">
      <div style="
        padding:16px 20px;padding-top:calc(16px + env(safe-area-inset-top));
        background:#1c1c1e;border-bottom:1px solid rgba(255,255,255,0.08)
      ">
        <span style="font-size:17px;font-weight:700;color:#f5f5f7">Configuración</span>
      </div>

      <div style="padding:16px">

        <!-- SONIDOS -->
        <div style="margin-bottom:24px">
          <p style="font-size:11px;color:#636366;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px 4px">Sonidos</p>
          <div style="background:#2c2c2e;border-radius:14px;overflow:hidden">
            ${[
              { key: 'master',   label: '🔊 Volumen general',   sub: 'Control maestro' },
              { key: 'connect',  label: '⚡ Conectar cable',     sub: 'Chispa al unir terminales' },
              { key: 'simulate', label: '▶️ Simulación',         sub: 'Al iniciar o pausar' },
              { key: 'error',    label: '❌ Error de conexión',  sub: 'Conexión inválida' },
              { key: 'add',      label: '➕ Agregar componente', sub: 'Al soltar en el canvas' },
              { key: 'delete',   label: '🗑️ Eliminar',           sub: 'Al borrar componente o cable' },
              { key: 'click',    label: '👆 Click general',      sub: 'Toque en botones' },
            ].map((s, i, arr) => `
              <div style="padding:14px 16px;${i < arr.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.06)' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <div>
                    <div style="font-size:14px;color:#f5f5f7;font-weight:500">${s.label}</div>
                    <div style="font-size:11px;color:#636366;margin-top:1px">${s.sub}</div>
                  </div>
                  <span id="vol-label-${s.key}" style="font-size:13px;color:#007AFF;font-weight:600;min-width:36px;text-align:right">
                    ${Math.round((volumes as any)[s.key] * 100)}%
                  </span>
                </div>
                <input type="range" id="vol-${s.key}" min="0" max="100"
                  value="${Math.round((volumes as any)[s.key] * 100)}"
                  style="width:100%;height:4px;-webkit-appearance:none;appearance:none;
                    background:linear-gradient(to right, #007AFF ${Math.round((volumes as any)[s.key] * 100)}%, #3a3a3c ${Math.round((volumes as any)[s.key] * 100)}%);
                    border-radius:2px;outline:none;cursor:pointer">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- CUENTA -->
        <div style="margin-bottom:24px">
          <p style="font-size:11px;color:#636366;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px 4px">Cuenta</p>
          <div style="background:#2c2c2e;border-radius:14px;overflow:hidden">
            <button id="m-logout-btn" style="
              width:100%;padding:14px 16px;background:transparent;border:none;
              color:#FF3B30;font-size:15px;font-weight:500;cursor:pointer;
              display:flex;align-items:center;gap:10px
            ">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#FF3B30" stroke-width="1.5" stroke-linecap="round">
                <path d="M13 3h4v14h-4M9 15l5-5-5-5M14 10H3"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div style="text-align:center;padding:8px;color:#3a3a3c;font-size:12px">
          Circuit Lab Pro · v1.0 Mobile
        </div>

      </div>
    </div>
  `)

  // Sliders
  const SOUND_KEYS: Array<keyof Volumes> = ['master', 'connect', 'simulate', 'error', 'add', 'delete', 'click']
  SOUND_KEYS.forEach(key => {
    const slider = document.getElementById(`vol-${key}`) as HTMLInputElement
    const label  = document.getElementById(`vol-label-${key}`)
    if (!slider) return
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value) / 100
      ;(volumes as any)[key] = val
      if (label) label.textContent = `${slider.value}%`
      slider.style.background = `linear-gradient(to right, #007AFF ${slider.value}%, #3a3a3c ${slider.value}%)`
      saveVolumes(volumes)
      if (key !== 'master') playSound(key as keyof Omit<Volumes, 'master'>)
    })
  })

  // Cerrar sesión
  document.getElementById('m-logout-btn')?.addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) {
      clearSession()
      window.location.reload()
    }
  })
}