// ============================================================
// src/scene/SceneManager.ts
// Inicialización y ciclo de render de Three.js.
// Exporta una clase para que sea fácil reemplazarla por Babylon.js
// ============================================================

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class SceneManager {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public controls: OrbitControls
  public raycaster: THREE.Raycaster
  public mouse: THREE.Vector2

  private animationId = 0
  private onFrameCallbacks: Array<() => void> = []

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    // ── Escena ───────────────────────────────────────────────
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1d1d1f)

    // ── Cámara ───────────────────────────────────────────────
    const aspect = container.clientWidth / container.clientHeight
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
    this.camera.position.set(15, 15, 15)

    // ── Renderer ─────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // ── OrbitControls ────────────────────────────────────────
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 5
    this.controls.maxDistance = 50

    // ── Luces ────────────────────────────────────────────────
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(10, 20, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    this.scene.add(mainLight)

    // ── Grid ─────────────────────────────────────────────────
    const grid = new THREE.GridHelper(40, 40, 0x007aff, 0x2c2c2e)
    const gridMat = grid.material as THREE.Material
    gridMat.opacity = 0.3
    gridMat.transparent = true
    this.scene.add(grid)

    // ── Plano de sombras ──────────────────────────────────────
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.ShadowMaterial({ opacity: 0.2 })
    )
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.receiveShadow = true
    this.scene.add(shadowPlane)

    // ── Raycaster ────────────────────────────────────────────
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    // ── Resize ───────────────────────────────────────────────
    window.addEventListener('resize', () => this.onResize(container))
  }

  /** Agregar callback que se ejecuta en cada frame */
  onFrame(callback: () => void): void {
    this.onFrameCallbacks.push(callback)
  }

  /** Iniciar loop de animación */
  start(): void {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop)
      this.controls.update()
      this.onFrameCallbacks.forEach(cb => cb())
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  /** Detener loop */
  stop(): void {
    cancelAnimationFrame(this.animationId)
  }

  /** Posicionar cámara en una vista predefinida */
  setView(view: 'perspective' | 'top' | 'front'): void {
    switch (view) {
      case 'top':   this.camera.position.set(0, 30, 0); break
      case 'front': this.camera.position.set(0, 5, 25); break
      default:      this.camera.position.set(15, 15, 15); this.controls.reset(); break
    }
    this.camera.lookAt(0, 0, 0)
  }

  /** Actualizar mouse normalizado desde un evento */
  updateMouseFromEvent(event: MouseEvent, element: HTMLElement): void {
    const rect = element.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  private onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(container.clientWidth, container.clientHeight)
  }
}
