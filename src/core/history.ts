// ============================================================
// src/core/history.ts
// Lógica de undo / redo desacoplada del estado de Three.js
// ============================================================

import type { AppState, StateSnapshot } from './types'

export function saveSnapshot(state: AppState, actionName: string): void {
  const snapshot: StateSnapshot = {
    action: actionName,
    timestamp: Date.now(),
    idCounter: state.idCounter,
    components: state.components.map(c => ({
      id: c.id,
      type: c.type,
      name: c.name,
      value: c.value,
      position: { x: c.position.x, z: c.position.z },
    })),
    wires: state.wires.map(w => ({
      id: w.id,
      startComp: w.startComp,
      startTerm: w.startTerm,
      endComp: w.endComp,
      endTerm: w.endTerm,
      baseColor: w.baseColor,
    })),
  }

  // Si estamos en medio del historial, descartar el futuro
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1)
  }

  state.history.push(snapshot)
  state.historyIndex = state.history.length - 1

  if (state.history.length > state.maxHistory) {
    state.history.shift()
    state.historyIndex--
  }
}

export function canUndo(state: AppState): boolean {
  return state.historyIndex > 0
}

export function canRedo(state: AppState): boolean {
  return state.historyIndex < state.history.length - 1
}

export function getUndoSnapshot(state: AppState): StateSnapshot | null {
  if (!canUndo(state)) return null
  state.historyIndex--
  return state.history[state.historyIndex] ?? null
}

export function getRedoSnapshot(state: AppState): StateSnapshot | null {
  if (!canRedo(state)) return null
  state.historyIndex++
  return state.history[state.historyIndex] ?? null
}
