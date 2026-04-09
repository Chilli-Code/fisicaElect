// ============================================================
// src/scene/BabylonWireManager.ts
// Gestión de cables 3D con Babylon.js
// ============================================================

import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Curve3 } from '@babylonjs/core'
import type { Scene } from '@babylonjs/core/scene'
import type { AppState, CircuitComponent, Terminal, Wire } from '@core/types'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer'  // ← AGREGAR ESTO

// ✅ Función para determinar color automáticamente (como en PC)
export function resolveWireColor(
  startComp: CircuitComponent,
  startTerm: Terminal,
  endTerm: Terminal,
): string {
  const s = startTerm.type
  const e = endTerm.type
  
  if ((s === 'positive' && e === 'input') || (s === 'positive' && e === 'positive')) return '#ff0000'
  if ((s === 'negative' && e === 'negative') || (s === 'negative' && e === 'input')) return '#000000'
  if (s === 'output' && e === 'positive') return '#ff8c00'
  if (s === 'output' && e === 'negative') return '#0000cd'
  if (startComp.type === 'ac-source') {
    if (s === 'negative') return '#1e90ff'
    if (s === 'positive') return '#8b4513'
  }
  return '#808080'
}

export class BabylonWireManager {
  private scene: Scene
  private state: AppState

  constructor(scene: Scene, state: AppState) {
    this.scene = scene
    this.state = state
  }

  create(
  startComp: CircuitComponent,
  startTerm: Terminal,
  endComp: CircuitComponent,
  endTerm: Terminal,
  options?: { color?: string }
): Wire {
  const id = `wire-${Date.now()}`

  // ✅ USAR posición ABSOLUTA de los terminales (no offsets)
  const startMesh = startTerm.mesh
  const endMesh = endTerm.mesh
  
const startPos = (startMesh as any).absolutePosition || startMesh.position
const endPos = (endMesh as any).absolutePosition || endMesh.position

  // ✅ CURVA BEZIER que conecta EXACTAMENTE en los terminales
  const midPoint = new Vector3(
    (startPos.x + endPos.x) / 2,
    Math.max(startPos.y, endPos.y) + 0.5,  // ← Elevar menos para curva más suave
    (startPos.z + endPos.z) / 2
  )
  const curve = Curve3.CreateQuadraticBezier(startPos, midPoint, endPos, 50)

  const mesh = MeshBuilder.CreateTube(id, {
    path: curve.getPoints(),
    radius: 0.05,
    updatable: true,
  }, this.scene)


// ✅ MATERIAL CON COLOR SATURADO PERO BRILLO CONTROLADO
const mat = new StandardMaterial(`${id}-mat`, this.scene)
const hexColor = options?.color ?? resolveWireColor(startComp, startTerm, endTerm)
const color = Color3.FromHexString(hexColor)

// ✅ Color base 100% saturado (para que se vea el tono puro)
mat.diffuseColor = color.clone()

// ✅ Brillo reducido (70-80% para que no sea neón)
mat.emissiveColor = color.scale(0.75)  // ← Ajusta este valor: 0.5 = poco brillo, 1.0 = muy brillante

// ✅ Sin reflejos blancos que apaguen el color
mat.specularColor = new Color3(0, 0, 0)
mat.disableLighting = true

mesh.material = mat
mesh.material = mat

  const wire: Wire = {
    id,
    startComp: startComp.id,
    startTerm: startTerm.type,
    endComp: endComp.id,
    endTerm: endTerm.type,
    baseColor: parseInt(hexColor.replace('#', ''), 16),
    mesh: mesh as any,
    wireLabel: `${startTerm.type}→${endTerm.type}`,
    startTerminal: startTerm,
    endTerminal: endTerm,
  }

  this.state.wires.push(wire)
  return wire
}

  delete(id: string): void {
    const wire = this.state.wires.find(w => w.id === id)
    if (!wire) return
    this.scene.getMeshByName(id)?.dispose()
    this.state.wires = this.state.wires.filter(w => w.id !== id)
  }

  clear(): void {
    this.state.wires.forEach(w => {
      this.scene.getMeshByName(w.id)?.dispose()
    })
    this.state.wires = []
  }

  removeAllByComponent(componentId: string): void {
    const toDelete = this.state.wires.filter(
      w => w.startComp === componentId || w.endComp === componentId
    )
    toDelete.forEach(w => this.delete(w.id))
  }


// En BabylonWireManager.ts
updateAll(hasCurrent: boolean, isSimulating: boolean): void {
  this.state.wires.forEach(wire => {
    const mesh = this.scene.getMeshByName(wire.id)
    const mat = mesh?.material as StandardMaterial
    if (!mat) return

    if (isSimulating && hasCurrent) {
      // ✅ Animado amarillo
      const time = Date.now() * 0.005
      const pulse = (Math.sin(time) + 1) / 2
      mat.emissiveColor = new Color3(1, 0.6 + pulse * 0.25, 0)
      mat.diffuseColor = Color3.FromHexString('#FFA500')
      mat.disableLighting = true
    } else {
      // ✅ Restaurar color original SIN brillo
      const hex = '#' + (wire.baseColor ?? 0x888888).toString(16).padStart(6, '0')
      const originalColor = Color3.FromHexString(hex)
      mat.diffuseColor = originalColor.clone()
      mat.emissiveColor = new Color3(0, 0, 0)  // ← sin brillo
      mat.specularColor = new Color3(0, 0, 0)
      mat.disableLighting = false  // ← que reciba luz normal
    }
  })
}


  /**
   * Actualiza la geometría de todos los cables conectados a un componente
   * (se llama al arrastrar el componente en modo move)
   */
  updateWiresForComponent(componentId: string): void {
    // Encontrar todos los cables conectados a este componente
    const connectedWires = this.state.wires.filter(
      w => w.startComp === componentId || w.endComp === componentId
    )
    
    connectedWires.forEach(wire => {
      const mesh = this.scene.getMeshByName(wire.id)
      if (!mesh) return
      
      // Obtener componentes y terminales
      const startComp = this.state.components.find(c => c.id === wire.startComp)
      const endComp = this.state.components.find(c => c.id === wire.endComp)
      if (!startComp || !endComp) return
      
      const startTerm = startComp.terminals.find(t => t.type === wire.startTerm)
      const endTerm = endComp.terminals.find(t => t.type === wire.endTerm)
      if (!startTerm || !endTerm) return
      
      // Obtener posiciones absolutas de los terminales
      const startMesh = startTerm.mesh
      const endMesh = endTerm.mesh
      const startPos = (startMesh as any).absolutePosition || startMesh.position
      const endPos = (endMesh as any).absolutePosition || endMesh.position
      
      // Recalcular curva Bezier
      const midPoint = new Vector3(
        (startPos.x + endPos.x) / 2,
        Math.max(startPos.y, endPos.y) + 0.5,
        (startPos.z + endPos.z) / 2
      )
      const curve = Curve3.CreateQuadraticBezier(startPos, midPoint, endPos, 50)
      
      // ✅ OPCIÓN A (Simple): Eliminar cable viejo y crear uno nuevo
      // Esto es más fiable que actualizar vértices manualmente
      const newMesh = MeshBuilder.CreateTube(wire.id, {
        path: curve.getPoints(),
        radius: 0.05,
        updatable: true,
      }, this.scene)
      
      // Copiar material del cable original al nuevo
      if (mesh.material) {
        newMesh.material = mesh.material
      }
      
      // Eliminar mesh viejo
      mesh.dispose()
      
      // Actualizar referencia en el wire
      wire.mesh = newMesh as any
    })
  }
  
}

// ✅ AGREGAR ESTO AL FINAL de BabylonWireManager.ts:

// Validar conexión antes de crear cable
export function validateWireConnection(
  startComp: CircuitComponent,
  startTerm: Terminal,
  endComp: CircuitComponent,
  endTerm: Terminal,
): { valid: boolean; error?: string; warning?: string } {
  
  // ❌ Error: Mismo componente
  if (startComp.id === endComp.id) {
    return { valid: false, error: "❌ No puedes conectar un componente consigo mismo" }
  }
  
  // 🔴 Error: Cortocircuito directo (positivo → negativo sin carga)
  if (startComp.type === 'battery' && endComp.type === 'battery') {
    if ((startTerm.type === 'positive' && endTerm.type === 'negative') ||
        (startTerm.type === 'negative' && endTerm.type === 'positive')) {
      return { valid: false, error: "⚠️ Cortocircuito: conecta una resistencia o carga primero" }
    }
  }
  
  // ✅ Conexiones válidas:
  // - positive → input/anode (alimentación)
  // - output/cathode → negative (retorno)
  // - output → input (cascada de componentes)
  
  const validConnections = [
    { from: ['positive', 'phase'], to: ['input', 'anode'] },
    { from: ['output', 'cathode'], to: ['negative', 'neutral', 'ground'] },
    { from: ['output'], to: ['input'] },
    { from: ['positive'], to: ['positive'] },  // Paralelo
    { from: ['negative'], to: ['negative'] },  // Paralelo
  ]
  
  const isValid = validConnections.some(rule => 
    rule.from.includes(startTerm.type) && rule.to.includes(endTerm.type)
  )
  
  if (!isValid) {
    return { 
      valid: false, 
      error: `❌ Conexión inválida: ${startTerm.type} → ${endTerm.type}` 
    }
  }
  
  // ⚠️ Warning: Polaridad invertida en LED
// ✅ Cast a string para comparar:
if (endComp.type === 'led' && startTerm.type === 'positive' && (endTerm.type as string) === 'cathode') {
  return { valid: true, warning: "⚠️ Polaridad invertida: el LED no se encenderá" }
}
  
  return { valid: true }
}

