import type {
  ScheduleEvent,
  Schedule,
  NoteEvent,
  NoteSchedule,
} from '../schedule'

export type { ScheduleEvent, Schedule, NoteEvent, NoteSchedule }

/**
 * Control schedule
 */
export type ControlSchedule = {
  [key: number]: (ControlEvent | MetaEvent)[]
}

/**
 * Control event
 */
export type ControlEvent =
  | ChannelAftertouchEvent
  | ControllerEvent
  | NoteAftertouchEvent
  | PitchBendEvent
  | ProgramChangeEvent
  | ScheduleEvent

export type ChannelAftertouchEvent = ScheduleEvent & {
  type: 'channelAftertouch'
  value: number
}

export type ControllerEvent = ScheduleEvent & {
  type: 'controller'
  controllerType: number
  value: number
}

export type NoteAftertouchEvent = ScheduleEvent & {
  type: 'noteAftertouch'
  note: number
  value: number
}

export type PitchBendEvent = ScheduleEvent & {
  type: 'pitchBend'
  value: number
}

export type ProgramChangeEvent = ScheduleEvent & {
  type: 'programChange'
  programNumber: number
  value: number
}

/**
 * Meta event
 */
export type MetaEvent =
  | SetTempoEvent
  | SetTimeSignatureEvent
  | SetKeySignature
  | ScheduleEvent

export type SetTempoEvent = ScheduleEvent & {
  type: 'setTempo'
  value: number // beats per minute
  // microsecondsPerBeat: number
}

export type SetTimeSignatureEvent = ScheduleEvent & {
  type: 'timeSignature'
  numerator: number
  denominator: number
}

export type SetKeySignature = ScheduleEvent & {
  type: 'keySignature'
  key: number
  scale: number
}

// trackName, instrumentName, endOfTrack
