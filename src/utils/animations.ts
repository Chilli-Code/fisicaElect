// ============================================================
// src/utils/animations.ts
// Efectos visuales. Sin dependencias de estado global.
// ============================================================

import * as THREE from 'three'
import type { Wire, CircuitComponent } from '@core/types'

/** Efecto de chispas al conectar un cable */
export function sparkEffect(scene: THREE.Scene, position: THREE.Vector3): void {
  const particles: THREE.Mesh[] = []
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    )
    p.position.copy(position)
    scene.add(p)
    particles.push(p)
  }

  const startTime = Date.now()
  const velocities = particles.map(() => new THREE.Vector3(
    (Math.random() - 0.5) * 0.3,
    Math.random() * 0.3,
    (Math.random() - 0.5) * 0.3,
  ))

  const tick = () => {
    const elapsed = (Date.now() - startTime) / 1000
    if (elapsed > 0.5) {
      particles.forEach(p => scene.remove(p))
      return
    }
    particles.forEach((p, i) => {
      p.position.addScaledVector(velocities[i]!, 0.05)
      ;(p.material as THREE.MeshBasicMaterial).opacity = 1 - elapsed * 2
    })
    requestAnimationFrame(tick)
  }
  tick()
}

/** Pulso de selección en un componente */
export function pulseComponent(component: CircuitComponent): void {
  const mesh = component.mesh
  const original = mesh.scale.clone()
  const startTime = Date.now()

  const tick = () => {
    const elapsed = (Date.now() - startTime) / 1000
    if (elapsed > 0.3) {
      mesh.scale.copy(original)
      return
    }
    const scale = 1 + Math.sin(elapsed * Math.PI * 10) * 0.05
    mesh.scale.set(scale, scale, scale)
    requestAnimationFrame(tick)
  }
  tick()
}

/** Animación de flujo de corriente en un cable */
export function animateWireFlow(wire: Wire, time: number): void {
  const mat = wire.mesh.material as THREE.LineBasicMaterial
  mat.opacity = 0.7 + Math.sin(time * 5) * 0.3
}
