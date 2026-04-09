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
import { on } from '@core/events'  // ✅ AGREGAR ESTE IMPORT
import type { BabylonComponentManager } from '@scene/BabylonComponentManager'
import type { BabylonWireManager } from '@scene/BabylonWireManager'

export class BabylonSceneManager {
  public engine: Engine
  public scene: Scene
  public camera: ArcRotateCamera
    public componentManager?: BabylonComponentManager  // ✅ Agregar si no existe
  public wireManager?: BabylonWireManager   

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
window.addEventListener('resize', () => {
  this.engine.resize()
  const canvas = this.engine.getRenderingCanvas()
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    // ✅ Re-adjuntar control de cámara para que el touch funcione
    this.camera.detachControl()
    this.camera.attachControl(canvas, true)
  }
})

    this.setupHistoryListener()
    
  }


  /**
   * Configura el listener para restaurar estado desde undo/redo
   */
  private setupHistoryListener(): void {
    // Escuchar evento de restauración de historial
    document.addEventListener('babylon:history:restored', (e: any) => {
      const data = e.detail || {}
      if (data.components || data.wires) {
        this.rebuildFromSnapshot(data.components, data.wires)
      }
    })
  }
public forceResize(): void {
  const canvas = this.engine.getRenderingCanvas()
  if (canvas) {
    canvas.width = window.innerWidth * window.devicePixelRatio
    canvas.height = window.innerHeight * window.devicePixelRatio
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
  }
  this.engine.resize()
  // Re-adjuntar cámara para recalibrar coordenadas
  const c = this.engine.getRenderingCanvas()!
  this.camera.detachControl()
  this.camera.attachControl(c, true)
}

/**
 * Reconstruye la escena desde un snapshot de undo/redo
 */
private rebuildFromSnapshot(components: any[], wires: any[]): void {
  // 1. Limpiar escena actual (componentes y cables)
  if (this.componentManager) {
    this.componentManager.clear()
  }
  if (this.wireManager) {
    this.wireManager.clear()
  }
  
  // 2. Restaurar componentes
  components?.forEach((c: any) => {
    if (this.componentManager) {
      const comp = this.componentManager.add(c.type, c.x, c.z)
      if (comp) {
        comp.value = c.value
        // ✅ Ajustar posición exacta (cast a any para acceder a position)
        const node = this.scene.getNodeByName(comp.id) as any
        if (node) {
          node.position = new Vector3(c.x, 1, c.z)
        }
      }
    }
  })
  
  // 3. Restaurar cables (recrear desde los componentes restaurados)
  wires?.forEach((w: any) => {
    if (this.wireManager && this.componentManager) {
      const startComp = components?.find((c: any) => c.id === w.startComp)
      const endComp = components?.find((c: any) => c.id === w.endComp)
      
      if (startComp && endComp) {
        // ✅ Cast a any para acceder a getChildMeshes
        const startNode = this.scene.getNodeByName(startComp.id) as any
        const endNode = this.scene.getNodeByName(endComp.id) as any
        
        if (startNode && endNode) {
          let startTermMesh: any = null
          let endTermMesh: any = null
          
          startNode.getChildMeshes?.().forEach((mesh: any) => {
            if (mesh.metadata?.isTerminal && mesh.metadata.terminalType === w.startTerm) {
              startTermMesh = mesh
            }
          })
          endNode.getChildMeshes?.().forEach((mesh: any) => {
            if (mesh.metadata?.isTerminal && mesh.metadata.terminalType === w.endTerm) {
              endTermMesh = mesh
            }
          })
          
          if (startTermMesh && endTermMesh) {
            const tempStartComp = { 
              id: w.startComp, 
              type: startComp.type, 
              terminals: [], 
              mesh: startNode,
              position: { x: startComp.x, z: startComp.z },
              name: '',
              value: 0
            }
            const tempEndComp = { 
              id: w.endComp, 
              type: endComp.type, 
              terminals: [], 
              mesh: endNode,
              position: { x: endComp.x, z: endComp.z },
              name: '',
              value: 0
            }
            const startTerm = { 
              type: w.startTerm, 
              position: new Vector3(0,0,0), 
              mesh: startTermMesh 
            }
            const endTerm = { 
              type: w.endTerm, 
              position: new Vector3(0,0,0), 
              mesh: endTermMesh 
            }
            
            this.wireManager.create(
              tempStartComp as any,
              startTerm as any,
              tempEndComp as any,
              endTerm as any,
              { color: '#' + w.baseColor.toString(16).padStart(6, '0') }
            )
          }
        }
      }
    }
  })
}
  // ← Esta es la llave de cierre de la clase


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