import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { mat, makeTerminal } from './_factory.babylon'

export function createInductorBabylon(scene: Scene): TransformNode {
  const g = new TransformNode('inductor', scene)
  for (let i = 0; i < 5; i++) {
    const coil = MeshBuilder.CreateTorus(`coil-${i}`, { diameter: 0.7, thickness: 0.2 }, scene)
    coil.parent = g
    coil.position.x = -0.8 + i * 0.4
    coil.rotation.z = Math.PI / 2
    coil.material = mat(scene, 0x95a5a6)
  }
  makeTerminal(scene, g, 1.2, 0, 0, 'input')
  makeTerminal(scene, g, -1.2, 0, 0, 'output')
  
  return g
}