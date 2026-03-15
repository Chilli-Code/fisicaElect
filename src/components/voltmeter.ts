// ============================================================
// src/components/voltmeter.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createVoltmeter3D(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 0.5), mat(0x8e44ad))
  body.castShadow = true
  g.add(body)
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.1), mat(0x1abc9c, 0, 0.2))
  screen.position.z = 0.3
  g.add(screen)
  makeTerminal(g,  0.9, 0, 0, 'positive')
  makeTerminal(g, -0.9, 0, 0, 'negative')
  return g
}
