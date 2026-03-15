import type { UserProfile } from '@core/user'

const AUTH_KEY = 'circuitlab_user'

export function getSession(): UserProfile | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) ?? 'null')
  } catch { return null }
}

export function saveSession(user: UserProfile): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function addExperimentToHistory(experimentId: string): void {
  const user = getSession()
  if (!user) return
  if (!user.experimentsHistory.includes(experimentId)) {
    user.experimentsHistory.push(experimentId)
    saveSession(user)
  }
}

export function renderUserBadge(): void {
  const user = getSession()
  if (!user) return
  const avatar = document.getElementById('user-avatar')
  const name   = document.getElementById('user-name')
  if (avatar) avatar.textContent = user.avatar
  if (name)   name.textContent   = user.name

  // Click en badge → cerrar sesión
  document.getElementById('user-badge')?.addEventListener('click', () => {
    if (confirm(`¿Cerrar sesión de ${user.name}?`)) {
      clearSession()
      location.reload()
    }
  })
}