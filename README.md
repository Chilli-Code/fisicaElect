# ⚡ Circuit Lab Pro

Simulador 3D interactivo de física eléctrica. Construye, conecta y experimenta con circuitos en tiempo real.

---

## Inicio rápido

```bash
npm install
npm run dev       # Abre en http://localhost:5173
npm run build     # Compila a /dist
npm run typecheck # Solo verificar tipos sin compilar
npm run preview   # Previsualizar build
```

### Deployment
El proyecto se despliega automáticamente a **GitHub Pages** en cada push a `main` mediante GitHub Actions.

---

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| TypeScript + Vite | Build tool y tipado estricto (ES2022) |
| Three.js | Renderizado 3D (escritorio) |
| Babylon.js | Renderizado 3D (móvil/futuro) |
| Lottie | Animaciones de iconos |
| Driver.js | Tour guiado de la app |
| animatedicons.co | Iconos animados en menú y botones |
| localStorage | Sesión de usuario y biblioteca |

---

## Estructura del proyecto

```
fisicaElect/
├── index.html              # Entry point para Vite
├── public/
│   └── styles.css         # Estilos globales
├── vite.config.ts         # Alias @core, @scene, @ui, etc.
├── tsconfig.json          # TypeScript estricto ES2022
├── package.json
└── src/
    ├── main.ts            # Punto de entrada — conecta todos los módulos
    │
    ├── core/              # Lógica pura — sin Three.js, sin DOM
    │   ├── types.ts       # Todos los tipos del proyecto
    │   ├── state.ts       # Estado global (AppState)
    │   ├── circuit.ts     # Cálculos eléctricos (Ohm, métricas, voltímetro)
    │   ├── history.ts     # Undo / Redo hasta 50 acciones
    │   ├── events.ts      # Bus de eventos desacoplado
    │   └── user.ts        # Tipos del perfil de usuario
    │
    ├── scene/             # Three.js — gestión de objetos 3D
    │   ├── SceneManager.ts      # Escena, cámara, renderer, loop
    │   ├── ComponentManager.ts  # CRUD de componentes en escena
    │   └── WireManager.ts       # Cables con colores IEC 60446
    │
    ├── components/        # Factories de meshes 3D por tipo
    │   ├── _factory.ts    # Helpers compartidos
    │   ├── templates.ts   # Registro de plantillas
    │   ├── *.ts           # Un archivo por componente (Three.js)
    │   └── babylon/       # Implementación alternativa para Babylon.js
    │       ├── templates.babylon.ts
    │       ├── _factory.babylon.ts
    │       └── *.babylon.ts
    │
    ├── ui/               # Interacción con el DOM
    │   ├── toolbar.ts              # Herramientas y simulación
    │   ├── inspector.ts             # Métricas y propiedades
    │   ├── notifications.ts        # Sistema de notificaciones
    │   ├── terminalIndicators.ts   # Esferas de conexión
    │   ├── dragdrop.ts             # Drag & Drop desde sidebar
    │   ├── keyboard.ts            # Atajos de teclado
    │   ├── experiments.ts         # Experimentos predefinidos
    │   ├── library.ts             # Guardar/cargar circuitos
    │   ├── viewButtons.ts         # Vistas de cámara
    │   ├── wireTooltip.ts         # Tooltip hover sobre cables
    │   ├── wireLegendModal.ts     # Modal leyenda de colores
    │   ├── appTour.ts             # Tour guiado con Driver.js
    │   ├── auth.ts                # Sesión en localStorage
    │   ├── loginScreen.ts         # Pantalla de login
    │   ├── onboarding.ts          # Flujo de rol e institución
    │   ├── settingsModal.ts       # Modal de configuración
    │   ├── icons.ts               # Animaciones Lottie
    │   └── mobile/                # Optimizaciones para móvil
    │       ├── MobileLayout.ts
    │       ├── MobileControls.ts
    │       ├── BottomNav.ts
    │       ├── BottomSheet.ts
    │       ├── ComponentGrid.ts
    │       ├── ComponentPopup.ts
    │       └── FloatingToolbar.ts
    │
    └── utils/
        ├── animations.ts    # sparkEffect, pulse, wire flow
        └── validation.ts    # Reglas de validación del circuito
```

---

## Funcionalidades

### Simulador 3D
- Arrastrar componentes desde el panel al área de trabajo
- Conectar terminales con cables — colores estándar IEC 60446
- Mover componentes con herramienta o teclado (`WASD` / flechas)
- Undo / Redo con `Ctrl+Z` / `Ctrl+Y` — historial de 50 acciones
- Simulación con animación de flujo de corriente en cables
- Detección de errores: cortocircuitos, LEDs sin protección

### Componentes disponibles
Batería · Fuente AC · Resistencia · Capacitor · Inductor · Voltímetro · Amperímetro · LED · Interruptor · Diodo · Transistor

### Colores de cables — NEC / IEC 60446
| Color | Tipo |
|---|---|
| 🔴 Rojo | Positivo DC |
| ⚫ Negro | Negativo / Tierra DC |
| 🟠 Naranja | Salida a carga |
| 🔵 Azul oscuro | Retorno de carga |
| 🔵 Azul claro | Neutro AC |
| 🟤 Marrón | Fase AC |
| ⚪ Gris | Cable genérico |

### Medición
- Voltímetro muestra caída de voltaje real en el componente conectado en paralelo
- Amperímetro muestra corriente del circuito en tiempo real

### Biblioteca
- Guardar circuitos con thumbnail real capturado del canvas
- Búsqueda por nombre en tiempo real
- Sobreescribir un circuito ya guardado
- Exportar e importar en formato JSON

### Análisis con IA
- Reporte visual automático al activar la simulación
- Descripción del circuito en lenguaje simple
- Métricas destacadas: voltaje, corriente, resistencia y potencia
- Tres tarjetas: qué hiciste bien · qué mejorar · dato curioso
- Gráfica de voltaje y corriente en tiempo real
- Comparación lado a lado de dos circuitos

### Usuario y configuración
- Pantalla de login con nombre y avatar
- Onboarding de 2 pasos: rol (estudiante / profesor / hobby) e institución
- Sesión persistida en localStorage
- Modal de configuración con 3 tabs: Perfil · General · Simulación
- Historial de experimentos realizados por usuario

### Soporte móvil
- Layout adaptativo para dispositivos móviles
- Bottom navigation con controles de simulación
- Floating toolbar con herramientas
- Bottom sheet para componentes
- Grid de componentes optimizado para touch
- Popup de selección de componentes

### UX
- Tour guiado de 20 pasos con Driver.js — automático en el primer uso
- Tooltip al hacer hover sobre cables con tipo y estándar IEC
- Modal de leyenda completa de colores de cables y terminales
- Iconos animados con animatedicons.co y Lottie
- Inspector colapsable

---

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `V` | Herramienta seleccionar |
| `C` | Herramienta conectar |
| `M` | Herramienta mover |
| `Ctrl+Z` | Deshacer |
| `Ctrl+Y` | Rehacer |
| `Delete` | Eliminar componente seleccionado |
| `↑ ↓ ← →` | Mover componente seleccionado |

---

## Qué cambió vs el proyecto original

| Antes | Ahora |
|---|---|
| `script.js` — 1000 líneas | 38+ archivos con responsabilidades separadas |
| Three.js vía CDN | Three.js como dependencia npm tipada |
| `window.updateComponentValue` etc. | Bus de eventos (`AppEvents`) |
| JS plano sin tipos | TypeScript estricto |
| Sin build tool | Vite con HMR instantáneo |
| Sin autenticación | Login + onboarding + configuración |
| Biblioteca sin búsqueda ni thumbnail | Búsqueda, thumbnail real y sobreescribir |
| Sin análisis | Vista de análisis con reporte de IA |
| Solo escritorio | Soporte móvil con layout adaptativo |
| Solo Three.js | Preparado para migración a Babylon.js |

---

## Dual rendering: Three.js vs Babylon.js

El proyecto está preparado para usar dos motores 3D:

- **Three.js** (`src/components/*.ts`) — versión actual para escritorio
- **Babylon.js** (`src/components/babylon/*.babylon.ts`) — preparado para móvil y futuro

### Para agregar un nuevo componente

1. Crear `src/components/miComponente.ts` con `createMiComponente3D()`
2. Crear `src/components/babylon/miComponente.babylon.ts` si se quiere soporte Babylon
3. Registrarlo en `src/components/templates.ts` (y `templates.babylon.ts`)
4. Agregar el tipo en `src/core/types.ts` → `ComponentType`
5. Agregar la tarjeta en `index.html`

---

## Arquitectura

La separación estricta de `src/core/` (lógica pura) permite:
- Testear cálculos eléctricos sin DOM ni WebGL
- Migrar a diferentes motores 3D (Three.js → Babylon.js)
- Reutilizar lógica en versión móvil/nativa

```
┌─────────────────────────────────────────────────────┐
│                    src/main.ts                      │
│           Punto de entrada — conecta módulos        │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌─────────┐
   │  core/  │  │  scene/  │  │   ui/   │
   │ (lógica │  │ (Three.js│  │  (DOM)  │
   │  pura)  │  │  /WebGL) │  │         │
   └─────────┘  └──────────┘  └─────────┘
        │             │             │
        └─────────────┼─────────────┘
                      ▼
               ┌──────────────┐
               │ AppEvents    │
               │ (bus eventos)│
               └──────────────┘
```
