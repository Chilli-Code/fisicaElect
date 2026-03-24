import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createVoltmeterBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('voltmeter', scene)
  const body = MeshBuilder.CreateBox('volt-body', { width: 1.5, height: 1, depth: 0.5 }, scene)
  body.parent = g
  body.material = mat(scene, 0x8e44ad)
  const screen = MeshBuilder.CreateBox('volt-screen', { width: 0.8, height: 0.5, depth: 0.1 }, scene)
  screen.parent = g
  screen.position.z = 0.3
  screen.material = mat(scene, 0x1abc9c)
  makeTerminal(scene, g, 0.9, 0, 0, 'positive')
  makeTerminal(scene, g, -0.9, 0, 0, 'negative')
  return g
}