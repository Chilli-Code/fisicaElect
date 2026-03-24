// ============================================================
// src/ui/mobile/MobileControls.ts
// Tap para seleccionar + drag para mover en Babylon.js
// ============================================================

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

import { mobileCurrentTool } from '@ui/mobile/MobileLayout'


export function setupMobileControls(scene: Scene, state: AppState, camera: ArcRotateCamera): void {
  let selectedMesh: AbstractMesh | null = null
  let isDragging = false
  let dragStartPointer = { x: 0, y: 0 }

  // Plano invisible para detectar posición del drag
  const dragPlaneY = 1

  scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {

case PointerEventTypes.POINTERDOWN: {
  const pick = scene.pick(
    pointerInfo.event.offsetX,
    pointerInfo.event.offsetY,
  )
  if (!pick?.hit || !pick.pickedMesh) {
    deselectAll(scene, state)
    selectedMesh = null
    return
  }
  const root = getRootNode(pick.pickedMesh, state)
  if (!root) return

  // ← Desactivar cámara cuando tocas componente
  camera.detachControl()
if (state.currentTool === 'move') {
  camera.detachControl()
}
  selectedMesh = pick.pickedMesh
  isDragging = false
  dragStartPointer = {
    x: pointerInfo.event.clientX,
    y: pointerInfo.event.clientY,
  }
  selectComponent(root, scene, state)
  break
}
      case PointerEventTypes.POINTERMOVE: {
        if (!selectedMesh) return
if (state.currentTool !== 'move') return
const dx = pointerInfo.event.clientX - dragStartPointer.x
  const dy = pointerInfo.event.clientY - dragStartPointer.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Si se mueve más de 8px es drag
        if (distance > 8) {
          isDragging = true
          const root = getRootNode(selectedMesh, state)
          if (!root) return

          // Convertir movimiento de pantalla a movimiento 3D
          const pick = scene.pick(
            pointerInfo.event.offsetX,
            pointerInfo.event.offsetY,
            (mesh) => mesh.name === 'grid',
          )

          if (pick?.hit && pick.pickedPoint) {
            root.position.x = pick.pickedPoint.x
            root.position.z = pick.pickedPoint.z
            root.position.y = dragPlaneY

            // Actualizar posición en state
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
  // ← Reactivar cámara siempre al soltar
  camera.attachControl(scene.getEngine().getRenderingCanvas()!, true)
  if (isDragging) {
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
  const pickRadius = Math.min(60, Math.max(20, camRadius * 2))

let pick = scene.pick(x, y)
  if (!pick?.hit || !pick.pickedMesh) {
    const step = pickRadius / 3
    const offsets = [
      [0, 0],
      [step, 0], [-step, 0], [0, step], [0, -step],
      [step*2, 0], [-step*2, 0], [0, step*2], [0, -step*2],
      [step, step], [-step, step], [step, -step], [-step, -step],
    ]
    for (const offset of offsets) {
      const odx = offset[0] ?? 0
      const ody = offset[1] ?? 0
      pick = scene.pick(x + odx, y + ody)
      if (pick?.hit && pick.pickedMesh) break
    }
  
  }
    if (!pick?.hit || !pick.pickedMesh) {
    deselectAll(scene, state)
    selectedMesh = null
    return
  }
  const root = getRootNode(pick.pickedMesh, state)
  if (!root) return
  if (state.currentTool === 'move') camera.detachControl()
  selectedMesh = pick.pickedMesh
  isDragging = false
  dragStartPointer = { x: touch.clientX, y: touch.clientY }
  selectComponent(root, scene, state)
}, { passive: false })

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault()
   console.log('touchmove tool:', state.currentTool)  // ← agrega esto
  if (!selectedMesh) return 
  if (mobileCurrentTool  !== 'move') return 
  const touch = e.touches[0]!
  const dx = touch.clientX - dragStartPointer.x
  const dy = touch.clientY - dragStartPointer.y
  if (Math.sqrt(dx*dx + dy*dy) > 8) {
    isDragging = true
    const root = getRootNode(selectedMesh, state)
    if (!root) return
    const rect = canvas.getBoundingClientRect()
    const pick = scene.pick(
      touch.clientX - rect.left,
      touch.clientY - rect.top,
      (mesh) => mesh.name === 'grid',
    )
    if (pick?.hit && pick.pickedPoint) {
      root.position.x = pick.pickedPoint.x
      root.position.z = pick.pickedPoint.z
      root.position.y = 1
      const comp = state.components.find(c => c.id === (root as any).name)
      if (comp) {
        comp.position.x = pick.pickedPoint.x
        comp.position.z = pick.pickedPoint.z
      }
    }
  }
}, { passive: false })

canvas.addEventListener('touchend', (e) => {
  e.preventDefault()
 if (state.currentTool === 'move') camera.attachControl(canvas, true)
  if (isDragging) emit(AppEvents.STATE_CHANGED, null)
  isDragging = false
  selectedMesh = null
}, { passive: false })
}













function getRootNode(mesh: AbstractMesh, state: AppState) {
  // Buscar hacia arriba hasta encontrar el componente raíz
  let node: any = mesh
  while (node) {
    const comp = state.components.find(c => c.id === node.name)
    if (comp) return node
    node = node.parent
  }
  return null
}

function selectComponent(root: any, scene: Scene, state: AppState): void {
  deselectAll(scene, state)

  // Animación de salto
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

  // Resaltar con color dorado más brillante
root.getChildMeshes().forEach((mesh: AbstractMesh) => {
  if (mesh.metadata?.isTerminal) return
  const mat = mesh.material as StandardMaterial
  if (!mat) return

  // 🧠 SOLO resaltar si NO estás en SELECT
  if (mobileCurrentTool !== 'select') {
    mat.emissiveColor = new Color3(1, 0.8, 0)
  } else {
    mat.emissiveColor = Color3.Black()
  }
})

  // Escalar levemente para feedback visual
  root.scaling = new Vector3(1.15, 1.15, 1.15)

  const comp = state.components.find(c => c.id === root.name)
  if (comp) state.selected = comp
}

function deselectAll(scene: Scene, state: AppState): void {
  state.components.forEach(comp => {
    const node = scene.getNodeByName(comp.id) as any
    if (!node) return
    node.getChildMeshes?.()?.forEach((mesh: AbstractMesh) => {
      if (mesh.metadata?.isTerminal) return
      const mat = mesh.material as StandardMaterial
      if (mat) mat.emissiveColor = Color3.Black()
    })
    // Restaurar scale
    node.scaling = new Vector3(1, 1, 1)
  })
  state.selected = null
}