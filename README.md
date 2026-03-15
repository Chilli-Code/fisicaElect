# ⚡ Circuit Lab Pro

Simulador 3D interactivo de física eléctrica. Construye, conecta y experimenta con circuitos en tiempo real.

---

## Inicio rápido
```bash
npm install
npm run dev       # Abre en http://localhost:5173
npm run build     # Compila a /dist
npm run typecheck # Solo verificar tipos sin compilar
```

---

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| TypeScript + Vite | Build tool y tipado estricto (ES2022) |
| Three.js | Renderizado 3D |
| Driver.js | Tour guiado de la app |
| animatedicons.co | Iconos animados en menú y botones |
| localStorage | Sesión de usuario y biblioteca |

---

## Estructura del proyecto
```
fisicaElect/
├── index.html              # Entry point para Vite
├── styles.css              # Estilos globales
├── vite.config.ts          # Alias @core, @scene, @ui, etc.
├── tsconfig.json           # TypeScript estricto ES2022
├── package.json
└── src/
    ├── main.ts             # Punto de entrada — conecta todos los módulos
    │
    ├── core/               # Lógica pura — sin Three.js, sin DOM
    │   ├── types.ts        # Todos los tipos del proyecto
    │   ├── state.ts        # Estado global (AppState)
    │   ├── circuit.ts      # Cálculos eléctricos (Ohm, métricas, voltímetro)
    │   ├── history.ts      # Undo / Redo hasta 50 acciones
    │   ├── events.ts       # Bus de eventos desacoplado
    │   └── user.ts         # Tipos del perfil de usuario
    │
    ├── scene/              # Three.js — gestión de objetos 3D
    │   ├── SceneManager.ts      # Escena, cámara, renderer, loop
    │   ├── ComponentManager.ts  # CRUD de componentes en escena
    │   └── WireManager.ts       # Cables con colores IEC 60446
    │
    ├── components/         # Factories de meshes 3D por tipo
    │   ├── _factory.ts     # Helpers compartidos
    │   ├── templates.ts    # Registro de plantillas
    │   └── *.ts            # Un archivo por componente
    │
    ├── ui/                 # Interacción con el DOM
    │   ├── toolbar.ts              # Herramientas y simulación
    │   ├── inspector.ts            # Métricas y propiedades
    │   ├── notifications.ts        # Sistema de notificaciones
    │   ├── terminalIndicators.ts   # Esferas de conexión
    │   ├── dragdrop.ts             # Drag & Drop desde sidebar
    │   ├── keyboard.ts             # Atajos de teclado
    │   ├── experiments.ts          # Experimentos predefinidos
    │   ├── library.ts              # Guardar/cargar circuitos
    │   ├── viewButtons.ts          # Vistas de cámara
    │   ├── wireTooltip.ts          # Tooltip hover sobre cables
    │   ├── wireLegendModal.ts      # Modal leyenda de colores
    │   ├── appTour.ts              # Tour guiado con Driver.js
    │   ├── auth.ts                 # Sesión en localStorage
    │   ├── loginScreen.ts          # Pantalla de login
    │   ├── onboarding.ts           # Flujo de rol e institución
    │   └── settingsModal.ts        # Modal de configuración
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

### UX
- Tour guiado de 20 pasos con Driver.js — automático en el primer uso
- Tooltip al hacer hover sobre cables con tipo y estándar IEC
- Modal de leyenda completa de colores de cables y terminales
- Iconos animados con animatedicons.co
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
| `script.js` — 1000 líneas | 38 archivos con responsabilidades separadas |
| Three.js vía CDN | Three.js como dependencia npm tipada |
| `window.updateComponentValue` etc. | Bus de eventos (`AppEvents`) |
| JS plano sin tipos | TypeScript estricto |
| Sin build tool | Vite con HMR instantáneo |
| Sin autenticación | Login + onboarding + configuración |
| Biblioteca sin búsqueda ni thumbnail | Búsqueda, thumbnail real y sobreescribir |
| Sin análisis | Vista de análisis con reporte de IA |

---

## Para agregar un nuevo componente

1. Crear `src/components/miComponente.ts` con `createMiComponente3D()`
2. Registrarlo en `src/components/templates.ts`
3. Agregar el tipo en `src/core/types.ts` → `ComponentType`
4. Agregar la tarjeta en `index.html`

---

## Ruta hacia Android

La separación de `src/core/` sin Three.js ni DOM es la base para la migración futura:

- `src/core/` → se reutiliza **sin cambios**
- `src/scene/SceneManager.ts` → se reemplaza por `BabylonSceneManager.ts`
- `src/ui/` → se adapta si hay cambios de DOM
- `src/components/` → se migra a assets Babylon (`.babylon`, `.glb`)
- Empaquetado con **Mystral Native.js** — WebGPU nativo sobre Vulkan en Android, sin overhead de Chromium