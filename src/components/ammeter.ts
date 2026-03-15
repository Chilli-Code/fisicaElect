// ============================================================
// src/components/ammeter.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createAmmeter3D(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 0.5), mat(0xe67e22))
  body.castShadow = true
  g.add(body)
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.1), mat(0xf39c12, 0, 0.2))
  screen.position.z = 0.3
  g.add(screen)
  makeTerminal(g,  0.9, 0, 0, 'input')
  makeTerminal(g, -0.9, 0, 0, 'output')
  return g
}
