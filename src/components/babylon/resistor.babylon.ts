import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createResistorBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('resistor', scene)
  const body = MeshBuilder.CreateBox('resistor-body', { width: 2, height: 0.5, depth: 0.5 }, scene)
  body.parent = g
  body.material = mat(scene, 0xf39c12)
  const bandColors = [0xc0392b, 0xf1c40f, 0x27ae60]
  bandColors.forEach((color, i) => {
    const band = MeshBuilder.CreateBox(`band-${i}`, { width: 0.15, height: 0.52, depth: 0.52 }, scene)
    band.parent = g
    band.position.x = -0.5 + i * 0.5
    band.material = mat(scene, color)
  })
  makeTerminal(scene, g, 1.1, 0, 0, 'input')
  makeTerminal(scene, g, -1.1, 0, 0, 'output')
  return g
}