// ============================================================
// src/utils/babylon-animations.ts
// Efectos visuales para Babylon.js - PARTÍCULAS REALES
// ============================================================

import { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'

/**
 * Helper: Crear textura de partícula circular con gradiente radial
 */
function createParticleTexture(scene: Scene): DynamicTexture {
  const texture = new DynamicTexture('particleTexture', { width: 64, height: 64 }, scene, false)
  const ctx = texture.getContext()
  
  // Gradiente radial: centro blanco → borde transparente
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(32, 32, 32, 0, Math.PI * 2)
  ctx.fill()
  
  texture.update()
  return texture
}

// Cache de textura para reutilizar
let _particleTexture: DynamicTexture | null = null

/**
 * Efecto de chispas doradas al conectar un cable exitosamente
 */
export function sparkEffect(scene: Scene, position: Vector3): void {

  // Crear textura si no existe
  if (!_particleTexture) {
    _particleTexture = createParticleTexture(scene)
  }
  
  const particleSystem = new ParticleSystem('sparks', 50, scene)
  
  // ✅ Usar textura generada
  particleSystem.particleTexture = _particleTexture
  
  // Emisor en la posición del terminal
  particleSystem.emitter = position
  particleSystem.minEmitBox = new Vector3(-0.05, 0, -0.05)
  particleSystem.maxEmitBox = new Vector3(0.05, 0.2, 0.05)
  
  // ✅ Colores: dorado brillante → transparente
  particleSystem.color1 = new Color4(1, 0.95, 0.4, 1)
  particleSystem.color2 = new Color4(1, 0.8, 0.2, 0.6)
  particleSystem.colorDead = new Color4(0, 0, 0, 0)
  
  // ✅ Tamaño y duración
  particleSystem.minSize = 0.08
  particleSystem.maxSize = 0.18
  particleSystem.minLifeTime = 0.3
  particleSystem.maxLifeTime = 0.6
  particleSystem.emitRate = 250
  particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE  // ✅ Aditivo = brillante
  
  // ✅ Dirección y gravedad
  particleSystem.gravity = new Vector3(0, -0.2, 0)
  particleSystem.direction1 = new Vector3(-0.25, 0.5, -0.25)
  particleSystem.direction2 = new Vector3(0.25, 0.8, 0.25)
  particleSystem.minAngularSpeed = 0
  particleSystem.maxAngularSpeed = Math.PI * 3
  
  // ✅ Start
  particleSystem.start()
  
  // ✅ Auto-limpieza
  setTimeout(() => {
    particleSystem.stop()
    setTimeout(() => {
      particleSystem.dispose()
    }, 700)
  }, 300)
}

/**
 * Efecto de "error" (chispas rojas) cuando la conexión es inválida
 */
export function errorEffect(scene: Scene, position: Vector3): void {
  if (!_particleTexture) {
    _particleTexture = createParticleTexture(scene)
  }
  
  const particleSystem = new ParticleSystem('error-sparks', 45, scene)
  
  particleSystem.particleTexture = _particleTexture
  particleSystem.emitter = position
  particleSystem.minEmitBox = new Vector3(-0.08, 0, -0.08)
  particleSystem.maxEmitBox = new Vector3(0.08, 0.25, 0.08)
  
  // ✅ Colores: rojo brillante → transparente
  particleSystem.color1 = new Color4(1, 0.5, 0.5, 1)
  particleSystem.color2 = new Color4(1, 0.2, 0.2, 0.5)
  particleSystem.colorDead = new Color4(0, 0, 0, 0)
  
  // ✅ Más explosivo
  particleSystem.minSize = 0.1
  particleSystem.maxSize = 0.22
  particleSystem.minLifeTime = 0.35
  particleSystem.maxLifeTime = 0.7
  particleSystem.emitRate = 200
  particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE
  
  // ✅ Dirección más dispersa
  particleSystem.gravity = new Vector3(0, -0.1, 0)
  particleSystem.direction1 = new Vector3(-0.4, 0.4, -0.4)
  particleSystem.direction2 = new Vector3(0.4, 0.7, 0.4)
  particleSystem.minAngularSpeed = -Math.PI * 2
  particleSystem.maxAngularSpeed = Math.PI * 2
  
  particleSystem.start()
  
  setTimeout(() => {
    particleSystem.stop()
    setTimeout(() => {
      particleSystem.dispose()
    }, 800)
  }, 400)
}

/**
 * Pulso de selección en un componente (escalado suave)
 */
export function pulseComponent(mesh: any, duration: number = 300): void {
  if (!mesh?.scaling) return
  
  const originalScale = mesh.scaling.clone()
  const targetScale = originalScale.scale(1.15)
  const startTime = Date.now()
  
  const renderLoop = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    const eased = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2
    
    if (mesh.scaling) {
      mesh.scaling = Vector3.Lerp(originalScale, targetScale, eased)
    }
    
    if (progress < 1) {
      requestAnimationFrame(renderLoop)
    } else if (mesh.scaling) {
      mesh.scaling = originalScale
    }
  }
  
  requestAnimationFrame(renderLoop)
}

/**
 * Animación de flujo de corriente en un cable (brillo pulsante)
 */
export function animateWireFlow(mesh: any, time: number, isActive: boolean): void {
  const mat = mesh?.material as StandardMaterial
  if (!mat) return
  
  if (isActive) {
    const pulse = 0.7 + Math.sin(time * 8) * 0.3
    mat.emissiveColor = new Color3(1, 0.85, 0.2).scale(pulse)
    mat.diffuseColor = new Color3(1, 0.9, 0.4)
  }
}

/**
 * Efecto de "shake" cuando hay error (vibración sutil)
 */
export function shakeComponent(mesh: any, intensity: number = 0.05, duration: number = 200): void {
  if (!mesh?.position) return
  
  const originalPosition = mesh.position.clone()
  const startTime = Date.now()
  
  const renderLoop = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    if (progress < 1 && mesh.position) {
      const shakeFactor = (1 - progress) * intensity
      mesh.position.x = originalPosition.x + (Math.random() - 0.5) * shakeFactor
      mesh.position.z = originalPosition.z + (Math.random() - 0.5) * shakeFactor
      requestAnimationFrame(renderLoop)
    } else if (mesh.position) {
      mesh.position = originalPosition
    }
  }
  
  requestAnimationFrame(renderLoop)
}
/**
 * Animación de LED encendido/apagado durante simulación
 */
export function animateLED(mesh: any, hasCurrent: boolean, time: number): void {
  if (!mesh) return

  mesh.getChildMeshes?.().forEach((child: any) => {
    if (child.metadata?.isTerminal) return
    const mat = child.material as StandardMaterial
    if (!mat) return

    if (hasCurrent) {
      const pulse = 0.7 + Math.sin(time * 8) * 0.3
      mat.emissiveColor = new Color3(1, 0.3, 0.3).scale(pulse)
      mat.diffuseColor = new Color3(0.5, 0, 0)
      mat.disableLighting = true
    } else {
      // ✅ Apagado real
      mat.emissiveColor = new Color3(0, 0, 0)
      mat.diffuseColor = new Color3(0.3, 0, 0)
      mat.disableLighting = false  // ← recibe luz, se ve apagado
    }
  })
}