// BabylonComponentManager.ts
// Gestión de componentes 3D con Babylon.js
// ============================================================

import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { AppState, ComponentType, CircuitComponent, Terminal, SerializedComponent } from '@core/types'
import { getBabylonTemplates } from '@components/babylon/templates.babylon'
import { saveBabylonSnapshot } from '@core/babylon-history'

const TERMINAL_COLORS: Record<string, string> = {
  positive: '#FF0000',    // 🔴 Rojo
  negative: '#000000',    // ⚫ Negro
  input:    '#FF8C00',    // 🟠 Naranja
  output:   '#00FF00',    // 🟢 Verde brillante
  anode:    '#FF0000',    // 🔴 Rojo
  cathode:  '#000000',    // ⚫ Negro
  base:     '#0000FF',    // 🔵 Azul
  collector:'#FF0000',    // 🔴 Rojo
  emitter:  '#00FF00',    // 🟢 Verde
  phase:    '#FF0000',    // 🔴 Rojo (AC)
  neutral:  '#0000CD',    // 🔵 Azul oscuro (AC)
}
export class BabylonComponentManager {
  private scene: Scene
  private state: AppState
  private templates = getBabylonTemplates()

  constructor(scene: Scene, state: AppState, _templates: any) {
    this.scene = scene
    this.state = state
  }

add(type: ComponentType, x: number, z: number, explicitId?: string): CircuitComponent {
  const template = this.templates[type]
  if (!template) throw new Error(`Template no encontrado: ${type}`)

  // ✅ Si se proporciona ID explícito, usarlo; si no, generar uno nuevo
  const componentId = explicitId || `${type}-${++this.state.idCounter}`
  
  const group = template.createBabylon(this.scene)
  group.name = componentId  // ← Usar componentId para que Babylon lo encuentre
  group.position = new Vector3(x, 1, z)

  const terminals: Terminal[] = template.terminals.map(t => {
    const sphere = MeshBuilder.CreateSphere(
      `${componentId}-${t.type}`,  // ← Usar componentId en nombres de meshes
      { diameter: 0.4 },
      this.scene,
    )
    sphere.parent = group
    sphere.position = new Vector3(t.offset.x, t.offset.y, t.offset.z)

    const mat = new StandardMaterial(`${componentId}-${t.type}-mat`, this.scene)
    mat.diffuseColor = new Color3(1, 1, 1)
    mat.emissiveColor = new Color3(0.2, 0.2, 0.2)
    mat.specularColor = new Color3(0, 0, 0)
    sphere.material = mat
    sphere.metadata = { isTerminal: true, terminalType: t.type, componentId: componentId }

    return {
      type: t.type as any,
      position: { x: x + t.offset.x, z: z + t.offset.z } as any,
      mesh: sphere as any,
    }
  })

  const component: CircuitComponent = {
    id: componentId,  // ← Usar componentId
    type,
    name: template.name,
    value: template.defaultValue,
    mesh: group as any,
    position: { x, z },
    terminals,
    ...(type === 'switch' ? { isOn: true as const } : {}),
  }

  this.state.components.push(component)
  return component
}
delete(id: string): void {
  const comp = this.state.components.find(c => c.id === id)
  if (!comp) return
  
  // ✅ Guardar snapshot ANTES de eliminar (solo una vez)
  saveBabylonSnapshot(this.state, `delete:${comp.type}`)
  
  this.scene.getNodeByName(id)?.dispose()
  this.state.components = this.state.components.filter(c => c.id !== id)
}

  clear(): void {
    this.state.components.forEach(c => {
      this.scene.getNodeByName(c.id)?.dispose()
    })
    this.state.components = []
    this.state.idCounter = 0
  }

  getAllMeshes(): Mesh[] {
    return this.state.components.flatMap(c =>
      c.terminals.map(t => t.mesh as unknown as Mesh)
    )
  }

  restoreFromSnapshot(data: SerializedComponent): CircuitComponent {
    return this.add(data.type, data.position.x, data.position.z)
  }
}