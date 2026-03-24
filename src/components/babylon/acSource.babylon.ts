import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createACSourceBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('ac-source', scene)
  const body = MeshBuilder.CreateTorus('ac-body', { diameter: 1.2, thickness: 0.4 }, scene)
  body.parent = g
    body.rotation.x = Math.PI / 2
  body.material = mat(scene, 0xe74c3c)
  makeTerminal(scene, g, 0.8, 0, 0, 'positive')
  makeTerminal(scene, g, -0.8, 0, 0, 'negative')
  return g
}