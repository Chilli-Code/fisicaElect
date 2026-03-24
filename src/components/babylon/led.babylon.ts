import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createLEDBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('led', scene)
  const body = MeshBuilder.CreateSphere('led-body', { diameter: 1 }, scene)
  body.parent = g
  const ledMat = new StandardMaterial('led-mat', scene)
  ledMat.diffuseColor = new Color3(1, 0.27, 0.27)
  ledMat.emissiveColor = new Color3(0.5, 0, 0)
  body.material = ledMat
  const base = MeshBuilder.CreateCylinder('led-base', { height: 0.4, diameter: 0.6 }, scene)
  base.parent = g
  base.position.y = -0.6
  base.material = mat(scene, 0x333333)
  makeTerminal(scene, g, 0, -1, 0, 'positive')
  makeTerminal(scene, g, 0.3, -1, 0, 'negative')
  return g
}