// ============================================================
// src/scene/BabylonSceneManager.ts
// Setup de Babylon.js para mobile — reemplaza SceneManager.ts
// ============================================================

import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color4 } from '@babylonjs/core/Maths/math.color'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial'
import * as THREE from 'three'

export class BabylonSceneManager {
  public engine: Engine
  public scene: Scene
  public camera: ArcRotateCamera
syncThreeObject(obj: THREE.Object3D): void {
  // por ahora solo log — sincronización real viene después
  console.log('sync', obj.type)
}
  private onFrameCallbacks: Array<() => void> = []

  constructor(canvas: HTMLCanvasElement) {
      canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  this.engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    adaptToDeviceRatio: true,  // ← agrega esto
    
  })
this.engine.inputElement = canvas

// Forzar tamaño correcto
setTimeout(() => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  this.engine.resize()
}, 50)
    this.scene = new Scene(this.engine)
    this.scene.clearColor = new Color4(0.11, 0.11, 0.12, 1)

    // Cámara con touch support
this.camera = new ArcRotateCamera(
  'camera',
  -Math.PI / 2,
  Math.PI / 4,   // ← 45° — igual que Three.js
  25,            // ← un poco más lejos
  Vector3.Zero(),
  this.scene,
)
this.camera.attachControl(canvas, true)
this.camera.lowerRadiusLimit = 5
this.camera.upperRadiusLimit = 50
this.camera.lowerBetaLimit = 0.1        // ← no puede ir por debajo del suelo
this.camera.upperBetaLimit = Math.PI / 2.2  // ← máximo 80° de inclinación
this.camera.pinchPrecision = 50
this.camera.panningSensibility = 100
    // Luces
new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene).intensity = 0.8
const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), this.scene)
dir.intensity = 1.2

    // Grid
// PON esto en su lugar:
const ground = MeshBuilder.CreateGround('grid', { width: 60, height: 60 }, this.scene)
const gridMat = new GridMaterial('gridMat', this.scene)
gridMat.majorUnitFrequency = 5
gridMat.minorUnitVisibility = 0.3
gridMat.gridRatio = 1
gridMat.lineColor = new Color3(0, 0.48, 1)
gridMat.mainColor = new Color3(0.11, 0.11, 0.12)
gridMat.opacity = 0.5
ground.material = gridMat

    // Resize automático
    window.addEventListener('resize', () => this.engine.resize())
  }

  onFrame(cb: () => void): void {
    this.onFrameCallbacks.push(cb)
  }

start(): void {
  this.engine.runRenderLoop(() => {
    this.onFrameCallbacks.forEach(cb => cb())
    this.scene.render()
  })
  
  // Forzar resize al iniciar
  setTimeout(() => this.engine.resize(), 100)
  setTimeout(() => this.engine.resize(), 500)
}

  stop(): void {
    this.engine.stopRenderLoop()
  }

  setView(view: 'perspective' | 'top' | 'front'): void {
    if (view === 'top') {
      this.camera.alpha = -Math.PI / 2
      this.camera.beta = 0.01
    } else if (view === 'front') {
      this.camera.alpha = -Math.PI / 2
      this.camera.beta = Math.PI / 2
    } else {
      this.camera.alpha = -Math.PI / 2
      this.camera.beta = Math.PI / 3
      this.camera.radius = 20
    }
  }
}