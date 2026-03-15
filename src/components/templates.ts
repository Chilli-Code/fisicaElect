// ============================================================
// src/components/templates.ts
// Registro de plantillas. Cada tipo sabe cómo crear su mesh 3D.
// Preparado para ser reemplazado por assets Babylon.js.
// ============================================================

import type { ComponentTemplateMap } from '@core/types'

// Las factories 3D vienen de sus módulos individuales
import { createBattery3D } from './battery'
import { createACSource3D } from './acSource'
import { createResistor3D } from './resistor'
import { createCapacitor3D } from './capacitor'
import { createInductor3D } from './inductor'
import { createVoltmeter3D } from './voltmeter'
import { createAmmeter3D } from './ammeter'
import { createLED3D } from './led'
import { createSwitch3D } from './switch'
import { createDiode3D } from './diode'
import { createTransistor3D } from './transistor'

export function getComponentTemplates(): ComponentTemplateMap {
  return {
    battery:     { name: 'Batería',       defaultValue: 9,   unit: 'V',  create3D: createBattery3D },
    'ac-source': { name: 'Fuente AC',     defaultValue: 120, unit: 'V',  create3D: createACSource3D },
    resistor:    { name: 'Resistencia',   defaultValue: 100, unit: 'Ω',  create3D: createResistor3D },
    capacitor:   { name: 'Capacitor',     defaultValue: 100, unit: 'μF', create3D: createCapacitor3D },
    inductor:    { name: 'Inductor',      defaultValue: 10,  unit: 'mH', create3D: createInductor3D },
    voltmeter:   { name: 'Voltímetro',    defaultValue: 0,   unit: 'V',  create3D: createVoltmeter3D },
    ammeter:     { name: 'Amperímetro',   defaultValue: 0,   unit: 'A',  create3D: createAmmeter3D },
    led:         { name: 'LED',           defaultValue: 0,   unit: '',   create3D: createLED3D },
    switch:      { name: 'Interruptor',   defaultValue: 1,   unit: '',   create3D: createSwitch3D },
    diode:       { name: 'Diodo',         defaultValue: 0.7, unit: 'V',  create3D: createDiode3D },
    transistor:  { name: 'Transistor',    defaultValue: 0,   unit: '',   create3D: createTransistor3D },
  }
}
