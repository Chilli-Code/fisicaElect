import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createTransistorBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('transistor', scene)
  const body = MeshBuilder.CreateCylinder('trans-body', { height: 0.8, diameter: 1 }, scene)
  body.parent = g
  body.material = mat(scene, 0x2c3e50)
  const pins: [number, number, string][] = [
    [-0.3, -0.6, 'input'],
    [0,    -0.6, 'output'],
    [0.3,  -0.6, 'negative'],
  ]
  pins.forEach(([x, y, type]) => {
    const pin = MeshBuilder.CreateCylinder(`pin-${type}`, { height: 0.4, diameter: 0.1 }, scene)
    pin.parent = g
    pin.position.set(x, y, 0)
    pin.material = mat(scene, 0xbdc3c7)
    makeTerminal(scene, g, x, y - 0.3, 0, type)
  })
  return g
}