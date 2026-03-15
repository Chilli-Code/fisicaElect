// ============================================================
// src/components/resistor.ts
// ============================================================
import * as THREE from 'three'
import { makeTerminal, mat } from './_factory'

export function createResistor3D(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.5), mat(0xf39c12))
  body.castShadow = true
  g.add(body)
  // Bandas de colores
  const bandColors = [0xc0392b, 0xf1c40f, 0x27ae60]
  bandColors.forEach((color, i) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.52, 0.52), mat(color))
    band.position.x = -0.5 + i * 0.5
    g.add(band)
  })
  makeTerminal(g,  1.1, 0, 0, 'input')
  makeTerminal(g, -1.1, 0, 0, 'output')
  return g
}
