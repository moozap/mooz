/**
 * General-purpose event-driven player
 * @module Player
 */

import type { ScheduleEvent } from '../schedule'

// export * from '../schedule'

/**
 * A player with callback that accepts current event
 */
export type Player = {
  play(note: ScheduleEvent): void
}
