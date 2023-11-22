export type ScheduleEvent = {
  beat: number // Position as beat index
  [key: string]: any
}

export type Schedule = {
  [beat: number]: ScheduleEvent[]
}

/**
 * Note event
 */
export type NoteEvent = ScheduleEvent & {
  note: number
  velocity?: number
  duration?: number
  channel?: number
  playbackTime?: number
}

/**
 * Note schedule
 */
export type NoteSchedule = {
  [beat: number]: NoteEvent[]
}
