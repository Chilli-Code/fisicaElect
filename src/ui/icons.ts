import lottie from 'lottie-web'

export function setupIcons(): void {
  lottie.loadAnimation({
    container: document.getElementById('icon-simulate')!,
    path: '/icons/play.json',
    renderer: 'svg',
    loop: false,
    autoplay: false,
  })
}