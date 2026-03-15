// ============================================================
// src/components/capacitor.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createCapacitor3D(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16), mat(0x3498db))
  body.castShadow = true
  g.add(body)
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.61, 0.61, 0.3, 16), mat(0x1a252f))
  stripe.position.y = 0.3
  g.add(stripe)
  makeTerminal(g,  0, 0.7, 0, 'positive')
  makeTerminal(g,  0, -0.7, 0, 'negative')
  return g
}
