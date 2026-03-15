import { saveSession } from './auth'
import type { UserProfile } from '@core/user'
import { showOnboarding } from './onboarding'

const AVATARS = ['🧑‍🔬', '👩‍🔬', '🧑‍💻', '👩‍💻', '🧑‍🏫', '👩‍🏫', '⚡', '🔋', '💡', '🔌']

export function showLoginScreen(onDone: (user: UserProfile) => void): void {
  const el = document.createElement('div')
  el.id = 'login-screen'
  el.style.cssText = `
    position:fixed;inset:0;z-index:9000;
    background:#0a0a0b;
    display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,'SF Pro Display',sans-serif;
  `

  el.innerHTML = `
    <div style="width:380px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">⚡</div>
      <h1 style="font-size:26px;font-weight:700;color:#f5f5f7;margin:0 0 6px">Circuit Lab Pro</h1>
      <p style="font-size:14px;color:#636366;margin:0 0 32px">Simulador 3D de física eléctrica</p>

      <div style="background:#1c1c1e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;text-align:left">
        
        <div style="margin-bottom:20px">
          <label style="font-size:12px;color:#aeaeb2;display:block;margin-bottom:6px">Tu nombre</label>
          <input id="login-name" type="text" placeholder="Ej: María García"
            style="width:100%;padding:10px 12px;background:#2c2c2e;border:1px solid #3a3a3c;
            border-radius:8px;color:white;font-size:14px;box-sizing:border-box;outline:none"
          >
        </div>

        <div style="margin-bottom:24px">
          <label style="font-size:12px;color:#aeaeb2;display:block;margin-bottom:10px">Elige tu avatar</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${AVATARS.map((a, i) => `
              <button class="avatar-btn" data-avatar="${a}" style="
                width:44px;height:44px;border-radius:10px;border:2px solid transparent;
                background:#2c2c2e;font-size:22px;cursor:pointer;transition:all .15s;
                ${i === 0 ? 'border-color:#007AFF;background:#1a2840' : ''}
              ">${a}</button>
            `).join('')}
          </div>
        </div>

        <button id="login-next" style="
          width:100%;padding:12px;background:#007AFF;border:none;
          border-radius:10px;color:white;font-size:15px;font-weight:600;cursor:pointer;
        ">Continuar →</button>
      </div>
    </div>
  `

  document.body.appendChild(el)

  // Avatar selection
  let selectedAvatar = AVATARS[0]!
  el.querySelectorAll<HTMLButtonElement>('.avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll<HTMLButtonElement>('.avatar-btn').forEach(b => {
        b.style.borderColor = 'transparent'
        b.style.background = '#2c2c2e'
      })
      btn.style.borderColor = '#007AFF'
      btn.style.background = '#1a2840'
      selectedAvatar = btn.dataset['avatar']!
    })
  })

  document.getElementById('login-next')?.addEventListener('click', () => {
    const name = (document.getElementById('login-name') as HTMLInputElement).value.trim()
    if (!name) {
      const input = document.getElementById('login-name') as HTMLInputElement
      input.style.borderColor = '#FF3B30'
      input.placeholder = 'Escribe tu nombre para continuar'
      return
    }
    const partial: Partial<UserProfile> = { name, avatar: selectedAvatar }
    el.remove()
    showOnboarding(partial, onDone)
  })
}