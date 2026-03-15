// ============================================================
// src/components/switch.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createSwitch3D(): THREE.Object3D {
  const g = new THREE.Group()
  const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.6), mat(0x7f8c8d))
  base.castShadow = true
  g.add(base)

  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), mat(0x2c3e50))
  lever.position.set(0, 0.5, 0)
  lever.userData['isSwitchLever'] = true
  lever.castShadow = true
  g.add(lever)

  makeTerminal(g,  1.1, 0, 0, 'input')
  makeTerminal(g, -1.1, 0, 0, 'output')
  return g
}
