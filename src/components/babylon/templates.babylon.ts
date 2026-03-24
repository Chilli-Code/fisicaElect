import type { Scene } from '@babylonjs/core/scene'
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { ComponentType } from '@core/types'
import { createBatteryBabylon } from './battery.babylon'
import { createResistorBabylon } from './resistor.babylon'
import { createLEDBabylon } from './led.babylon'
import { createSwitchBabylon } from './switch.babylon'
import { createCapacitorBabylon } from './capacitor.babylon'
import { createInductorBabylon } from './inductor.babylon'
import { createVoltmeterBabylon } from './voltmeter.babylon'
import { createAmmeterBabylon } from './ammeter.babylon'
import { createDiodeBabylon } from './diode.babylon'
import { createTransistorBabylon } from './transistor.babylon'
import { createACSourceBabylon } from './acSource.babylon'
export interface BabylonComponentTemplate {
  name: string
  defaultValue: number
  unit: string
  createBabylon: (scene: Scene) => TransformNode
  terminals: Array<{ type: string; offset: { x: number; y: number; z: number } }>
}

export type BabylonTemplateMap = Record<ComponentType, BabylonComponentTemplate>

export function getBabylonTemplates(): BabylonTemplateMap {
  return {
    battery:     { name: 'Batería',     defaultValue: 9,   unit: 'V',  createBabylon: createBatteryBabylon,   terminals: [{ type: 'positive', offset: { x: 0, y: 1.2, z: 0 } }, { type: 'negative', offset: { x: 0, y: -1.1, z: 0 } }] },
    resistor:    { name: 'Resistencia', defaultValue: 100, unit: 'Ω',  createBabylon: createResistorBabylon,  terminals: [{ type: 'input', offset: { x: 1.1, y: 0, z: 0 } }, { type: 'output', offset: { x: -1.1, y: 0, z: 0 } }] },
    led:         { name: 'LED',         defaultValue: 0,   unit: '',   createBabylon: createLEDBabylon,       terminals: [{ type: 'positive', offset: { x: 0, y: -1, z: 0 } }, { type: 'negative', offset: { x: 0.3, y: -1, z: 0 } }] },
    switch:      { name: 'Interruptor', defaultValue: 1,   unit: '',   createBabylon: createSwitchBabylon,    terminals: [{ type: 'input', offset: { x: 1.1, y: 0, z: 0 } }, { type: 'output', offset: { x: -1.1, y: 0, z: 0 } }] },
    capacitor:   { name: 'Capacitor',   defaultValue: 100, unit: 'μF', createBabylon: createCapacitorBabylon, terminals: [{ type: 'positive', offset: { x: 0, y: 0.7, z: 0 } }, { type: 'negative', offset: { x: 0, y: -0.7, z: 0 } }] },
    inductor:    { name: 'Inductor',    defaultValue: 10,  unit: 'mH', createBabylon: createInductorBabylon,  terminals: [{ type: 'input', offset: { x: 1.2, y: 0, z: 0 } }, { type: 'output', offset: { x: -1.2, y: 0, z: 0 } }] },
    voltmeter:   { name: 'Voltímetro',  defaultValue: 0,   unit: 'V',  createBabylon: createVoltmeterBabylon, terminals: [{ type: 'positive', offset: { x: 0.9, y: 0, z: 0 } }, { type: 'negative', offset: { x: -0.9, y: 0, z: 0 } }] },
    ammeter:     { name: 'Amperímetro', defaultValue: 0,   unit: 'A',  createBabylon: createAmmeterBabylon,    terminals: [{ type: 'input', offset: { x: 0.9, y: 0, z: 0 } }, { type: 'output', offset: { x: -0.9, y: 0, z: 0 } }] },
    diode:       { name: 'Diodo',       defaultValue: 0.7, unit: 'V',  createBabylon: createDiodeBabylon,      terminals: [{ type: 'input', offset: { x: 0.8, y: 0, z: 0 } }, { type: 'output', offset: { x: -0.8, y: 0, z: 0 } }] },   
    transistor:  { name: 'Transistor',  defaultValue: 0,   unit: '',   createBabylon: createTransistorBabylon, terminals: [{ type: 'input', offset: { x: -0.3, y: -0.9, z: 0 } }, { type: 'output', offset: { x: 0, y: -0.9, z: 0 } }, { type: 'negative', offset: { x: 0.3, y: -0.9, z: 0 } }] },
    'ac-source': { name: 'Fuente AC',   defaultValue: 120, unit: 'V',  createBabylon: createACSourceBabylon,   terminals: [{ type: 'positive', offset: { x: 0.8, y: 0, z: 0 } }, { type: 'negative', offset: { x: -0.8, y: 0, z: 0 } }] },
  }
}