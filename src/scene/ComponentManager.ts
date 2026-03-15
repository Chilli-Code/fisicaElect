// ============================================================
// src/scene/ComponentManager.ts
// CRUD de componentes en la escena Three.js
// ============================================================

import * as THREE from 'three'
import type {
  AppState,
  CircuitComponent,
  ComponentType,
  ComponentTemplateMap,
  Terminal,
} from '@core/types'

export class ComponentManager {
  // Mapa rápido meshId → component
  public meshMap = new Map<string, THREE.Object3D>()

  constructor(
    private scene: THREE.Scene,
    private state: AppState,
    private templates: ComponentTemplateMap,
  ) {}

  add(type: ComponentType, x: number, z: number): CircuitComponent {
    const template = this.templates[type]
    const id = `comp-${this.state.idCounter++}`

    const mesh = template.create3D()
    mesh.position.set(x, 1, z)
    mesh.userData['id'] = id
    mesh.userData['type'] = type
    mesh.userData['selectable'] = true
    this.scene.add(mesh)
    this.meshMap.set(id, mesh)

    const terminals = this.extractTerminals(mesh)

    const component: CircuitComponent = {
      id,
      type,
      name: template.name,
      value: template.defaultValue,
      mesh,
      position: { x, z },
      terminals,
      isOn: type === 'switch' ? true : undefined,
    }

    this.state.components.push(component)
    return component
  }

  delete(id: string): CircuitComponent | null {
    const index = this.state.components.findIndex(c => c.id === id)
    if (index === -1) return null

    const [comp] = this.state.components.splice(index, 1)
    if (!comp) return null
    this.scene.remove(comp.mesh)
    this.meshMap.delete(id)
    return comp
  }

  clear(): void {
    this.state.components.forEach(c => this.scene.remove(c.mesh))
    this.state.components = []
    this.meshMap.clear()
  }

  /** Reconstruir componente desde snapshot (para undo/redo) */
  restoreFromSnapshot(data: {
    id: string
    type: ComponentType
    name: string
    value: number
    position: { x: number; z: number }
  }): CircuitComponent {
    const template = this.templates[data.type]
    const mesh = template.create3D()
    mesh.position.set(data.position.x, 1, data.position.z)
    mesh.userData['id'] = data.id
    mesh.userData['type'] = data.type
    mesh.userData['selectable'] = true
    this.scene.add(mesh)
    this.meshMap.set(data.id, mesh)

    const terminals = this.extractTerminals(mesh)

    const component: CircuitComponent = {
      id: data.id,
      type: data.type,
      name: data.name,
      value: data.value,
      mesh,
      position: { x: data.position.x, z: data.position.z },
      terminals,
    }
    this.state.components.push(component)
    return component
  }

  private extractTerminals(mesh: THREE.Object3D): Terminal[] {
    const terminals: Terminal[] = []
    mesh.children.forEach(child => {
      if (child.userData['isTerminal']) {
        const worldPos = new THREE.Vector3()
        child.getWorldPosition(worldPos)
        terminals.push({
          type: child.userData['terminalType'],
          position: worldPos.clone(),
          mesh: child,
        })
      }
    })
    return terminals
  }

  getAllMeshes(): THREE.Object3D[] {
    const result: THREE.Object3D[] = []
    this.meshMap.forEach(mesh => {
      result.push(mesh)
      result.push(...mesh.children)
    })
    return result
  }
}
