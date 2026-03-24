import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createAmmeterBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('ammeter', scene)
  const body = MeshBuilder.CreateBox('ammeter-body', { width: 1.5, height: 1, depth: 0.5 }, scene)
  body.parent = g
  body.material = mat(scene, 0xe67e22)
  const screen = MeshBuilder.CreateBox('ammeter-screen', { width: 0.8, height: 0.5, depth: 0.1 }, scene)
  screen.parent = g
  screen.position.z = 0.3
  screen.material = mat(scene, 0xf39c12)
  makeTerminal(scene, g, 0.9, 0, 0, 'input')
  makeTerminal(scene, g, -0.9, 0, 0, 'output')
  return g
}