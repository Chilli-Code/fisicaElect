// ============================================================
// src/ui/appTour.ts
// Tour guiado con Driver.js — explica toda la app.
// Driver.js se carga desde CDN (sin instalar paquete).
// ============================================================

// Driver.js se carga como UMD desde CDN en index.html.
// Aquí usamos la interfaz global window.driver.js
declare global {
  interface Window {
    driver: {
      js: {
        driver: (config: DriverConfig) => DriverInstance
      }
    }
  }
}

interface DriverStep {
  element?: string
  popover: {
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
  }
}

interface DriverConfig {
  showProgress?: boolean
  progressText?: string
  nextBtnText?: string
  prevBtnText?: string
  doneBtnText?: string
  animate?: boolean
  overlayOpacity?: number
  smoothScroll?: boolean
  allowClose?: boolean
  steps: DriverStep[]
  onDestroyed?: () => void
}

interface DriverInstance {
  drive: () => void
  destroy: () => void
}

// ── Pasos del tour ────────────────────────────────────────────
const STEPS: DriverStep[] = [
  {
    popover: {
      title: '⚡ Bienvenido a Circuit Lab Pro',
      description:
        'Este simulador 3D te permite construir y experimentar con circuitos eléctricos de forma segura. Te haré un tour rápido por todas las secciones.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '.menu-bar',
    popover: {
      title: '📋 Barra de menú',
      description:
        'Desde aquí cambias entre las tres vistas principales: <strong>Espacio de Trabajo</strong> (donde construyes), <strong>Biblioteca</strong> (donde guardas tus circuitos) y <strong>Análisis</strong>.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '.sidebar',
    popover: {
      title: '🔌 Panel de componentes',
      description:
        'Aquí están todos los componentes disponibles: baterías, resistencias, LEDs, capacitores y más. <strong>Arrastra</strong> cualquiera al área de trabajo para agregarlo al circuito.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '.toolbar',
    popover: {
      title: '🛠 Barra de herramientas',
      description:
        'Las herramientas principales del simulador. Selecciona, conecta o mueve componentes desde aquí.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '.tool-button[data-tool="select"]',
    popover: {
      title: '↖ Herramienta Seleccionar (V)',
      description:
        'Haz clic en un componente para seleccionarlo y ver sus propiedades en el inspector. También sirve para activar el interruptor.',
      side: 'bottom',
    },
  },
  {
    element: '.tool-button[data-tool="wire"]',
    popover: {
      title: '⚡ Herramienta Conectar (C)',
      description:
        'Activa esta herramienta y verás las esferas de conexión en cada componente. Haz clic en un terminal y luego en otro para crear un cable. <strong>Los colores del cable siguen el estándar IEC 60446.</strong>',
      side: 'bottom',
    },
  },
  {
    element: '.tool-button[data-tool="move"]',
    popover: {
      title: '✋ Herramienta Mover (M)',
      description:
        'Arrastra componentes para reposicionarlos. Los cables se actualizan automáticamente.',
      side: 'bottom',
    },
  },
  {
    element: '#simulate-btn',
    popover: {
      title: 'Simular',
      description:
        'Activa la simulación para ver flujo de corriente, animaciones en los LEDs y cálculo de métricas en tiempo real. Si hay errores (cortocircuitos, LEDs sin protección), aparecerán resaltados.',
      side: 'bottom',
    },
  },
  {
    element: '#clear-all',
    popover: {
      title: '🗑 Limpiar',
      description: 'Elimina todos los componentes y cables del área de trabajo.',
      side: 'bottom',
    },
  },
  {
    element: '#undo-btn',
    popover: {
      title: '↩ Deshacer / Rehacer',
      description:
        'Historial de hasta 50 acciones. También puedes usar <kbd>Ctrl+Z</kbd> y <kbd>Ctrl+Y</kbd> desde el teclado.',
      side: 'bottom',
    },
  },
  {
    element: '.canvas-area',
    popover: {
      title: '🎮 Área de trabajo 3D',
      description:
        'Aquí construyes el circuito. <strong>Rueda del mouse</strong> para zoom, <strong>clic + arrastrar</strong> para rotar la cámara. Los componentes se arrastran desde el panel izquierdo.',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '.bottom-toolbar',
    popover: {
      title: '📷 Controles de cámara',
      description:
        'Cambia entre vista 3D perspectiva, vista superior (cenital) y vista frontal. El botón de reset devuelve la cámara a su posición original.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '.stats-panel',
    popover: {
      title: '📊 Estado del circuito',
      description:
        'Muestra el número de componentes, conexiones y si el circuito está <strong>Abierto</strong> (sin corriente) o <strong>Cerrado</strong> (con corriente).',
      side: 'top',
    },
  },
  {
    element: '.inspector',
    popover: {
      title: '🔍 Inspector',
      description:
        'Panel derecho con las métricas eléctricas calculadas en tiempo real: voltaje total, corriente, resistencia equivalente y potencia.',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '.metric-grid',
    popover: {
      title: '⚡ Métricas eléctricas',
      description:
        'Calculadas con las leyes de Ohm y Kirchhoff. Se actualizan automáticamente al cambiar el circuito o activar la simulación.',
      side: 'left',
    },
  },
  {
    element: '.inspector-section:has(.law-card)',
    popover: {
      title: '📐 Leyes de la física',
      description:
        'Referencia rápida de las fórmulas más usadas: Ley de Ohm (V = I×R), Potencia eléctrica (P = V×I) y resistencias en serie.',
      side: 'left',
    },
  },
  {
    element: '.inspector-section:has(.experiment-btn)',
    popover: {
      title: '🧪 Experimentos predefinidos',
      description:
        'Carga circuitos de ejemplo con un clic. Los <strong>verdes</strong> son circuitos correctos para aprender; los <strong>rojos</strong> muestran errores comunes para entender qué NO hacer en la vida real.',
      side: 'left',
    },
  },
  {
    element: '#legend-btn',
    popover: {
      title: '🎨 Leyenda de colores',
      description:
        'Abre la tabla completa del estándar internacional de colores de cables (NEC / IEC 60446). También puedes pasar el mouse sobre cualquier cable para ver su tipo al instante.',
      side: 'bottom',
    },
  },
  {
    element: '.menu-item[data-view="library"]',
    popover: {
      title: '📚 Biblioteca de circuitos',
      description:
        'Guarda tus circuitos favoritos, importa/exporta en JSON y cargarlos en cualquier momento. Perfecta para guardar experimentos entre sesiones.',
      side: 'bottom',
    },
  },
  {
    popover: {
      title: '✅ ¡Listo para experimentar!',
      description:
        'Ya conoces toda la app. <strong>Tip inicial:</strong> empieza cargando el experimento "LED + Resistencia" del panel derecho — es el circuito básico de un bombillo. Puedes volver a ver este tour desde el botón <strong>?</strong> en la barra de menú.',
      side: 'bottom',
      align: 'center',
    },
  },
]

// ── Setup público ─────────────────────────────────────────────
export function setupTour(): void {
  injectTourButton()

  // Auto-tour en el primer uso
  const seen = localStorage.getItem('circuitlab_tour_seen')
  if (!seen) {
    setTimeout(() => startTour(), 800)
  }
}

export function startTour(): void {
  if (!window.driver?.js?.driver) {
    console.warn('Driver.js no cargado aún')
    return
  }

  const driverObj = window.driver.js.driver({
    showProgress: true,
    progressText: 'Paso {{current}} de {{total}}',
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '¡Entendido! ✓',
    animate: true,
    overlayOpacity: 0.6,
    smoothScroll: true,
    allowClose: true,
    steps: STEPS,
    onDestroyed: () => {
      localStorage.setItem('circuitlab_tour_seen', '1')
    },
  })

  driverObj.drive()
}

function injectTourButton(): void {
  const menuRight = document.querySelector('.menu-right')
  if (!menuRight) return

  const btn = document.createElement('button')
  btn.id = 'tour-btn'
  btn.className = 'icon-btn'
  btn.title = 'Tour de la app'
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.3"/>
      <path d="M8 7V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="8" cy="5" r="0.8" fill="currentColor"/>
    </svg>
  `
  btn.addEventListener('click', startTour)
  menuRight.prepend(btn)
}
