// ============================================================
// src/ui/notifications.ts
// ============================================================

import type { NotificationType } from '@core/types'

export function setupNotifications(): void {
  // El contenedor ya existe en el HTML
}

export function showNotification(type: NotificationType, title: string, message: string): void {
  const container = document.getElementById('notification-container')
  if (!container) return

  const notif = document.createElement('div')
  notif.className = `notification ${type}`
  const icons: Record<NotificationType, string> = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }
  notif.innerHTML = `
    <div class="notification-icon">${icons[type]}</div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>`
  container.appendChild(notif)
  setTimeout(() => notif.remove(), 3000)
}
