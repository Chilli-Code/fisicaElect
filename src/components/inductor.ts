// ============================================================
// src/components/inductor.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createInductor3D(): THREE.Object3D {
  const g = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 8, 16), mat(0x95a5a6))
    coil.position.x = -0.8 + i * 0.4
    coil.rotation.y = Math.PI / 2
    coil.castShadow = true
    g.add(coil)
  }
  makeTerminal(g,  1.2, 0, 0, 'input')
  makeTerminal(g, -1.2, 0, 0, 'output')
  return g
}
