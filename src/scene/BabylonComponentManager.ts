import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { AppState, ComponentType, CircuitComponent, Terminal, SerializedComponent } from '@core/types'
import { getBabylonTemplates } from '@components/babylon/templates.babylon'

const TERMINAL_COLORS: Record<string, string> = {
  positive: '#FF3B30',
  negative: '#007AFF',
  input:    '#FF9500',
  output:   '#34C759',
}

export class BabylonComponentManager {
  private scene: Scene
  private state: AppState
  private templates = getBabylonTemplates()

  constructor(scene: Scene, state: AppState, _templates: any) {
    this.scene = scene
    this.state = state
  }

  add(type: ComponentType, x: number, z: number): CircuitComponent {
   const template = this.templates[type]
  if (!template) throw new Error(`Template no encontrado: ${type}`)

  const id = `${type}-${++this.state.idCounter}`
  const group = template.createBabylon(this.scene)
  group.name = id
  group.position = new Vector3(x, 1, z)


  // ← Collider invisible para facilitar el toque


    const terminals: Terminal[] = template.terminals.map(t => {
      const sphere = MeshBuilder.CreateSphere(
        `${id}-${t.type}`,
        { diameter: 0.3 },
        this.scene,
      )
      sphere.parent = group
      sphere.position = new Vector3(t.offset.x, t.offset.y, t.offset.z)

      const mat = new StandardMaterial(`${id}-${t.type}-mat`, this.scene)
      mat.emissiveColor = Color3.FromHexString(TERMINAL_COLORS[t.type] ?? '#888888')
      sphere.material = mat
      sphere.metadata = { isTerminal: true, terminalType: t.type, componentId: id }

      return {
        type: t.type as any,
        position: { x: x + t.offset.x, z: z + t.offset.z } as any,
        mesh: sphere as any,
      }
    })

    const component: CircuitComponent = {
      id,
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