// ============================================================
// src/core/events.ts
// Bus de eventos liviano. Desacopla UI ↔ lógica.
// Fácilmente reemplazable por mitt / EventEmitter en el futuro.
// ============================================================

type Handler<T = unknown> = (payload: T) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners = new Map<string, Set<Handler<any>>>()

export function on<T>(event: string, handler: Handler<T>): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event)!.add(handler)
  // Retorna función de cleanup
  return () => off(event, handler)
}

export function off<T>(event: string, handler: Handler<T>): void {
  listeners.get(event)?.delete(handler)
}

export function emit<T>(event: string, payload: T): void {
  listeners.get(event)?.forEach(h => h(payload))
}

// ── Eventos tipados de la app ─────────────────────────────────
export const AppEvents = {
  STATE_CHANGED:      'state:changed',       // Cualquier cambio de estado
  COMPONENT_ADDED:    'component:added',
  COMPONENT_DELETED:  'component:deleted',
  WIRE_CREATED:       'wire:created',
  WIRE_DELETED:       'wire:deleted',
  SIMULATE_TOGGLE:    'simulate:toggle',
  HISTORY_CHANGED:    'history:changed',
  NOTIFICATION:       'ui:notification',
  TOOL_CHANGED:       'tool:changed',
  SELECTION_CHANGED:  'selection:changed',
} as const
