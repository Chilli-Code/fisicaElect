// ============================================================
// src/ui/mobile/MobileControls.ts
// ============================================================

// ✅ IMPORTS AL PRINCIPIO (SIEMPRE)
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { Scene } from '@babylonjs/core/scene'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import type { AppState } from '@core/types'
import { emit, AppEvents } from '@core/events'
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import '@babylonjs/core/Culling/ray'
import type { BabylonWireManager } from '@scene/BabylonWireManager'
import { mobileCurrentTool } from '@ui/mobile/MobileTools'
import { showNotification } from '@ui/mobile/MobileNotifications'
import { saveBabylonSnapshot } from '@core/babylon-history'
import { 
  resolveWireColor, 
} from '@scene/BabylonWireManager'
import { sparkEffect, errorEffect, pulseComponent, shakeComponent } from '@utils/babylon-animations'
import { playSound } from './screens/MobileSettings'


// ✅ Callback opcional para notificar cambios de visibilidad
type EditButtonUpdateCallback = (visible: boolean) => void
function getMeshPosition(mesh: any): Vector3 {
  if (mesh?.getAbsolutePosition && typeof mesh.getAbsolutePosition === 'function') {
    return mesh.getAbsolutePosition()
  }
  if (mesh?.absolutePosition) {
    return mesh.absolutePosition.clone?.() || mesh.absolutePosition
  }
  return mesh?.position?.clone?.() || new Vector3(0, 0, 0)
}
export function setupMobileControls(
  scene: Scene, 
  state: AppState, 
  camera: ArcRotateCamera,
  wireManager: BabylonWireManager,
  cm: any,
  onEditButtonUpdate?: EditButtonUpdateCallback  // ✅ Nuevo parámetro opcional
): void {
  let selectedMesh: AbstractMesh | null = null
  let isDragging = false
  let dragStartPointer = { x: 0, y: 0 }
  let wireStartComp: any = null
  let wireStartTerm: any = null

  const dragPlaneY = 1

  // ✅ Función helper LOCAL para actualizar visibilidad
  const notifyEditButtonVisibility = (visible: boolean) => {
    if (onEditButtonUpdate) {
      onEditButtonUpdate(visible)
    }
  }

  scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERDOWN: {
        const pick = scene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY)
        if (!pick?.hit || !pick.pickedMesh) {
          deselectAll(scene, state, notifyEditButtonVisibility)  // ✅ Pasar callback
          selectedMesh = null
          return
        }
        const root = getRootNode(pick.pickedMesh, state)
        if (!root) return

        camera.detachControl()
        selectedMesh = pick.pickedMesh
        isDragging = false
        dragStartPointer = {
          x: pointerInfo.event.clientX,
          y: pointerInfo.event.clientY,
        }
        selectComponent(root, scene, state, notifyEditButtonVisibility)  // ✅ Pasar callback
        break
      }

      case PointerEventTypes.POINTERMOVE: {
        if (!selectedMesh || state.currentTool !== 'move') return
        const dx = pointerInfo.event.clientX - dragStartPointer.x
        const dy = pointerInfo.event.clientY - dragStartPointer.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 8) {
          isDragging = true
          const root = getRootNode(selectedMesh, state)
          if (!root) return

          const pick = scene.pick(
            pointerInfo.event.offsetX,
            pointerInfo.event.offsetY,
            (mesh) => mesh.name === 'grid',
          )

          if (pick?.hit && pick.pickedPoint) {
            root.position.x = pick.pickedPoint.x
            root.position.z = pick.pickedPoint.z
            root.position.y = dragPlaneY
            const comp = state.components.find(c => c.id === root.name)
            if (comp) {
              comp.position.x = pick.pickedPoint.x
              comp.position.z = pick.pickedPoint.z
            }
          }
        }
        break
      }
case PointerEventTypes.POINTERUP: {
  camera.attachControl(scene.getEngine().getRenderingCanvas()!, true)
  
  if (isDragging && selectedMesh) {
    const root = getRootNode(selectedMesh, state)
    if (root) {
      const comp = state.components.find(c => c.id === root.name)
      if (comp) {
        // ✅ Sincronizar posición antes de guardar
        comp.position.x = root.position.x
        comp.position.z = root.position.z
        wireManager.updateWiresForComponent(comp.id)
        saveBabylonSnapshot(state, `move:${comp.type}`)
      }
    }
    emit(AppEvents.STATE_CHANGED, null)
  }
  
  isDragging = false
  selectedMesh = null
  break
}
    }
  })

  const canvas = scene.getEngine().getRenderingCanvas()!

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const touch = e.touches[0]!
    const rect = canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    const target = document.elementFromPoint(touch.clientX, touch.clientY)
    if (target?.closest('#mobile-ui')) return

    const camRadius = camera.radius
const zoomFactor = Math.max(0.5, Math.min(2, 25 / camRadius))  // ← Factor basado en zoom
const pickRadius = Math.min(150, Math.max(60, 80 * zoomFactor)) 

    let pick = scene.pick(x, y)
    if (!pick?.hit || !pick.pickedMesh) {
      const step = pickRadius / 3
      const offsets = [
  [0, 0],
  [step, 0], [-step, 0], [0, step], [0, -step],
  [step*2, 0], [-step*2, 0], [0, step*2], [0, -step*2],
  [step*3, 0], [-step*3, 0], [0, step*3], [0, -step*3],
  [step*1.5, step*1.5], [-step*1.5, step*1.5], [step*1.5, -step*1.5], [-step*1.5, -step*1.5],
  [step*2.5, step*2.5], [-step*2.5, step*2.5], [step*2.5, -step*2.5], [-step*2.5, -step*2.5],
]
      for (const offset of offsets) {
        const odx = offset[0] ?? 0
        const ody = offset[1] ?? 0
        pick = scene.pick(x + odx, y + ody)
        if (pick?.hit && pick.pickedMesh) break
      }
    }

    if (!pick?.hit || !pick.pickedMesh) {
      deselectAll(scene, state, notifyEditButtonVisibility)
      selectedMesh = null
      return
    }


  if (mobileCurrentTool === 'delete') {
  const mesh = pick.pickedMesh

  // ¿Es un cable?
  const wire = state.wires.find(w => w.id === mesh.name)
  if (wire) {
    saveBabylonSnapshot(state, 'delete:wire')
    wireManager.delete(wire.id)
    playSound('delete')
    showNotification('🗑️ Cable eliminado', 'success')
    emit(AppEvents.STATE_CHANGED, null)
    return
  }

  // ¿Es un componente?
  const root = getRootNode(mesh, state)
  const comp = root ? state.components.find(c => c.id === root.name) : null
  if (comp) {
    saveBabylonSnapshot(state, `delete:${comp.type}`)
    wireManager.removeAllByComponent(comp.id)
    cm.delete(comp.id)
    showNotification('🗑️ Componente eliminado', 'success')
    emit(AppEvents.STATE_CHANGED, null)
    return
  }

  return
}





if (mobileCurrentTool === 'wire') {
  const mesh = pick.pickedMesh
  
  // ✅ Buscar el componente raíz (terminal O cuerpo del componente)
  const root = getRootNode(mesh, state)
  const comp = root ? state.components.find(c => c.id === root.name) : null
  if (!comp) return

  if (!wireStartComp) {
    // — PRIMER TAP: guardar componente origen —
    wireStartComp = comp

    // Resaltar componente seleccionado
    root.getChildMeshes().forEach((m: AbstractMesh) => {
      if (m.metadata?.isTerminal) return
      const mat = m.material as StandardMaterial
      if (mat) mat.emissiveColor = new Color3(0.2, 0.8, 1) // azul cyan
    })
    root.scaling = new Vector3(1.2, 1.2, 1.2)

    showNotification(`Origen: ${comp.type} — toca el destino`, 'success')

  } else if (wireStartComp.id !== comp.id) {
    // — SEGUNDO TAP: resolver terminales automáticamente —

    // Restaurar apariencia del origen
    const startRoot = scene.getNodeByName(wireStartComp.id) as any
    startRoot?.getChildMeshes().forEach((m: AbstractMesh) => {
      if (m.metadata?.isTerminal) return
      const mat = m.material as StandardMaterial
      if (mat) mat.emissiveColor = new Color3(0, 0, 0)
    })
    if (startRoot) startRoot.scaling = new Vector3(1, 1, 1)

    // ✅ RESOLVER par de terminales automáticamente
    const pair = resolveTerminalPair(wireStartComp, comp, state)

    if (!pair) {
      errorEffect(scene, getMeshPosition(comp.mesh))
      shakeComponent(comp.mesh, 0.03, 150)
      showNotification('❌ No hay conexión posible entre estos componentes', 'error')
      playSound('error')
      wireStartComp = null
      wireStartTerm = null
      return
    }

    // ✅ Verificar duplicado
    const duplicate = state.wires.find(w =>
      (w.startComp === wireStartComp.id && w.startTerm === pair.startTerm.type &&
       w.endComp === comp.id && w.endTerm === pair.endTerm.type) ||
      (w.startComp === comp.id && w.startTerm === pair.endTerm.type &&
       w.endComp === wireStartComp.id && w.endTerm === pair.startTerm.type)
    )
    if (duplicate) {
      showNotification('⚠️ Ya existe un cable entre estos terminales', 'warning')
      wireStartComp = null
      return
    }

    const autoColor = resolveWireColor(wireStartComp, pair.startTerm, pair.endTerm)
    wireManager.create(wireStartComp, pair.startTerm, comp, pair.endTerm, { color: autoColor })
playSound('connect')
    saveBabylonSnapshot(state, 'connect')
sparkEffect(scene, getMeshPosition(pair.endTerm.mesh))
showNotification(`✅ Conectado (${pair.startTerm.type} → ${pair.endTerm.type})`, 'success')
emit(AppEvents.STATE_CHANGED, null)


    wireStartComp = null
    wireStartTerm = null
  }
  return
}
    const root = getRootNode(pick.pickedMesh, state)
    if (!root) return
    if (mobileCurrentTool === 'move') camera.detachControl()
    selectedMesh = pick.pickedMesh
    isDragging = false
    dragStartPointer = { x: touch.clientX, y: touch.clientY }
    selectComponent(root, scene, state, notifyEditButtonVisibility)
  }, { passive: false })
























  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (!selectedMesh || mobileCurrentTool !== 'move') return
    const touch = e.touches[0]!
    const dx = touch.clientX - dragStartPointer.x
    const dy = touch.clientY - dragStartPointer.y
    if (Math.sqrt(dx*dx + dy*dy) > 8) {
      isDragging = true
      const root = getRootNode(selectedMesh, state)
      if (!root) return
      const rect = canvas.getBoundingClientRect()
      const pick = scene.pick(touch.clientX - rect.left, touch.clientY - rect.top, (mesh) => mesh.name === 'grid')
if (pick?.hit && pick.pickedPoint) {
  root.position.x = pick.pickedPoint.x
  root.position.z = pick.pickedPoint.z
  root.position.y = 1
  const comp = state.components.find(c => c.id === (root as any).name)
  if (comp) {
    comp.position.x = pick.pickedPoint.x
    comp.position.z = pick.pickedPoint.z
    // ✅ AGREGAR ESTA LÍNEA:
    wireManager.updateWiresForComponent(comp.id)  // ← ACTUALIZAR CABLES
  }
}
    }
  }, { passive: false })

canvas.addEventListener('touchend', (e) => {
  e.preventDefault()
  if (state.currentTool === 'move') camera.attachControl(canvas, true)

}, { passive: false })
}


// Agrega esto fuera de setupMobileControls, al final del archivo

function resolveTerminalPair(
  startComp: any,
  endComp: any,
  state: AppState
): { startTerm: any; endTerm: any } | null {

  // Terminales ya ocupados (ya tienen cable)
  const usedTerminals = new Set(
    state.wires.flatMap(w => [
      `${w.startComp}-${w.startTerm}`,
      `${w.endComp}-${w.endTerm}`
    ])
  )

  const isAvailable = (compId: string, termType: string) =>
    !usedTerminals.has(`${compId}-${termType}`)

  // ✅ Prioridad de conexiones válidas (igual que resolveWireColor en PC)
  const PRIORITY_RULES = [
    { from: 'positive', to: 'input'    },  // batería → resistor/LED
    { from: 'positive', to: 'positive' },  // paralelo
    { from: 'output',   to: 'input'    },  // cascada de componentes
    { from: 'output',   to: 'positive' },  // salida → siguiente
    { from: 'output',   to: 'negative' },  // retorno
    { from: 'negative', to: 'negative' },  // tierra paralelo
    { from: 'negative', to: 'input'    },  // negativo → entrada
  ]

  for (const rule of PRIORITY_RULES) {
    const startTerm = startComp.terminals.find(
      (t: any) => t.type === rule.from && isAvailable(startComp.id, t.type)
    )
    const endTerm = endComp.terminals.find(
      (t: any) => t.type === rule.to && isAvailable(endComp.id, t.type)
    )
    if (startTerm && endTerm) {
      return { startTerm, endTerm }
    }
  }

  return null // No hay par válido disponible
}

function getRootNode(mesh: AbstractMesh, state: AppState) {
  let node: any = mesh
  while (node) {
    const comp = state.components.find(c => c.id === node.name)
    if (comp) return node
    node = node.parent
  }
  return null
}

// ✅ Añadido parámetro onEditButtonUpdate
// ✅ Seleccionar componente con efecto según el modo
function selectComponent(
  root: any, 
  scene: Scene, 
  state: AppState,
  onEditButtonUpdate?: EditButtonUpdateCallback
): void {
  // Primero deseleccionar todo
  deselectAll(scene, state, onEditButtonUpdate)

  // ✅ Animación de rebote (siempre)
  const originalY = root.position.y
  let t = 0
  const jumpInterval = setInterval(() => {
    t += 0.15
    root.position.y = originalY + Math.sin(t) * 0.5
    if (t >= Math.PI) {
      root.position.y = originalY
      clearInterval(jumpInterval)
    }
  }, 16)

  // ✅ Efecto visual según el modo actual
  root.getChildMeshes().forEach((mesh: AbstractMesh) => {
    if (mesh.metadata?.isTerminal) return  // Ignorar terminales
    const mat = mesh.material as StandardMaterial
    if (!mat) return
    
    if (mobileCurrentTool === 'move') {
      // 🟡 MODO MOVE: Amarillo brillante (para ver qué se arrastra)
      mat.emissiveColor = new Color3(1, 0.85, 0.1)
    } else if (mobileCurrentTool === 'wire') {
      // 🎨 MODO WIRE: Color del componente más brillante
      // Usar diffuseColor como base y hacerlo más intenso en emissive
      const baseR = mat.diffuseColor?.r ?? 0.5
      const baseG = mat.diffuseColor?.g ?? 0.5
      const baseB = mat.diffuseColor?.b ?? 0.5
      mat.emissiveColor = new Color3(
        Math.min(1, baseR * 1.4),
        Math.min(1, baseG * 1.4),
        Math.min(1, baseB * 1.4)
      )
    } else {
      // ⚪ MODO SELECT: Sin brillo (solo rebote)
      mat.emissiveColor = new Color3(0, 0, 0)
    }
  })

  // Escalar ligeramente el componente seleccionado
  root.scaling = new Vector3(1.15, 1.15, 1.15)

  // Actualizar estado
  const comp = state.components.find(c => c.id === root.name)
  if (comp) {
    pulseComponent(root, 300)
    state.selected = comp
    emit(AppEvents.STATE_CHANGED, null)
    const shouldShow = state.currentTool === 'select' && state.selected !== null
    onEditButtonUpdate?.(shouldShow)
  }
}

// ✅ Deseleccionar todos los componentes
function deselectAll(
  scene: Scene, 
  state: AppState,
  onEditButtonUpdate?: EditButtonUpdateCallback
): void {
  state.components.forEach(comp => {
    const node = scene.getNodeByName(comp.id) as any
    if (!node) return
    
    // Restaurar apariencia normal a todos los meshes del componente
    node.getChildMeshes?.().forEach((mesh: AbstractMesh) => {
      if (mesh.metadata?.isTerminal) return  // Ignorar terminales
      const mat = mesh.material as StandardMaterial
      if (mat) {
        // ✅ Restaurar a estado normal: sin brillo
        mat.emissiveColor = new Color3(0, 0, 0)
      }
    })
    
    // Restaurar escala normal
    node.scaling = new Vector3(1, 1, 1)
  })
  
  // Limpiar selección
  state.selected = null
  onEditButtonUpdate?.(false)
  emit(AppEvents.STATE_CHANGED, null)
}

