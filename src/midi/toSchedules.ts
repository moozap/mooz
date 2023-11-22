import { addToSchedule } from '../schedule'
import type {
  NoteSchedule,
  ControlSchedule,
  NoteEvent,
  MetaEvent,
  ControlEvent,
  ChannelAftertouchEvent,
  ControllerEvent,
  NoteAftertouchEvent,
  PitchBendEvent,
  ProgramChangeEvent,
  SetTempoEvent,
  SetKeySignature,
  SetTimeSignatureEvent,
} from './types'
import decodeMidi from './decode'

/**
 * MIDI to schedules: note and control events
 * MetaEvent, NoteEvent, ControlEvent
 */
export default function midiToSchedules(
  midiBuffer: ArrayBuffer
): [noteSchedule: NoteSchedule, controlSchedule: ControlSchedule] {
  const { header, tracks } = decodeMidi(midiBuffer)

  const noteSchedule: NoteSchedule = {}
  const controlSchedule: ControlSchedule = {}

  const { ticksPerBeat } = header

  let track = 0

  for (const midiMessages of tracks) {
    const notesOn = {}

    let beat = 0

    for (const midiMessage of midiMessages) {
      const { deltaTime, meta, type, channel } = midiMessage
      const relativeBeat = deltaTime / ticksPerBeat

      beat += relativeBeat

      // console.log('track', track+1, 'event', event)

      if (meta) {
        // Meta event

        const event: MetaEvent = {
          type,
          beat,
          channel,
          // track,
        }

        switch (type) {
          case 'setTempo':
            // Convert to BPM (beats per minute)
            event.value = 60000000 / midiMessage.microsecondsPerBeat
            addToSchedule(controlSchedule, event as SetTempoEvent)
            break
          case 'timeSignature':
            event.numerator = midiMessage.numerator
            event.denominator = midiMessage.denominator
            addToSchedule(controlSchedule, event as SetTimeSignatureEvent)
            break
          case 'keySignature':
            event.key = midiMessage.key
            event.scale = midiMessage.scale
            addToSchedule(controlSchedule, event as SetKeySignature)
            break
        }

        continue
      }

      // Note event: noteOn, noteOff - note, velocity, channel

      if (type === 'noteOn') {
        const { note, velocity } = midiMessage

        if (!notesOn[note]) notesOn[note] = []

        const event: NoteEvent = {
          type: 'note',
          beat, // Position as beat index
          note,
          velocity,
          duration: 0,
          channel,
          // track,
        }

        notesOn[note].push(event)
        continue
      }

      if (type === 'noteOff') {
        const { note } = midiMessage

        const noteOn = notesOn[note]
        if (!noteOn || !noteOn.length) continue

        const event = noteOn.shift() // Get first note
        event.duration = beat - event.beat

        addToSchedule(noteSchedule, event)

        if (noteOn.length <= 0) delete notesOn[note]
      }

      // Control event

      const event: ControlEvent = {
        type,
        beat,
        channel,
        // track,
      }

      switch (type) {
        case 'channelAftertouch':
          event.value = midiMessage.value
          addToSchedule(controlSchedule, event as ChannelAftertouchEvent)
          break
        case 'controller':
          event.controllerType = midiMessage.controllerType
          event.value = midiMessage.value
          addToSchedule(controlSchedule, event as ControllerEvent)
          break
        case 'noteAftertouch':
          event.note = midiMessage.note
          event.value = midiMessage.value
          addToSchedule(controlSchedule, event as NoteAftertouchEvent)
          break
        case 'pitchBend':
          event.value = midiMessage.value
          addToSchedule(controlSchedule, event as PitchBendEvent)
          break
        case 'programChange':
          event.programNumber = midiMessage.programNumber
          addToSchedule(controlSchedule, event as ProgramChangeEvent)
          break
      }
    } // Every MIDI message

    // Push any remaining notes on
    if (Object.keys(notesOn).length > 0) {
      for (const noteNumber of Object.keys(notesOn)) {
        const note = notesOn[noteNumber].shift()
        if (!note) continue
        note.duration = beat - note.beat
        addToSchedule(noteSchedule, note)
      }
    }

    track++
  } // Every track

  return [noteSchedule, controlSchedule]
}
