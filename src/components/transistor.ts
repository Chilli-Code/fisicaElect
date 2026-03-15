// ============================================================
// src/components/transistor.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createTransistor3D(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 16), mat(0x2c3e50))
  body.castShadow = true
  g.add(body)
  // 3 pines
  const pinPositions: [number, number, string][] = [
    [-0.3, -0.6, 'input'],
    [ 0,   -0.6, 'output'],
    [ 0.3, -0.6, 'negative'],
  ]
  pinPositions.forEach(([x, y, type]) => {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), mat(0xbdc3c7))
    pin.position.set(x, y, 0)
    g.add(pin)
    makeTerminal(g, x, y - 0.3, 0, type)
  })
  return g
}
