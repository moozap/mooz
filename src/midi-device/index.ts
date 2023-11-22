/**
 * MIDI device access for input/output
 * @module MidiDevice
 */

import { noteNumberToNameAndOctave } from './note'

export * from './MidiDevice'
export * from './note'

let midiAccess

export function getMidiAccess() {
  return new Promise((resolve, reject) => {
    if (midiAccess) return resolve(midiAccess)

    navigator
      .requestMIDIAccess({
        sysex: false,
      })
      .then(function onSuccess(midi) {
        midiAccess = midi
        resolve(midiAccess)
      }, reject)
  })
}

export const midiMessageTypes = {
  noteOff: 128,
  noteOn: 144,
  keyAftertouch: 160,
  controlChange: 176,
  // channelMode:    176,
  // nrpn:           176,
  programChange: 192,
  channelAftertouch: 208,
  pitchBend: 224,
}

export const midiMessageTypeNames = Object.keys(midiMessageTypes).reduce(
  (obj, key) => {
    const value = midiMessageTypes[key]
    obj[value] = key
    return obj
  },
  {}
)

export const midiControlMessageTypes = {
  bankSelectCoarse: 0,
  modulationWheelCoarse: 1,
  breathControllerCoarse: 2,

  footControllerCoarse: 4,
  portamentoTimeCoarse: 5,
  dataEntryCoarse: 6,
  volumeCoarse: 7,
  balanceCoarse: 8,

  panCoarse: 10,
  expressionCoarse: 11,
  effectControl1Coarse: 12,
  effectControl2Coarse: 13,

  generalPurposeSlider1: 16,
  generalPurposeSlider2: 17,
  generalPurposeSlider3: 18,
  generalPurposeSlider4: 19,

  bankSelectFine: 32,
  modulationWheelFine: 33,
  breathControllerFine: 34,

  footControllerFine: 36,
  portamentotimeFine: 37,
  dataEntryFine: 38,
  volumeFine: 39,
  balanceFine: 40,

  panFine: 42,
  expressionFine: 43,
  effectControl1Fine: 44,
  effectControl2Fine: 45,

  // ~63

  holdPedal: 64,
  portamento: 65,
  sustenutoPedal: 66,
  softPedal: 67,
  legatoPedal: 68,
  hold2Pedal: 69,
  soundVariation: 70,
  resonance: 71,
  soundReleaseTime: 72,
  soundAttackTime: 73,
  brightness: 74,
  soundControl6: 75,
  soundControl7: 76,
  soundControl8: 77,
  soundControl9: 78,
  soundControl10: 79,
  generalPurposeButton1: 80,
  generalPurposeButton2: 81,
  generalPurposeButton3: 82,
  generalPurposeButton4: 83,

  reverbLevel: 91,
  tremoloLevel: 92,
  chorusLevel: 93,
  celesteLevel: 94,
  phaserLevel: 95,
  dataButtonIncrement: 96,
  dataButtonDecrement: 97,
  nonRegisteredParameterCoarse: 98,
  nonRegisteredParameterFine: 99,
  registeredParameterCoarse: 100,
  registeredParameterFine: 101,

  // ~119

  // Channel mode messages
  allSoundoff: 120,
  resetAllControllers: 121,
  localControl: 122,
  allNotesOff: 123,
  omniModeOff: 124,
  omniModeOn: 125,
  monoModeOn: 126,
  polyModeOn: 127,
}

const midiControlMessageTypeNames = Object.keys(midiControlMessageTypes).reduce(
  (obj, key) => {
    const value = midiControlMessageTypes[key]
    obj[value] = key
    return obj
  },
  {}
)

export function extractMidiMessage(message = [0, 0, 0]) {
  const [meta, note, velocity] = message
  const type = meta & 0xf0 // Channel-agnostic message type
  const channel = meta & 0x0f // 0~15
  const command = meta >> 4

  return {
    type,
    channel,
    command,
    note,
    velocity,
  }
}

export type MidiData = {
  type: number
  channel: number
  command: number
  note: number
  velocity: number
  controlName?: string
  value?: number
}

/**
 * Extract data from MIDI event
 */
export function extractMidiDataFromEvent(
  event: {
    target?: any
    data?: any
  } = {},
  options: {
    octaveOffset?: number
  } = {}
) {
  const { octaveOffset = 0 } = options

  const message: MidiData = extractMidiMessage(event.data)

  // Extend message with: input, typeName, noteName, octave, controlName

  const { type, note } = message
  const typeName = midiMessageTypeNames[type] || 'Unknown'

  Object.assign(message, {
    input: event.target,
    typeName,
    data: event.data,
  })

  if (type === midiMessageTypes.noteOff || type === midiMessageTypes.noteOn) {
    Object.assign(message, noteNumberToNameAndOctave(note, { octaveOffset }))
  } else if (type === midiMessageTypes.controlChange) {
    message.controlName = midiControlMessageTypeNames[note]
  } else if (type === midiMessageTypes.pitchBend) {
    // Pitch bend value: -1 to 1
    message.value = ((message.velocity << 7) + note - 8192) / 819 / 10
  }

  return message
}

export function createMidiMessage({
  type = 0,
  channel = 0, // 0~15
  note = 0, // 0~127
  velocity = 0, // 0~127
}) {
  const messageType =
    typeof type === 'number' ? type : midiMessageTypes[type] || 0

  return [
    messageType + channel, // (channel - 1),
    note,
    velocity,
  ]
}

export function sendMidiMessage(output, data) {
  output.send(createMidiMessage(data))
}
