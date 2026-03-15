// ============================================================
// src/ui/settingsModal.ts
// ============================================================

import { getSession, saveSession, clearSession } from './auth'

const AVATARS = ['🧑‍🔬', '👩‍🔬', '🧑‍💻', '👩‍💻', '🧑‍🏫', '👩‍🏫', '⚡', '🔋', '💡', '🔌']
const ROLES   = [
  { id: 'student', label: 'Estudiante', emoji: '🧑‍🔬' },
  { id: 'teacher', label: 'Profesor',   emoji: '🧑‍🏫' },
  { id: 'hobby',   label: 'Hobby',      emoji: '⚡'    },
]

export function setupSettingsModal(): void {
  document.getElementById('settings-btn')?.addEventListener('click', openSettingsModal)
}

function openSettingsModal(): void {
  if (document.getElementById('settings-modal')) return
  const user = getSession()
  if (!user) return

  const modal = document.createElement('div')
  modal.id = 'settings-modal'
  modal.style.cssText = `
    position:fixed;inset:0;z-index:3000;
    background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,'SF Pro Display',sans-serif;
  `

  modal.innerHTML = `
    <div style="
      background:#1c1c1e;border:1px solid rgba(255,255,255,0.1);
      border-radius:20px;width:500px;max-width:95vw;max-height:90vh;
      display:flex;flex-direction:column;overflow:hidden;
    ">

      <!-- Header -->
      <div style="
        display:flex;align-items:center;justify-content:space-between;
        padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0
      ">
        <h2 style="font-size:17px;font-weight:700;color:#f5f5f7;margin:0">⚙️ Configuración</h2>
        <button id="close-settings" style="
          width:30px;height:30px;border:none;background:rgba(255,255,255,0.08);
          color:#aeaeb2;border-radius:8px;cursor:pointer;font-size:16px
        ">✕</button>
      </div>

      <!-- Tabs -->
      <div style="
        display:flex;gap:2px;padding:8px 24px;
        border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;
        background:#1c1c1e;
      ">
        ${[
          { id: 'tab-profile',  label: '👤 Perfil'       },
          { id: 'tab-general',  label: '⚙️ General'      },
          { id: 'tab-sim',      label: '🔬 Simulación'   },
        ].map((t, i) => `
          <button class="settings-tab" data-tab="${t.id}" style="
            padding:7px 14px;border:none;border-radius:8px;cursor:pointer;
            font-size:12px;font-weight:500;transition:all .15s;
            background:${i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent'};
            color:${i === 0 ? '#f5f5f7' : '#636366'};
          ">${t.label}</button>
        `).join('')}
      </div>

      <!-- Contenido scrollable -->
      <div style="overflow-y:auto;flex:1">

        <!-- ── TAB: PERFIL ─────────────────────────────── -->
        <div id="tab-profile" class="settings-panel" style="padding:24px">

          <div style="text-align:center;margin-bottom:24px">
            <div id="settings-avatar-preview" style="
              width:72px;height:72px;border-radius:20px;background:#2c2c2e;
              font-size:36px;display:flex;align-items:center;justify-content:center;
              margin:0 auto 8px;border:2px solid rgba(255,255,255,0.08)
            ">${user.avatar}</div>
            <div style="font-size:12px;color:#636366">Avatar</div>
          </div>

          <div style="margin-bottom:16px">
            <label style="font-size:12px;color:#aeaeb2;display:block;margin-bottom:6px">Nombre</label>
            <input id="settings-name" type="text" value="${user.name}" style="
              width:100%;padding:10px 12px;background:#2c2c2e;border:1px solid #3a3a3c;
              border-radius:8px;color:white;font-size:14px;box-sizing:border-box;outline:none
            ">
          </div>

          <div style="margin-bottom:16px">
            <label style="font-size:12px;color:#aeaeb2;display:block;margin-bottom:6px">Institución</label>
            <input id="settings-institution" type="text" value="${user.institution}" placeholder="Universidad, colegio..." style="
              width:100%;padding:10px 12px;background:#2c2c2e;border:1px solid #3a3a3c;
              border-radius:8px;color:white;font-size:14px;box-sizing:border-box;outline:none
            ">
          </div>

          <div style="margin-bottom:16px">
            <label style="font-size:12px;color:#aeaeb2;display:block;margin-bottom:8px">Avatar</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${AVATARS.map(a => `
                <button class="settings-avatar-btn" data-avatar="${a}" style="
                  width:44px;height:44px;border-radius:10px;font-size:22px;cursor:pointer;
                  transition:all .15s;
                  border:2px solid ${a === user.avatar ? '#007AFF' : 'transparent'};
                  background:${a === user.avatar ? '#1a2840' : '#2c2c2e'}
                ">${a}</button>
              `).join('')}
            </div>
          </div>

          <div style="margin-bottom:24px">
            <label style="font-size:12px;color:#aeaeb2;display:block;margin-bottom:8px">Rol</label>
            <div style="display:flex;gap:8px">
              ${ROLES.map(r => `
                <button class="settings-role-btn" data-role="${r.id}" style="
                  flex:1;padding:10px 8px;border-radius:10px;cursor:pointer;
                  font-size:12px;font-weight:600;transition:all .15s;
                  border:2px solid ${r.id === user.role ? '#007AFF' : '#3a3a3c'};
                  background:${r.id === user.role ? '#1a2840' : '#2c2c2e'};
                  color:${r.id === user.role ? '#f5f5f7' : '#aeaeb2'}
                ">
                  <div style="font-size:20px;margin-bottom:4px">${r.emoji}</div>
                  ${r.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div style="
            background:#2c2c2e;border-radius:10px;padding:12px 16px;
            margin-bottom:24px;display:flex;justify-content:space-between;align-items:center
          ">
            <div>
              <div style="font-size:13px;font-weight:600;color:#f5f5f7">Experimentos realizados</div>
              <div style="font-size:12px;color:#636366;margin-top:2px">${user.experimentsHistory.length} en total</div>
            </div>
            <div style="font-size:28px;font-weight:700;color:#007AFF">${user.experimentsHistory.length}</div>
          </div>

          <button id="settings-save" style="
            width:100%;padding:12px;background:#007AFF;border:none;
            border-radius:10px;color:white;font-size:15px;font-weight:600;
            cursor:pointer;margin-bottom:10px
          ">Guardar cambios</button>

          <button id="settings-logout" style="
            width:100%;padding:12px;background:rgba(255,59,48,0.1);
            border:1px solid rgba(255,59,48,0.25);border-radius:10px;
            color:#FF3B30;font-size:14px;font-weight:500;cursor:pointer
          ">Cerrar sesión</button>
        </div>

        <!-- ── TAB: GENERAL ────────────────────────────── -->
        <div id="tab-general" class="settings-panel" style="padding:24px;display:none">

          ${settingRow('Idioma', 'Español / English', `
            <div style="display:flex;gap:6px">
              <button class="lang-btn active-opt" data-val="es" style="padding:6px 14px;border-radius:8px;border:2px solid #007AFF;background:#1a2840;color:#f5f5f7;cursor:pointer;font-size:12px">ES</button>
              <button class="lang-btn" data-val="en" style="padding:6px 14px;border-radius:8px;border:2px solid #3a3a3c;background:#2c2c2e;color:#636366;cursor:pointer;font-size:12px">EN</button>
            </div>
          `)}

          ${settingRow('Tema', 'Apariencia de la interfaz', `
            <div style="display:flex;gap:6px">
              <button class="theme-btn" data-val="dark" style="padding:6px 14px;border-radius:8px;border:2px solid #007AFF;background:#1a2840;color:#f5f5f7;cursor:pointer;font-size:12px">🌙 Oscuro</button>
              <button class="theme-btn" data-val="light" style="padding:6px 14px;border-radius:8px;border:2px solid #3a3a3c;background:#2c2c2e;color:#636366;cursor:pointer;font-size:12px">☀️ Claro</button>
            </div>
          `)}

          ${settingRow('Unidades', 'Sistema de medición', `
            <div style="display:flex;gap:6px">
              <button class="units-btn" data-val="si" style="padding:6px 14px;border-radius:8px;border:2px solid #007AFF;background:#1a2840;color:#f5f5f7;cursor:pointer;font-size:12px">SI Métrico</button>
              <button class="units-btn" data-val="imperial" style="padding:6px 14px;border-radius:8px;border:2px solid #3a3a3c;background:#2c2c2e;color:#636366;cursor:pointer;font-size:12px">Imperial</button>
            </div>
          `)}

          ${settingRow('Animaciones', 'Velocidad de efectos visuales', `
            <input type="range" min="0" max="2" step="1" value="1" style="width:120px;accent-color:#007AFF">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#636366;margin-top:4px;width:120px">
              <span>Lento</span><span>Normal</span><span>Rápido</span>
            </div>
          `)}

          <div style="margin-top:8px;padding:12px;background:rgba(0,122,255,0.08);border:1px solid rgba(0,122,255,0.2);border-radius:10px;font-size:12px;color:#636366">
            💡 Estas opciones estarán activas en la próxima versión
          </div>
        </div>

        <!-- ── TAB: SIMULACIÓN ─────────────────────────── -->
        <div id="tab-sim" class="settings-panel" style="padding:24px;display:none">

          ${settingRow('Precisión de cálculos', 'Afecta la exactitud de métricas', `
            <div style="display:flex;gap:6px">
              <button style="padding:6px 14px;border-radius:8px;border:2px solid #007AFF;background:#1a2840;color:#f5f5f7;cursor:pointer;font-size:12px">Básico</button>
              <button style="padding:6px 14px;border-radius:8px;border:2px solid #3a3a3c;background:#2c2c2e;color:#636366;cursor:pointer;font-size:12px">Avanzado</button>
            </div>
          `)}

          ${settingRow('Terminales', 'Mostrar puntos de conexión siempre', `
            ${toggle('terminals-toggle', false)}
          `)}

          ${settingRow('Grid snap', 'Los componentes se alinean al grid', `
            ${toggle('grid-snap-toggle', true)}
          `)}

          ${settingRow('Límite de componentes', 'Máximo por circuito', `
            <input type="number" value="50" min="5" max="200" style="
              width:70px;padding:6px 10px;background:#2c2c2e;border:1px solid #3a3a3c;
              border-radius:8px;color:white;font-size:13px;text-align:center;outline:none
            ">
          `)}

          <div style="margin-top:8px;padding:12px;background:rgba(0,122,255,0.08);border:1px solid rgba(0,122,255,0.2);border-radius:10px;font-size:12px;color:#636366">
            💡 Estas opciones estarán activas en la próxima versión
          </div>
        </div>

      </div>
    </div>
  `

  document.body.appendChild(modal)

  // ── Tabs ──
  let selectedAvatar = user.avatar
  let selectedRole   = user.role

  modal.querySelectorAll<HTMLButtonElement>('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll<HTMLButtonElement>('.settings-tab').forEach(t => {
        t.style.background = 'transparent'
        t.style.color      = '#636366'
      })
      tab.style.background = 'rgba(255,255,255,0.1)'
      tab.style.color      = '#f5f5f7'
      modal.querySelectorAll<HTMLElement>('.settings-panel').forEach(p => p.style.display = 'none')
      const panel = document.getElementById(tab.dataset['tab']!)
      if (panel) panel.style.display = 'block'
    })
  })

  // ── Avatar ──
  modal.querySelectorAll<HTMLButtonElement>('.settings-avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll<HTMLButtonElement>('.settings-avatar-btn').forEach(b => {
        b.style.borderColor = 'transparent'; b.style.background = '#2c2c2e'
      })
      btn.style.borderColor = '#007AFF'; btn.style.background = '#1a2840'
      selectedAvatar = btn.dataset['avatar']!
      const p = document.getElementById('settings-avatar-preview')
      if (p) p.textContent = selectedAvatar
    })
  })

  // ── Rol ──
  modal.querySelectorAll<HTMLButtonElement>('.settings-role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll<HTMLButtonElement>('.settings-role-btn').forEach(b => {
        b.style.borderColor = '#3a3a3c'; b.style.background = '#2c2c2e'; b.style.color = '#aeaeb2'
      })
      btn.style.borderColor = '#007AFF'; btn.style.background = '#1a2840'; btn.style.color = '#f5f5f7'
      selectedRole = btn.dataset['role'] as any
    })
  })

  // ── Guardar ──
  document.getElementById('settings-save')?.addEventListener('click', () => {
    const name        = (document.getElementById('settings-name') as HTMLInputElement).value.trim()
    const institution = (document.getElementById('settings-institution') as HTMLInputElement).value.trim()
    if (!name) return
    saveSession({ ...user, name, institution, avatar: selectedAvatar, role: selectedRole })
    const avatarEl = document.getElementById('user-avatar')
    const nameEl   = document.getElementById('user-name')
    if (avatarEl) avatarEl.textContent = selectedAvatar
    if (nameEl)   nameEl.textContent   = name
    closeSettingsModal()
  })

  // ── Logout ──
  document.getElementById('settings-logout')?.addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) { clearSession(); location.reload() }
  })

  // ── Cerrar ──
  document.getElementById('close-settings')?.addEventListener('click', closeSettingsModal)
  modal.addEventListener('click', e => { if (e.target === modal) closeSettingsModal() })
}

function closeSettingsModal(): void {
  document.getElementById('settings-modal')?.remove()
}

// ── Helpers de UI ──────────────────────────────────────────
function settingRow(title: string, desc: string, control: string): string {
  return `
    <div style="
      display:flex;align-items:center;justify-content:space-between;
      padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05)
    ">
      <div>
        <div style="font-size:13px;font-weight:500;color:#f5f5f7">${title}</div>
        <div style="font-size:11px;color:#636366;margin-top:2px">${desc}</div>
      </div>
      <div style="flex-shrink:0;margin-left:16px">${control}</div>
    </div>
  `
}

function toggle(id: string, defaultOn: boolean): string {
  return `
    <div id="${id}" data-on="${defaultOn}" style="
      width:44px;height:26px;border-radius:13px;cursor:pointer;
      background:${defaultOn ? '#34C759' : '#3a3a3c'};
      position:relative;transition:background .2s
    ">
      <div style="
        position:absolute;top:3px;
        left:${defaultOn ? '21px' : '3px'};
        width:20px;height:20px;border-radius:50%;
        background:white;transition:left .2s;
        box-shadow:0 1px 3px rgba(0,0,0,0.3)
      "></div>
    </div>
  `
}