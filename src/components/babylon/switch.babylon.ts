import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createSwitchBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('switch', scene)
  const base = MeshBuilder.CreateBox('switch-base', { width: 2, height: 0.4, depth: 0.6 }, scene)
  base.parent = g
  base.material = mat(scene, 0x7f8c8d)
  const lever = MeshBuilder.CreateBox('switch-lever', { width: 0.3, height: 0.8, depth: 0.3 }, scene)
  lever.parent = g
  lever.position.y = 0.5
  lever.material = mat(scene, 0x2c3e50)
  lever.metadata = { isSwitchLever: true }
  makeTerminal(scene, g, 1.1, 0, 0, 'input')
  makeTerminal(scene, g, -1.1, 0, 0, 'output')
  return g
}