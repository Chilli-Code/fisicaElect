// ============================================================
// src/components/led.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal } from './_factory'

export function createLED3D(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.9,
    }),
  )
  body.castShadow = true
  g.add(body)
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.4, 12),
    new THREE.MeshStandardMaterial({ color: 0x333333 }),
  )
  base.position.y = -0.6
  g.add(base)
  makeTerminal(g,  0, -1, 0, 'positive')
  makeTerminal(g,  0.3, -1, 0, 'negative')
  return g
}
