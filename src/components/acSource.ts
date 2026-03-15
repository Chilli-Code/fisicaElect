// ============================================================
// src/components/acSource.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createACSource3D(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.2, 8, 24), mat(0xe74c3c))
  body.castShadow = true
  g.add(body)
  makeTerminal(g,  0.8, 0, 0, 'positive')
  makeTerminal(g, -0.8, 0, 0, 'negative')
  return g
}
