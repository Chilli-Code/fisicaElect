// ============================================================
// src/components/diode.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createDiode3D(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 12), mat(0x34495e))
  body.rotation.z = Math.PI / 2
  body.castShadow = true
  g.add(body)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.15, 12), mat(0xe74c3c))
  band.rotation.z = Math.PI / 2
  band.position.x = 0.4
  g.add(band)
  makeTerminal(g,  0.8, 0, 0, 'input')
  makeTerminal(g, -0.8, 0, 0, 'output')
  return g
}
