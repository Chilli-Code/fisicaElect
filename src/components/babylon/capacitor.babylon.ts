import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createCapacitorBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('capacitor', scene)
  const body = MeshBuilder.CreateCylinder('cap-body', { height: 1.2, diameter: 1.2 }, scene)
  body.parent = g
  body.material = mat(scene, 0x3498db)
  const stripe = MeshBuilder.CreateCylinder('cap-stripe', { height: 0.3, diameter: 1.22 }, scene)
  stripe.parent = g
  stripe.position.y = 0.3
  stripe.material = mat(scene, 0x1a252f)
  makeTerminal(scene, g, 0, 0.7, 0, 'positive')
  makeTerminal(scene, g, 0, -0.7, 0, 'negative')
  return g
}