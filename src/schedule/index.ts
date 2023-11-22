/**
 * A Schedule is a list of events. It is usually passed to a Player.
 * 
 * Each event has a beat index, the position in time represented by the number
 * (integer or float) of absolute beats.
 * 
 * An absolute beat is the duration of quarter note based on the tempo (beats
 * per minute).
 * 
 * An event can carry other information for the player, like note number and
 * velocity.
 *
 * @module Schedule
 */

import type { ScheduleEvent, Schedule } from './types'

export * from './types'

export function createSchedule(schedule: Schedule) {
  return !schedule ? {} : Object.assign({}, schedule)
}

export function addToSchedule(schedule: Schedule, event: ScheduleEvent) {
  // Grouped by each beat, on integer beat index
  const beat = Math.floor(event.beat)
  if (!schedule[beat]) schedule[beat] = []
  schedule[beat].push(event)
}
