// ============================================================
// src/scene/BabylonWireManager.ts
// Gestión de cables 3D con Babylon.js
// ============================================================

import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import type { AppState, CircuitComponent, Terminal, Wire } from '@core/types'

const WIRE_COLORS: Record<string, string> = {
  positive: '#FF3B30',
  negative: '#000000',
  input:    '#FF8C00',
  output:   '#1E90FF',
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
  ): Wire {
    const id = `wire-${Date.now()}`

    const sx = (startTerm as any).offset?.x ?? 0
const sz = (startTerm as any).offset?.z ?? 0
const ex = (endTerm as any).offset?.x ?? 0
const ez = (endTerm as any).offset?.z ?? 0

const startPos = new Vector3(startComp.position.x + sx, 0.1, startComp.position.z + sz)
const endPos = new Vector3(endComp.position.x + ex, 0.1, endComp.position.z + ez)

    const mesh = MeshBuilder.CreateTube(id, {
      path: [startPos, endPos],
      radius: 0.05,
      updatable: true,
    }, this.scene)

    const mat = new StandardMaterial(`${id}-mat`, this.scene)
    const hexColor = WIRE_COLORS[startTerm.type] ?? '#888888'
    mat.emissiveColor = Color3.FromHexString(hexColor)
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

  updateAll(hasCurrent: boolean, isSimulating: boolean): void {
    this.state.wires.forEach(wire => {
      const mesh = this.scene.getMeshByName(wire.id)
      if (!mesh) return
      const mat = mesh.material as StandardMaterial
      if (!mat) return
      if (isSimulating && hasCurrent) {
        mat.emissiveColor = Color3.FromHexString('#FFD700')
      } else {
        const hex = '#' + (wire.baseColor ?? 0x888888).toString(16).padStart(6, '0')
mat.emissiveColor = Color3.FromHexString(hex)
      }
    })
  }
}