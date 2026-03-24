import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createDiodeBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('diode', scene)
  const body = MeshBuilder.CreateCylinder('diode-body', { height: 1.2, diameter: 0.6 }, scene)
  body.parent = g
  body.rotation.z = Math.PI / 2
  body.material = mat(scene, 0x34495e)
  const band = MeshBuilder.CreateCylinder('diode-band', { height: 0.15, diameter: 0.62 }, scene)
  band.parent = g
  band.rotation.z = Math.PI / 2
  band.position.x = 0.4
  band.material = mat(scene, 0xe74c3c)
  makeTerminal(scene, g, 0.8, 0, 0, 'input')
  makeTerminal(scene, g, -0.8, 0, 0, 'output')
  return g
}