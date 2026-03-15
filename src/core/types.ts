// ============================================================
// src/core/types.ts
// Tipos centrales del simulador. Un solo lugar de verdad.
// ============================================================

import type * as THREE from 'three'

// ── Tipos de componentes disponibles ─────────────────────────
export type ComponentType =
  | 'battery'
  | 'ac-source'
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'voltmeter'
  | 'ammeter'
  | 'led'
  | 'switch'
  | 'diode'
  | 'transistor'

export type TerminalType = 'positive' | 'negative' | 'input' | 'output'

export type Tool = 'select' | 'wire' | 'move'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export type CircuitStatus = 'Abierto' | 'Cerrado' | 'Error'

// ── Terminal de un componente ────────────────────────────────
export interface Terminal {
  type: TerminalType
  position: THREE.Vector3
  mesh: THREE.Object3D
}

// ── Componente en escena ─────────────────────────────────────
export interface CircuitComponent {
  id: string
  type: ComponentType
  name: string
  value: number
  mesh: THREE.Object3D
  position: { x: number; z: number }
  terminals: Terminal[]
  // Estado específico por tipo
  isOn?: boolean        // switch
  isReversed?: boolean  // diode / led
}

// ── Cable entre dos terminales ───────────────────────────────
export interface Wire {
  id: string
  startComp: string
  startTerm: TerminalType
  endComp: string
  endTerm: TerminalType
  mesh: THREE.Line
  startTerminal: Terminal
  endTerminal: Terminal
  baseColor: number
  wireLabel: string
}

// ── Snapshot para historial (undo/redo) ──────────────────────
export interface StateSnapshot {
  action: string
  timestamp: number
  idCounter: number
  components: SerializedComponent[]
  wires: SerializedWire[]
}

export interface SerializedComponent {
  id: string
  type: ComponentType
  name: string
  value: number
  position: { x: number; z: number }
}

export interface SerializedWire {
  id: string
  startComp: string
  startTerm: TerminalType
  endComp: string
  endTerm: TerminalType
  baseColor: number
}

// ── Estado global de la app ──────────────────────────────────
export interface AppState {
  components: CircuitComponent[]
  wires: Wire[]
  selected: CircuitComponent | null
  currentTool: Tool
  wireStart: { component: CircuitComponent; terminal: Terminal } | null
  isSimulating: boolean
  idCounter: number
  history: StateSnapshot[]
  historyIndex: number
  maxHistory: number
}

// ── Métricas calculadas del circuito ─────────────────────────
export interface CircuitMetrics {
  voltage: string
  current: string
  resistance: string
  power: string
  status: CircuitStatus
  hasCurrent: boolean
}

// ── Error de validación ──────────────────────────────────────
export type ErrorSeverity = 'error' | 'warning' | 'info'

export interface CircuitError {
  message: string
  description: string
  solution: string
  severity: ErrorSeverity
  componentIds?: string[]
}

// ── Plantilla de componente ──────────────────────────────────
export interface ComponentTemplate {
  name: string
  defaultValue: number
  unit: string
  create3D: () => THREE.Object3D
}

export type ComponentTemplateMap = Record<ComponentType, ComponentTemplate>

// ── Evento de notificación ───────────────────────────────────
export interface NotificationEvent {
  type: NotificationType
  title: string
  message: string
}
