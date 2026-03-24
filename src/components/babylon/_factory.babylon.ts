import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'

export function mat(scene: Scene, hex: number): StandardMaterial {
  const m = new StandardMaterial(`mat-${hex}-${Date.now()}`, scene)
  const r = ((hex >> 16) & 255) / 255
  const g = ((hex >> 8) & 255) / 255
  const b = (hex & 255) / 255
  m.diffuseColor = new Color3(r, g, b)
  m.specularColor = new Color3(0.3, 0.3, 0.3)
  return m
}

export function makeTerminal(
  scene: Scene,
  parent: TransformNode,
  x: number,
  y: number,
  z: number,
  terminalType: string,
): void {
  const sphere = MeshBuilder.CreateSphere(`term-${terminalType}-${Date.now()}`, { diameter: 0.24 }, scene)
  sphere.parent = parent
  sphere.position.set(x, y, z)
  const m = new StandardMaterial(`term-mat-${Date.now()}`, scene)
  m.diffuseColor = new Color3(0.8, 0.8, 0.8)
  sphere.material = m
  sphere.metadata = { isTerminal: true, terminalType }
}