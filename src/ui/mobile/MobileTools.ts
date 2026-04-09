import type { AppState } from '@core/types'
import { emit, AppEvents } from '@core/events'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { showNotification } from './MobileNotifications'

export let mobileCurrentTool = 'select'

export function updateEditButtonVisibility(state: AppState, editBtn: HTMLElement | null): void {
  const shouldShow = state.selected !== null && state.currentTool === 'select'
  if (editBtn) editBtn.style.display = shouldShow ? 'flex' : 'none'
}

export function toggleTerminalHighlights(scene: any, state: AppState, highlight: boolean): void {
  if (!scene) return

  const TERMINAL_COLORS: Record<string, string> = {
    positive: '#FF0000',
    negative: '#111111',
    input:    '#FF8C00',
    output:   '#228B22',
    neutral:  '#1E90FF',
    phase:    '#8B4513',
    ground:   '#228B22',
  }

  const connectedTerminals = new Set<string>()
  state.wires.forEach(wire => {
    connectedTerminals.add(`${wire.startComp}-${wire.startTerm}`)
    connectedTerminals.add(`${wire.endComp}-${wire.endTerm}`)
  })

  state.components.forEach(comp => {
    const node = scene.getNodeByName(comp.id)
    if (!node) return

    node.getChildMeshes?.().forEach((mesh: any) => {
      if (!mesh.metadata?.isTerminal) return

      const termType = mesh.metadata.terminalType as string
      const mat = mesh.material

      if (!highlight) {
        if (mat) {
          mat.emissiveColor = new Color3(0.15, 0.15, 0.15)
          mat.diffuseColor = new Color3(1, 1, 1)
        }
        mesh.scaling = new Vector3(1, 1, 1)
        return
      }

      const isConnected = connectedTerminals.has(`${comp.id}-${termType}`)

      if (isConnected) {
        const wire = state.wires.find(w =>
          (w.startComp === comp.id && w.startTerm === termType) ||
          (w.endComp === comp.id && w.endTerm === termType)
        )
        if (wire && mat) {
          const hex = '#' + wire.baseColor.toString(16).padStart(6, '0')
          const c = Color3.FromHexString(hex)
          mat.emissiveColor = c.scale(0.9)
          mat.diffuseColor = c.scale(0.5)
        }
        mesh.scaling = new Vector3(1.1, 1.1, 1.1)
      } else {
        const hex = TERMINAL_COLORS[termType] ?? '#808080'
        const c = Color3.FromHexString(hex)
        if (mat) {
          mat.emissiveColor = c.scale(0.8)
          mat.diffuseColor = c.scale(0.4)
          mat.specularColor = new Color3(0, 0, 0)
        }
        mesh.scaling = new Vector3(1.3, 1.3, 1.3)
      }
    })
  })
}

export function resetTerminalColors(scene: any, state: AppState): void {
  if (!scene) return

  state.components.forEach(comp => {
    comp.terminals.forEach(term => {
      const node = scene.getNodeByName(`${comp.id}-${term.type}`)
      if (!node) return
      const mat = node.material
      if (!mat) return
      mat.diffuseColor = new Color3(1, 1, 1)
      mat.emissiveColor = new Color3(0.15, 0.15, 0.15)
      mat.specularColor = new Color3(0, 0, 0)
      node.scaling = new Vector3(1, 1, 1)
    })
  })
}

export function setupTools(state: AppState, editBtn: HTMLElement | null, scene?: any): void {
  document.querySelectorAll<HTMLButtonElement>('.m-fab[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      document.querySelectorAll<HTMLElement>('.m-fab[data-tool]').forEach(b => b.classList.remove('m-fab-active'))
      btn.classList.add('m-fab-active')

      mobileCurrentTool = btn.dataset['tool'] ?? 'select'
      state.currentTool = mobileCurrentTool as any

      if (mobileCurrentTool === 'wire') {
        toggleTerminalHighlights(scene, state, true)
        if (editBtn) editBtn.style.display = 'none'
        showNotification('Toca componente origen → destino', 'success')
      } else if (mobileCurrentTool === 'delete') {
        resetTerminalColors(scene, state)
        toggleTerminalHighlights(scene, state, false)
        if (editBtn) editBtn.style.display = 'none'
        showNotification('🗑️ Toca un componente o cable para eliminar', 'success')
      } else {
        resetTerminalColors(scene, state)
        toggleTerminalHighlights(scene, state, false)
        if (editBtn) updateEditButtonVisibility(state, editBtn)
      }

      emit(AppEvents.STATE_CHANGED, null)
    })
  })
}