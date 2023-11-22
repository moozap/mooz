import { getAudioContext } from '../audio-context'
import { PreciseTimer } from './PreciseTimer'
import { EventEmitter } from '../event'
import { Score, createScore } from '../score'
import { MetronomePosition, MetronomeTimeSignature } from './types'

export * from './types'

/**
 * Initial position
 * - `beatIndex` = `0` (first beat index)
 * - `currentMeasure` = `1`
 * - `currentBeat` = `1`
 */
export const initialPosition: MetronomePosition = {
  beatIndex: 0,
  // metronomeBeat: 1,
  currentMeasure: 1,
  currentBeat: 1,
}

/**
 * Metronome runs a precise timer that can start, pause, and stop.
 *
 * It has a tempo and time signature, which control how time is counted.
 *
 * It keeps track of the current position in these units of measurement:
 *
 * - Absolute beat index
 * - By measure and beat, based on time signature which can change
 *
 * It can be given a score of players with events, which will be played in sync
 * with the metronome.
 *
 * @example
 * ```ts
 * import { Metronome } from 'mooz/metronome'
 * ```
 */
export class Metronome extends EventEmitter {
  /**
   *  Audio context
   */
  audioContext: AudioContext

  /**
   * Tempo in beats per minute
   */
  tempo = 60

  /**
   * Time signature
   */
  timeSignature: MetronomeTimeSignature = {
    numberOfBeats: 4,
    beatUnit: 4,
  }

  /**
   * Metronome position
   */
  position: MetronomePosition = {
    beatIndex: 0,
    // metronomeBeat: 0,
    currentMeasure: 1,
    currentBeat: 1,
  }

  /**
   * Current score
   */
  score: Score

  /**
   * Precise timer
   */
  private timer: PreciseTimer

  /**
   * Listener callbacks for next measure
   */
  private nextMeasureListeners: Function[] = []

  /**
   * Reset position is scheduled
   */
  private resetPositionScheduled: boolean = false

  /**
   * Loop duration by absolute beat index
   */
  loopDuration = 0

  constructor(
    props: {
      audioContext?: AudioContext
      tempo?: number
      timeSignature?: MetronomeTimeSignature
    } = {}
  ) {
    super()

    const { audioContext = getAudioContext(), tempo, timeSignature } = props
    this.audioContext = audioContext
    this.timer = new PreciseTimer({
      context: audioContext,
    })

    if (tempo) {
      this.tempo = tempo
    }
    if (timeSignature) {
      this.timeSignature = timeSignature
    }

    this.setScore(createScore())
  }

  /**
   * Set loop duration by absolute beat index
   */
  setLoop(duration: number) {
    this.loopDuration = duration
  }

  /**
   * Callback on absolute beat
   */
  private onAbsoluteBeat = (event) => {
    let beatIndex = event.isFirstEvent
      ? this.position.beatIndex // Starts on 0
      : this.position.beatIndex + 1

    const reset =
      this.loopDuration && beatIndex === this.loopDuration //+ 1

    if (reset) {
      beatIndex = 0
      this.resetPositionScheduled = true
    }

    const { playbackTime } = event

    /**
     *  Schedule score events
     */

    const parts = this.score.parts

    // Calculate beat duration every time because it can change with tempo
    const beatDuration = this.getAbsoluteBeatDuration()

    for (const part of parts) {
      for (const schedule of part.schedules) {
        if (!schedule[beatIndex]) continue
        for (const event of schedule[beatIndex]) {
          const diff = event.beat - beatIndex
          part.player.play({
            playbackTime:
              diff > 0 ? playbackTime + diff * beatDuration : playbackTime,
            ...event,
          })
        }
      }
    }

    const position = {
      beatIndex,
      playbackTime,
    }

    /**
     * Emit event to schedule the beat
     *
     * Audio players can use this to schedule sounds precisely.
     */
    this.emit('scheduleAbsoluteBeat', position)

    this.timer.nextTick(playbackTime, () => {
      this.position.beatIndex = beatIndex

      /**
       * ? Can have race condition if metronome beat comes before absolute,
       * or is later..?
       */
      if (reset) {
        Object.assign({
          // metronomeBeat: 1,
          currentMeasure: 1,
          currentBeat: 1,
        })    
      }

      /**
       * Emit event for beat
       *
       * Visual players can use this and requestAnimationFrame to draw
       */
      this.emit('absoluteBeat', position)
    })
  }

  /**
   * Callback on metronome beat
   */
  private onMetronomeBeat = (event) => {
    let reset = this.resetPositionScheduled

    // let metronomeBeat = this.position.metronomeBeat + 1
    let currentMeasure =
      reset || event.isFirstEvent ? 1 : this.position.currentMeasure
    let currentBeat =
      reset || event.isFirstEvent ? 1 : this.position.currentBeat + 1

    if (currentBeat > this.timeSignature.numberOfBeats) {
      currentMeasure++
      currentBeat -= this.timeSignature.numberOfBeats
    }

    // Reset metronome position
    if (reset) {
      this.resetPositionScheduled = false
      // metronomeBeat = 1
      currentMeasure = 1
      currentBeat = 1
    }

    const scheduleProps = {
      playbackTime: event.playbackTime,
      // metronomeBeat,
      currentMeasure,
      currentBeat,
    }

    // Next measure
    if (
      this.position.currentMeasure !== currentMeasure ||
      (this.position.currentMeasure === 1 && this.position.currentBeat === 1)
    ) {
      for (const listener of this.nextMeasureListeners) {
        listener(scheduleProps)
      }
      this.nextMeasureListeners = []
    }

    this.emit('scheduleMetronomeBeat', scheduleProps)

    this.timer.nextTick(event.playbackTime, () => {
      // this.position.metronomeBeat = metronomeBeat
      this.position.currentMeasure = currentMeasure
      this.position.currentBeat = currentBeat
      this.emit('metronomeBeat', this.position)
    })
  }

  /**
   * Get the duration of an absolute beat in seconds
   */
  getAbsoluteBeatDuration = () => {
    return (60 / this.tempo) * (4 / 4)
  }

  /**
   * Get the duration of a metronome beat in seconds
   */
  getMetronomeBeatDuration = () => {
    return (60 / this.tempo) * (4 / this.timeSignature.beatUnit)
  }

  /**
   * Start timer loops
   *
   * There are two loops to count absolute and metronome beats separately.
   */
  private startLoops = (firstEvent) => {

    const loops = [
      {
        callback: this.onAbsoluteBeat,
        getInterval: this.getAbsoluteBeatDuration,
      },
      {
        callback: this.onMetronomeBeat,
        getInterval: this.getMetronomeBeatDuration,
      },
    ]

    loops.forEach(({ getInterval, callback }) => {
      const loop = (event) => {
        // Schedule current beat
        const t0 = event.playbackTime

        this.timer.insert(t0, (newEvent) =>
          callback(Object.assign(event, newEvent))
        )

        // Schedule next beat
        // Get interval every time for dynamic tempo and time signature
        const t1 = t0 + getInterval()

        this.timer.insert(t1, loop)
      }

      loop({
        ...firstEvent,
        isFirstEvent: true,
      })
    })
  }

  /**
   * Start or resume the timer
   */
  start() {
    if (this.timer.isPaused) {
      this.timer.start() // Resume
    } else {
      if (!this.timer.isStopped) return // Already started
      this.timer.start(this.startLoops)
    }

    this.emit('start', this.position)
  }

  /**
   * Stop the timer
   */
  stop() {
    this.timer.stop()
    this.nextMeasureListeners = []
    this.resetPositionScheduled = false
    this.resetPosition()
    // this.position.metronomeBeat = 0 // 0 = Stopped, 1 = First beat
    this.emit('stop', this.position)
  }

  /**
   * Pause the timer
   */
  pause() {
    this.timer.pause()
    this.emit('pause', this.position)
  }

  /**
   * Destroy instane: stop, remove timer and listeners
   */
  destroy() {
    this.stop()
    this.removeListeners()
    this.timer = null
  }

  /**
   * Reset position
   */
  resetPosition() {
    Object.assign(this.position, initialPosition)
  }

  /**
   * Schedule a callback at given time
   */
  schedule(time: number, callback: Function, data?: any) {
    this.timer.nextTick(time, () =>
      callback({
        state: this,
        data,
      })
    )
  }

  /**
   * Schedule a callback for start of next measure
   */
  scheduleNextMeasure(callback) {
    this.nextMeasureListeners.push(callback)
  }

  /**
   * Set current score
   */
  setScore(newScore: Score) {
    this.score = newScore
    if (this.score.loopDuration) {
      this.setLoop(this.score.loopDuration)
    }
  }

  /**
   * Set tempo in beats per second
   * - Range: 1~999
   */
  setTempo(tempo: number) {
    if (tempo >= 1 && tempo <= 999) {
      this.tempo = tempo
    }
  }

  /**
   * Set time signature
   */
  setTimeSignature(timeSignature: MetronomeTimeSignature) {
    this.timeSignature = timeSignature
  }
}
