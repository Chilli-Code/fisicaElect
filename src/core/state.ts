// ============================================================
// src/core/state.ts
// Estado global. Factory function en lugar de singleton mutable.
// ============================================================

import type { AppState } from './types'

export function createInitialState(): AppState {
  return {
    components: [],
    wires: [],
    selected: null,
    currentTool: 'select',
    wireStart: null,
    isSimulating: false,
    idCounter: 0,
    history: [],
    historyIndex: -1,
    maxHistory: 50,
  }
}

// Estado único de la aplicación — exportado como referencia mutable.
// En el futuro se puede reemplazar por Zustand / reactive store sin
// cambiar la firma pública.
export const state: AppState = createInitialState()
