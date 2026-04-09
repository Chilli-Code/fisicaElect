export function showNotification(message: string, type: 'error' | 'warning' | 'success'): void {
  const colors = {
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759'
  }

  const existing = document.getElementById('m-notification')
  if (existing) existing.remove()

  const notification = document.createElement('div')
  notification.id = 'm-notification'
  notification.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type]};
    color: white;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    z-index: 3000;
    box-shadow: 0 6px 24px rgba(0,0,0,0.5);
    animation: fadeIn 0.2s ease, fadeOut 0.3s ease 2.7s forwards;
    pointer-events: none;
    max-width: 85%;
    text-align: center;
  `
  notification.textContent = message
  document.body.appendChild(notification)
  setTimeout(() => notification.remove(), 3000)
}