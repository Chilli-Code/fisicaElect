import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createBatteryBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('battery', scene)
  const body = MeshBuilder.CreateCylinder('battery-body', { height: 2, diameter: 1 }, scene)
  body.parent = g
  body.material = mat(scene, 0x2ecc71)
  const cap = MeshBuilder.CreateCylinder('battery-cap', { height: 0.2, diameter: 0.4 }, scene)
  cap.parent = g
  cap.position.y = 1.1
  cap.material = mat(scene, 0xf1c40f)
  makeTerminal(scene, g, 0, 1.2, 0, 'positive')
  makeTerminal(scene, g, 0, -1.1, 0, 'negative')
  return g
}