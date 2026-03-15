// ============================================================
// src/scene/WireManager.ts
// Gestión de cables (creación, actualización, eliminación)
// ============================================================

import * as THREE from 'three'
import type { AppState, Wire, CircuitComponent, Terminal, TerminalType } from '@core/types'

function resolveWireColor(
  startComp: CircuitComponent,
  startTerm: Terminal,
  endTerm: Terminal,
): { color: number; label: string } {
  const s = startTerm.type as TerminalType
  const e = endTerm.type as TerminalType

  if ((s === 'positive' && e === 'input') || (s === 'positive' && e === 'positive'))
    return { color: 0xff0000, label: '+ Positivo (Rojo)' }

  if ((s === 'negative' && e === 'negative') || (s === 'negative' && e === 'input'))
    return { color: 0x000000, label: '- Negativo (Negro)' }

  if (s === 'output' && e === 'positive')
    return { color: 0xff8c00, label: 'Salida (Naranja)' }

  if (s === 'output' && e === 'negative')
    return { color: 0x0000cd, label: 'Retorno (Azul)' }

  if (startComp.type === 'ac-source' && s === 'negative')
    return { color: 0x1e90ff, label: 'Neutro AC (Azul)' }

  if (startComp.type === 'ac-source' && s === 'positive')
    return { color: 0x8b4513, label: 'Fase AC (Marrón)' }

  return { color: 0x808080, label: 'Cable (Gris)' }
}

function buildWireMesh(
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  color: number,
): THREE.Line {
  const midPoint = new THREE.Vector3(
    (startPos.x + endPos.x) / 2,
    Math.max(startPos.y, endPos.y) + 1,
    (startPos.z + endPos.z) / 2,
  )
  const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos)
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50))
  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: 4,
    opacity: 0.95,
    transparent: true,
  })
  return new THREE.Line(geometry, material)
}

export class WireManager {
  constructor(
    private scene: THREE.Scene,
    private state: AppState,
  ) {}

  create(
    startComp: CircuitComponent,
    startTerm: Terminal,
    endComp: CircuitComponent,
    endTerm: Terminal,
  ): Wire {
    const { color, label } = resolveWireColor(startComp, startTerm, endTerm)
    const line = buildWireMesh(startTerm.position, endTerm.position, color)
    this.scene.add(line)

    const wire: Wire = {
      id: `wire-${this.state.wires.length}`,
      startComp: startComp.id,
      startTerm: startTerm.type,
      endComp: endComp.id,
      endTerm: endTerm.type,
      mesh: line,
      startTerminal: startTerm,
      endTerminal: endTerm,
      baseColor: color,
      wireLabel: label,
    }
    this.state.wires.push(wire)
    return wire
  }

  delete(wireId: string): boolean {
    const index = this.state.wires.findIndex(w => w.id === wireId)
    if (index === -1) return false
    const [wire] = this.state.wires.splice(index, 1)
    this.scene.remove(wire!.mesh)
    return true
  }

  /** Recalcular geometría de todos los cables (después de mover componentes) */
  updateAll(hasCurrent: boolean, isSimulating: boolean): void {
    this.state.wires.forEach(wire => {
      const start = wire.startTerminal.position
      const end = wire.endTerminal.position
      start.setFromMatrixPosition(wire.startTerminal.mesh.matrixWorld)
      end.setFromMatrixPosition(wire.endTerminal.mesh.matrixWorld)

      const mid = new THREE.Vector3(
        (start.x + end.x) / 2,
        Math.max(start.y, end.y) + 1,
        (start.z + end.z) / 2,
      )
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      wire.mesh.geometry.setFromPoints(curve.getPoints(50))

      const mat = wire.mesh.material as THREE.LineBasicMaterial
      const active = hasCurrent && isSimulating
      mat.color.setHex(active ? 0xffff00 : wire.baseColor)
      mat.opacity = active ? 1.0 : 0.9
    })
  }

  removeAllByComponent(componentId: string): void {
    const toRemove = this.state.wires.filter(
      w => w.startComp === componentId || w.endComp === componentId,
    )
    toRemove.forEach(w => {
      this.scene.remove(w.mesh)
    })
    this.state.wires = this.state.wires.filter(
      w => w.startComp !== componentId && w.endComp !== componentId,
    )
  }

  clear(): void {
    this.state.wires.forEach(w => this.scene.remove(w.mesh))
    this.state.wires = []
  }
}
