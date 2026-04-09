// ============================================================
// src/core/session-backup.ts
// Protección contra pérdida de datos — compartido PC y móvil
// ============================================================

import type { AppState, ComponentType } from '@core/types'

const BACKUP_KEY = 'circuitlab_backup'
const BACKUP_MAX_AGE = 10 * 60 * 1000 // 10 minutos

export interface SessionBackup {
  components: Array<{
    id: string
    type: ComponentType  // ← antes era string
    name: string
    value: number
    position: { x: number; z: number }
  }>
  wires: Array<{
    id: string; startComp: string; startTerm: string
    endComp: string; endTerm: string; baseColor: number
  }>
  idCounter: number
  savedAt: number
}

// ─── Guardar backup ───────────────────────────────────────────────────────────

export function saveBackup(state: AppState): void {
  if (state.components.length === 0) return
  try {
    const backup: SessionBackup = {
      components: state.components.map(c => ({
        id: c.id, type: c.type, name: c.name, value: c.value,
        position: { x: c.position.x, z: c.position.z },
      })),
      wires: state.wires.map(w => ({
        id: w.id, startComp: w.startComp, startTerm: w.startTerm,
        endComp: w.endComp, endTerm: w.endTerm, baseColor: w.baseColor,
      })),
      idCounter: state.idCounter,
      savedAt: Date.now(),
    }
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
  } catch { /* silencioso */ }
}

// ─── Leer backup ──────────────────────────────────────────────────────────────

export function loadBackup(): SessionBackup | null {
  try {
    const raw = sessionStorage.getItem(BACKUP_KEY)
    if (!raw) return null
    const backup = JSON.parse(raw) as SessionBackup
    const age = Date.now() - backup.savedAt
    if (age > BACKUP_MAX_AGE || !backup.components?.length) {
      clearBackup()
      return null
    }
    return backup
  } catch {
    clearBackup()
    return null
  }
}

// ─── Limpiar backup ───────────────────────────────────────────────────────────

export function clearBackup(): void {
  sessionStorage.removeItem(BACKUP_KEY)
}

// ─── Protección al salir ──────────────────────────────────────────────────────

export function setupExitProtection(state: AppState): void {
  // Advertencia al cerrar/recargar
  window.addEventListener('beforeunload', (e) => {
    if (state.components.length === 0) return
    saveBackup(state)
    e.preventDefault()
    e.returnValue = ''
  })

  // En móvil: visibilitychange es más confiable
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveBackup(state)
    }
  })
}

// ─── Toast de restauración (UI agnóstica) ─────────────────────────────────────

export function setupBackupRestore(
  backup: SessionBackup,
  onRestore: (backup: SessionBackup) => void,
  onDismiss?: () => void
): void {
  const toast = document.createElement('div')
  toast.id = 'm-backup-toast'
  toast.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:#2c2c2e;border:1px solid rgba(255,255,255,0.1);
    border-radius:14px;padding:14px 20px;z-index:4000;
    display:flex;align-items:center;gap:12px;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
    font-family:-apple-system,sans-serif;
    max-width:90vw;
  `
  toast.innerHTML = `
    <span style="font-size:22px">⚡</span>
    <div style="flex:1">
      <div style="font-size:13px;font-weight:600;color:#f5f5f7">Sesión recuperada</div>
      <div style="font-size:11px;color:#636366;margin-top:2px">
        ${backup.components.length} componentes · ${backup.wires.length} cables
      </div>
    </div>
    <button id="backup-restore-btn" style="
      padding:8px 14px;background:#007AFF;border:none;border-radius:10px;
      color:white;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap
    ">Restaurar</button>
    <button id="backup-dismiss-btn" style="
      padding:8px;background:transparent;border:none;
      color:#636366;font-size:18px;cursor:pointer;line-height:1
    ">✕</button>
  `
  document.body.appendChild(toast)

  const remove = () => {
    toast.style.opacity = '0'
    toast.style.transition = 'opacity 0.2s'
    setTimeout(() => toast.remove(), 200)
  }

  document.getElementById('backup-restore-btn')?.addEventListener('click', () => {
    onRestore(backup)
    clearBackup()
    remove()
  })

  document.getElementById('backup-dismiss-btn')?.addEventListener('click', () => {
    clearBackup()
    onDismiss?.()
    remove()
  })

  // Auto-cerrar en 10s
  setTimeout(remove, 10000)
}