/**
 * @module Score
 */
import type { Schedule, ScheduleEvent } from '../schedule'
import { Player } from '../player'

/**
 * Score is a set of players with event schedules. It has a duration.
 */
export type Score = {
  parts: ScorePart[]
  loopDuration?: number
}

export type ScorePart = {
  player: Player
  schedules: Schedule[]
}

export function createScore(newScore: Partial<Score> = {}): Score {
  return {
    parts: [],
    loopDuration: newScore.loopDuration,
    ...newScore,
  }
}

/**
 * Score player takes a given score with players and event schedules. When
 * called by a metronome with an absolute beat event, it calls all its players
 * which have scheduled events for that beat index.
 */
export class ScorePlayer {
  play(event: ScheduleEvent) {}
}
