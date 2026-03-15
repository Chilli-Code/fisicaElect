// ============================================================
// src/components/_factory.ts
// Helpers compartidos para construir meshes de componentes.
// ============================================================

import * as THREE from 'three'

/** Crea un terminal (esfera pequeña) en la posición dada */
export function makeTerminal(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  terminalType: string,
): void {
  const geo = new THREE.SphereGeometry(0.12, 8, 8)
  const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(x, y, z)
  mesh.userData['isTerminal'] = true
  mesh.userData['terminalType'] = terminalType
  parent.add(mesh)
}

/** Material estándar con color */
export function mat(color: number, metalness = 0.3, roughness = 0.6): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness })
}

/** Grupo raíz con castShadow en todos los hijos */
export function makeGroup(): THREE.Group {
  const g = new THREE.Group()
  g.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  return g
}
