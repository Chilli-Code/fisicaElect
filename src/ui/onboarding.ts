import { saveSession } from './auth'
import type { UserProfile, UserRole } from '@core/user'

const ROLES: { id: UserRole; emoji: string; title: string; desc: string }[] = [
  { id: 'student',  emoji: '🧑‍🔬', title: 'Estudiante', desc: 'Aprendo física eléctrica en clase' },
  { id: 'teacher',  emoji: '🧑‍🏫', title: 'Profesor',   desc: 'Enseño y creo experimentos para mis alumnos' },
  { id: 'hobby',    emoji: '⚡',    title: 'Hobby',      desc: 'Experimento por curiosidad o proyectos propios' },
]

export function showOnboarding(
  partial: Partial<UserProfile>,
  onDone: (user: UserProfile) => void,
): void {
  const el = document.createElement('div')
  el.id = 'onboarding-screen'
  el.style.cssText = `
    position:fixed;inset:0;z-index:9000;
    background:#0a0a0b;
    display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,'SF Pro Display',sans-serif;
  `

  el.innerHTML = `
    <div style="width:420px">
      <!-- Progreso -->
      <div style="display:flex;gap:6px;margin-bottom:32px;justify-content:center">
        <div style="height:3px;width:60px;border-radius:2px;background:#007AFF"></div>
        <div id="step2-dot" style="height:3px;width:60px;border-radius:2px;background:#3a3a3c"></div>
      </div>

      <!-- Paso 1: Rol -->
      <div id="step-role">
        <h2 style="font-size:22px;font-weight:700;color:#f5f5f7;margin:0 0 6px;text-align:center">¿Cómo usarás la app?</h2>
        <p style="font-size:14px;color:#636366;text-align:center;margin:0 0 24px">Esto personaliza tu experiencia</p>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
          ${ROLES.map(r => `
            <button class="role-btn" data-role="${r.id}" style="
              display:flex;align-items:center;gap:14px;padding:16px;
              background:#1c1c1e;border:2px solid #3a3a3c;border-radius:12px;
              color:white;cursor:pointer;text-align:left;transition:all .15s;width:100%
            ">
              <span style="font-size:28px">${r.emoji}</span>
              <div>
                <div style="font-size:15px;font-weight:600">${r.title}</div>
                <div style="font-size:12px;color:#636366;margin-top:2px">${r.desc}</div>
              </div>
            </button>
          `).join('')}
        </div>
        <button id="role-next" disabled style="
          width:100%;padding:12px;background:#3a3a3c;border:none;
          border-radius:10px;color:#636366;font-size:15px;font-weight:600;cursor:not-allowed
        ">Continuar →</button>
      </div>

      <!-- Paso 2: Institución -->
      <div id="step-institution" style="display:none">
        <h2 style="font-size:22px;font-weight:700;color:#f5f5f7;margin:0 0 6px;text-align:center">¿Dónde estudias o trabajas?</h2>
        <p style="font-size:14px;color:#636366;text-align:center;margin:0 0 24px">Opcional — puedes dejarlo en blanco</p>
        <div style="background:#1c1c1e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px">
          <input id="institution-input" type="text" placeholder="Ej: Universidad Nacional, Colegio San José..."
            style="width:100%;padding:10px 12px;background:#2c2c2e;border:1px solid #3a3a3c;
            border-radius:8px;color:white;font-size:14px;box-sizing:border-box;outline:none;margin-bottom:16px"
          >
          <button id="finish-onboarding" style="
            width:100%;padding:12px;background:#34C759;border:none;
            border-radius:10px;color:white;font-size:15px;font-weight:600;cursor:pointer
          ">¡Empezar a experimentar! ⚡</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(el)

  let selectedRole: UserRole | null = null

  // Selección de rol
  el.querySelectorAll<HTMLButtonElement>('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll<HTMLButtonElement>('.role-btn').forEach(b => {
        b.style.borderColor = '#3a3a3c'
        b.style.background = '#1c1c1e'
      })
      btn.style.borderColor = '#007AFF'
      btn.style.background = '#1a2840'
      selectedRole = btn.dataset['role'] as UserRole

      const next = document.getElementById('role-next') as HTMLButtonElement
      next.disabled = false
      next.style.background = '#007AFF'
      next.style.color = 'white'
      next.style.cursor = 'pointer'
    })
  })

  // Paso 1 → Paso 2
  document.getElementById('role-next')?.addEventListener('click', () => {
    if (!selectedRole) return
    document.getElementById('step-role')!.style.display = 'none'
    document.getElementById('step-institution')!.style.display = 'block'
    document.getElementById('step2-dot')!.style.background = '#007AFF'
  })

  // Finalizar onboarding
  document.getElementById('finish-onboarding')?.addEventListener('click', () => {
    const institution = (document.getElementById('institution-input') as HTMLInputElement).value.trim()
    const user: UserProfile = {
      id: `user-${Date.now()}`,
      name: partial.name!,
      avatar: partial.avatar!,
      role: selectedRole!,
      institution,
      createdAt: Date.now(),
      experimentsHistory: [],
    }
    saveSession(user)
    el.remove()
    onDone(user)
  })
}