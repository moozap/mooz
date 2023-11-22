/**
 * Functions to calculate and draw fretboard layout
 * @module Fretboard
 */
import type { Player } from '../player'
import type { Schedule, ScheduleEvent } from '../schedule'

export type FretboardEvent = ScheduleEvent & {
  string: number,
  fret: number,
  data?: any
}

export class FretboardPlayer implements Player {

  schedule: Schedule

  constructor() {

  }

  play(event) {

  }
}
