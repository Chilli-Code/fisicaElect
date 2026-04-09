// ============================================================
// src/core/babylon-history.ts
// Undo/Redo para Babylon.js - MISMA LÓGICA QUE PC
// ============================================================

import type { AppState } from '@core/types'
import { emit, AppEvents } from '@core/events'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'


// Snapshot ligero (solo datos, sin meshes 3D)
export interface BabylonSnapshot {
  components: Array<{
    id: string
    type: string
    position: { x: number; z: number }
    value: number
  }>
  wires: Array<{
    id: string
    startComp: string
    startTerm: string
    endComp: string
    endTerm: string
    baseColor: number
  }>
  idCounter: number
  action: string
  timestamp: number
}

// Interface para el historial de Babylon (no en types.ts para no afectar PC)
interface BabylonHistory {
  history: BabylonSnapshot[]
  historyIndex: number
  maxSteps: number
}

/**
 * Inicializa el historial si no existe
 */
function ensureHistory(state: AppState): void {
  if (!(state as any).babylonHistory) {
    (state as any).babylonHistory = {
      history: [],
      historyIndex: -1,
      maxSteps: 50,
    }
  }
}

/**
 * Obtiene el historial de Babylon de forma segura
 */
function getBabylonHistory(state: AppState): BabylonHistory {
  return (state as any).babylonHistory as BabylonHistory
}

/**
 * Guarda un snapshot del estado actual (igual que en PC)
 */
export function saveBabylonSnapshot(state: AppState, action: string): void {
  ensureHistory(state)
  const h = getBabylonHistory(state)
   console.log(`📸 [${action}]`, state.components.map(c => 
    `${c.type}(${c.position.x.toFixed(1)}, ${c.position.z.toFixed(1)})`
  ).join(' | '))
  
  if (h.historyIndex < h.history.length - 1) {
    h.history = h.history.slice(0, h.historyIndex + 1)
  }
  
  const snapshot: BabylonSnapshot = {
    components: state.components.map(c => ({
      id: c.id,
      type: c.type,
      position: { ...c.position },
      value: c.value,
    })),
    wires: state.wires.map(w => ({
      id: w.id,
      startComp: w.startComp,
      startTerm: w.startTerm,
      endComp: w.endComp,
      endTerm: w.endTerm,
      baseColor: w.baseColor,
    })),
    idCounter: state.idCounter,
    action,
    timestamp: Date.now(),
  }
  
  h.history.push(snapshot)
  h.historyIndex = h.history.length - 1
  
  if (h.history.length > h.maxSteps) {
    h.history.shift()
    if (h.historyIndex > 0) h.historyIndex--
  }
  
  emit(AppEvents.STATE_CHANGED, null)
}

/**
 * Obtiene el snapshot para deshacer (retrocede el índice)
 */
export function getBabylonUndoSnapshot(state: AppState): BabylonSnapshot | null {
  ensureHistory(state)
  const h = getBabylonHistory(state)
  
  if (h.historyIndex > 0) {
    h.historyIndex--
    const snapshot = h.history[h.historyIndex]
    return snapshot !== undefined ? snapshot : null  // ✅ Verificar undefined
  }
  return null
}

/**
 * Obtiene el snapshot para rehacer (avanza el índice)
 */
export function getBabylonRedoSnapshot(state: AppState): BabylonSnapshot | null {
  ensureHistory(state)
  const h = getBabylonHistory(state)
  
  if (h.historyIndex < h.history.length - 1) {
    h.historyIndex++
    const snapshot = h.history[h.historyIndex]
    return snapshot !== undefined ? snapshot : null  // ✅ Verificar undefined
  }
  return null
}

/**
 * Reconstruye la escena 3D desde un snapshot (igual que en PC)
 */
export function rebuildSceneFromBabylonSnapshot(
  snapshot: BabylonSnapshot,
  cm: any,
  wm: any,
  scene: any
): void {
  // 1. Limpiar escena
  cm?.clear()
  wm?.clear()

  if (cm?.state) {
    cm.state.idCounter = snapshot.idCounter
  }

  // 2. Crear componentes en sus posiciones correctas
  snapshot.components.forEach((c: any) => {
    const comp = cm?.add(c.type, c.position.x, c.position.z, c.id)
    if (!comp) return

    comp.value = c.value
    comp.position.x = c.position.x
    comp.position.z = c.position.z

    // Forzar posición en el mesh 3D
    const node = scene?.getNodeByName?.(comp.id) as any
    if (node) {
      node.position.x = c.position.x
      node.position.y = 1
      node.position.z = c.position.z
    }
  })

  // 3. Esperar un frame para que Babylon actualice las posiciones absolutas
  //    ANTES de crear los cables
  setTimeout(() => {
    snapshot.wires.forEach((w: any) => {
      // Usar terminales reales del estado (no objetos ficticios)
      const startComp = cm?.state?.components?.find((c: any) => c.id === w.startComp)
      const endComp = cm?.state?.components?.find((c: any) => c.id === w.endComp)
      if (!startComp || !endComp) return

      const startTerm = startComp.terminals?.find((t: any) => t.type === w.startTerm)
      const endTerm = endComp.terminals?.find((t: any) => t.type === w.endTerm)
      if (!startTerm || !endTerm) return

      const colorHex = '#' + (w.baseColor ?? 0x888888).toString(16).padStart(6, '0')
      wm.create(startComp, startTerm, endComp, endTerm, { color: colorHex })
    })

    emit(AppEvents.STATE_CHANGED, null)
  }, 50)
}
/**
 * Helpers para UI
 */
export function canUndoBabylon(state: AppState): boolean {
  ensureHistory(state)
  const h = getBabylonHistory(state)
  return h.historyIndex > 0
}

export function canRedoBabylon(state: AppState): boolean {
  ensureHistory(state)
  const h = getBabylonHistory(state)
  return h.historyIndex < h.history.length - 1
}