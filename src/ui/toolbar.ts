// ============================================================
// src/ui/toolbar.ts
// Botones de herramientas y simulación
// ============================================================

import * as THREE from 'three'
import type { AppState, ComponentTemplateMap } from '@core/types'
import type { SceneManager } from '@scene/SceneManager'
import type { ComponentManager } from '@scene/ComponentManager'
import type { WireManager } from '@scene/WireManager'
import { emit, AppEvents } from '@core/events'
import { saveSnapshot, getUndoSnapshot, getRedoSnapshot } from '@core/history'
import { validateCircuit, highlightErrors, clearErrorHighlights } from '@utils/validation'
import { showTerminalIndicators, hideTerminalIndicators } from './terminalIndicators'
import { showNotification } from './notifications'
import { showComponentProperties } from './inspector'
import { getIndicators } from './terminalIndicators'
import { pulseComponent } from '@utils/animations'
import { sparkEffect } from '@utils/animations'
import { toggleSwitch } from '@core/circuit'
import { calculateCircuitMetrics } from '@core/circuit'

let wireStartComponent: ReturnType<ComponentManager['add']> | null = null
let wireStartTerminal: import('@core/types').Terminal | null = null
let isDragging = false
let selectedForMove: ReturnType<ComponentManager['add']> | null = null
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

export function setupToolbar(
  state: AppState,
  sceneManager: SceneManager,
  componentManager: ComponentManager,
  wireManager: WireManager,
): void {
  const templates: ComponentTemplateMap = (componentManager as any).templates

  // Botones de herramientas
  document.querySelectorAll<HTMLButtonElement>('.tool-button[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.currentTool = btn.dataset['tool'] as any
      if (state.currentTool === 'wire') {
        showTerminalIndicators(state, sceneManager.scene)
      } else {
        hideTerminalIndicators(sceneManager.scene)
      }
    })
  })

  // Simular
  const simBtn = document.getElementById('simulate-btn')
  simBtn?.addEventListener('click', function() {
    state.isSimulating = !state.isSimulating
    this.classList.toggle('active', state.isSimulating)
    this.innerHTML = state.isSimulating ? PAUSE_ICON : PLAY_ICON

    if (state.isSimulating) {
      const errors = validateCircuit(state)
      const errSec = document.getElementById('errors-section')
      const errList = document.getElementById('errors-list')
      if (errors.length > 0 && errSec && errList) {
        errSec.style.display = 'block'
        errList.innerHTML = errors.map(e => `
          <div class="error-card ${e.severity}">
            <div class="error-title">${e.message}</div>
            <div class="error-description">${e.description}</div>
            <div class="error-solution">${e.solution}</div>
          </div>`).join('')
        highlightErrors(errors, state, sceneManager.scene)
      }
      showNotification('success', 'Simulación', 'Iniciada ▶')
    } else {
      clearErrorHighlights(state)
      const errSec = document.getElementById('errors-section')
      if (errSec) errSec.style.display = 'none'
      showNotification('info', 'Simulación', 'Pausada ⏸')
    }
    emit(AppEvents.STATE_CHANGED, null)
  })

  // Limpiar todo
  document.getElementById('clear-all')?.addEventListener('click', () => {
    if (!confirm('¿Limpiar todo?')) return
    componentManager.clear()
    wireManager.clear()
    saveSnapshot(state, 'Limpiar todo')
    emit(AppEvents.STATE_CHANGED, null)
  })

  // Undo / Redo botones
  document.getElementById('undo-btn')?.addEventListener('click', () => handleUndo(state, sceneManager, componentManager, wireManager))
  document.getElementById('redo-btn')?.addEventListener('click', () => handleRedo(state, sceneManager, componentManager, wireManager))

  // Click en canvas
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement
  canvas.addEventListener('click', (e) => onCanvasClick(e, state, sceneManager, componentManager, wireManager, templates))
  canvas.addEventListener('contextmenu', (e) => onCanvasRightClick(e, state, sceneManager, wireManager))
  canvas.addEventListener('mousedown', (e) => onMouseDown(e, state, sceneManager, componentManager))
  canvas.addEventListener('mousemove', (e) => onMouseMove(e, state, sceneManager, wireManager))
  canvas.addEventListener('mouseup', (e) => onMouseUp(e, state, sceneManager))

  // Inspector: value + delete desde props panel
  document.getElementById('props-content')?.addEventListener('change', (e) => {
    const input = (e.target as HTMLElement).closest('.comp-value-input') as HTMLInputElement | null
    if (!input) return
    const comp = state.components.find(c => c.id === input.dataset['compId'])
    if (comp) { comp.value = parseFloat(input.value) || 0; emit(AppEvents.STATE_CHANGED, null) }
  })
  document.getElementById('props-content')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-delete-id]') as HTMLElement | null
    if (!btn) return
    const id = btn.dataset['deleteId']!
    saveSnapshot(state, 'Antes de eliminar')
    wireManager.removeAllByComponent(id)
    componentManager.delete(id)
    saveSnapshot(state, 'Eliminar componente')
    emit(AppEvents.STATE_CHANGED, null)
  })
}

function handleUndo(state: AppState, sm: SceneManager, cm: ComponentManager, wm: WireManager) {
  const snap = getUndoSnapshot(state)
  if (!snap) { showNotification('info', 'Deshacer', 'No hay más acciones'); return }
  cm.clear(); wm.clear()
  snap.components.forEach(c => cm.restoreFromSnapshot(c))
  state.idCounter = snap.idCounter
  emit(AppEvents.STATE_CHANGED, null)
  showNotification('success', 'Deshacer', snap.action)
}

function handleRedo(state: AppState, sm: SceneManager, cm: ComponentManager, wm: WireManager) {
  const snap = getRedoSnapshot(state)
  if (!snap) { showNotification('info', 'Rehacer', 'No hay más acciones'); return }
  cm.clear(); wm.clear()
  snap.components.forEach(c => cm.restoreFromSnapshot(c))
  state.idCounter = snap.idCounter
  emit(AppEvents.STATE_CHANGED, null)
  showNotification('success', 'Rehacer', snap.action)
}

function onCanvasClick(
  event: MouseEvent,
  state: AppState,
  sceneManager: SceneManager,
  componentManager: ComponentManager,
  wireManager: WireManager,
  templates: ComponentTemplateMap,
) {
  sceneManager.updateMouseFromEvent(event, event.target as HTMLElement)
  sceneManager.raycaster.setFromCamera(sceneManager.mouse, sceneManager.camera)

  if (state.currentTool === 'wire') {
    const indicators = getIndicators()
    const hits = sceneManager.raycaster.intersectObjects(indicators)
    if (hits.length > 0) {
      const ud = hits[0]!.object.userData
      const comp = state.components.find(c => c.id === ud['componentId'])!
      if (!wireStartComponent) {
        wireStartComponent = comp
        wireStartTerminal = ud['terminal']
        showNotification('info', 'Cable', 'Haz click en otro terminal')
      } else if (wireStartComponent.id !== comp.id) {
        saveSnapshot(state, 'Antes de crear cable')
        const wire = wireManager.create(wireStartComponent, wireStartTerminal!, comp, ud['terminal'])
        sparkEffect(sceneManager.scene, wireStartTerminal!.position)
        showNotification('success', 'Conectado', wire.wireLabel)
        saveSnapshot(state, `Cable ${wire.startTerm}→${wire.endTerm}`)
        wireStartComponent = null
        wireStartTerminal = null
        emit(AppEvents.STATE_CHANGED, null)
      }
      return
    }
  }

  const allObjects = componentManager.getAllMeshes()
  const intersects = sceneManager.raycaster.intersectObjects(allObjects)
  if (intersects.length > 0) {
    let obj = intersects[0]!.object
    while (obj.parent && !obj.userData['id']) obj = obj.parent!
    const comp = state.components.find(c => c.id === obj.userData['id'])
    if (comp && state.currentTool === 'select') {
      if (intersects[0]!.object.userData['isSwitchLever']) {
        const newState = toggleSwitch(comp)
        showNotification('info', 'Interruptor', newState ? '🟢 ON' : '🔴 OFF')
      } else {
        state.selected = comp
        pulseComponent(comp)
        showComponentProperties(state, templates)
      }
      emit(AppEvents.STATE_CHANGED, null)
    }
  }
}

function onCanvasRightClick(event: MouseEvent, state: AppState, sm: SceneManager, wm: WireManager) {
  event.preventDefault()
  sm.updateMouseFromEvent(event, event.target as HTMLElement)
  sm.raycaster.setFromCamera(sm.mouse, sm.camera)
  sm.raycaster.params.Line.threshold = 0.3
  const hits = sm.raycaster.intersectObjects(state.wires.map(w => w.mesh))
  if (hits.length > 0) {
    const wire = state.wires.find(w => w.mesh === hits[0]!.object)
    if (wire) {
      ;((wire.mesh as THREE.Line).material as THREE.LineBasicMaterial).color.setHex(0xff3b30)
      setTimeout(() => {
        saveSnapshot(state, 'Antes de eliminar cable')
        wm.delete(wire.id)
        saveSnapshot(state, 'Eliminar cable')
        emit(AppEvents.STATE_CHANGED, null)
      }, 100)
    }
  }
}

function onMouseDown(event: MouseEvent, state: AppState, sm: SceneManager, cm: ComponentManager) {
  if (state.currentTool !== 'move') return
  sm.updateMouseFromEvent(event, event.target as HTMLElement)
  sm.raycaster.setFromCamera(sm.mouse, sm.camera)
  const hits = sm.raycaster.intersectObjects(cm.getAllMeshes())
  if (hits.length > 0) {
    let obj = hits[0]!.object
    while (obj.parent && !obj.userData['id']) obj = obj.parent!
    selectedForMove = state.components.find(c => c.id === obj.userData['id']) ?? null
    if (selectedForMove) { isDragging = true; sm.controls.enabled = false }
  }
}

function onMouseMove(event: MouseEvent, state: AppState, sm: SceneManager, wm: WireManager) {
  if (isDragging && selectedForMove) {
    sm.updateMouseFromEvent(event, event.target as HTMLElement)
    sm.raycaster.setFromCamera(sm.mouse, sm.camera)
    const intersection = new THREE.Vector3()
    if (sm.raycaster.ray.intersectPlane(dragPlane, intersection)) {
      selectedForMove.mesh.position.x = intersection.x
      selectedForMove.mesh.position.z = intersection.z
      selectedForMove.position.x = intersection.x
      selectedForMove.position.z = intersection.z
      const { hasCurrent } = { hasCurrent: false }
      wm.updateAll(hasCurrent, state.isSimulating)
    }
  }

  if (state.currentTool === 'wire') {
    sm.updateMouseFromEvent(event, event.target as HTMLElement)
    sm.raycaster.setFromCamera(sm.mouse, sm.camera)
    const indicators = getIndicators()
    const hits = sm.raycaster.intersectObjects(indicators)
indicators.forEach(ind => {
  ind.scale.set(1, 1, 1)
  ;((ind as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.8
})
if (hits.length > 0) {
  hits[0]!.object.scale.set(1.3, 1.3, 1.3)
  ;((hits[0]!.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1.0
}else {
      ;(event.target as HTMLElement).style.cursor = 'crosshair'
    }
  }
}

function onMouseUp(_event: MouseEvent, state: AppState, sm: SceneManager) {
  isDragging = false
  selectedForMove = null
  sm.controls.enabled = true
}

const PLAY_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 4L15 10L6 16V4Z" stroke="currentColor" stroke-width="1.5" fill="currentColor"/></svg>`
const PAUSE_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="5" y="4" width="3" height="12" fill="currentColor"/><rect x="12" y="4" width="3" height="12" fill="currentColor"/></svg>`
