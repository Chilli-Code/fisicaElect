// ============================================================
// src/components/battery.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createBattery3D(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2, 16), mat(0x2ecc71))
  body.castShadow = true
  g.add(body)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16), mat(0xf1c40f))
  cap.position.y = 1.1
  g.add(cap)
  makeTerminal(g,  0, 1.2, 0, 'positive')
  makeTerminal(g,  0, -1.1, 0, 'negative')
  return g
}
