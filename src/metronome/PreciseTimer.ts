// @ts-nocheck
/**
 * Based on ideas from:
 * - https://github.com/mohayonao/web-audio-scheduler
 * - https://www.html5rocks.com/en/tutorials/audio/scheduling/
 */

/*

const timer = new Timer({ context: audioContext })
const loop = function(e) {
  const t0 = e.playbackTime
  const t1 = t0 + 1
  timer.insert(t0, tick)
  timer.insert(t1, loop)
}

timer.start(loop)

*/
import createTimerWorker from './timerWorker'

let timerWorker

export class PreciseTimer {
  constructor(options = {}) {
    this.context =
      options.context !== undefined
        ? options.context
        : {
            get currentTime() {
              return Date.now() / 1000
            },
          }

    this.interval = options.interval !== undefined ? options.interval : 0.025
    this.aheadTime = options.aheadTime !== undefined ? options.aheadTime : 0.1
    this.timerAPI =
      options.timerAPI !== undefined
        ? options.timerAPI
        : timerWorker || (timerWorker = createTimerWorker())

    this.playbackTime = 0
    this.startTime = 0
    this.pausedTime = 0

    this.timerId = 0
    this.scheduleId = 0
    this.schedules = []
  }

  get state() {
    return this.timerId !== 0 ? 'running' : 'suspended'
  }

  get currentTime() {
    return this.context.currentTime
  }

  get events() {
    return this.schedules.slice()
  }

  get isPlaying() {
    return this.state !== 'suspended'
  }

  get isPaused() {
    return this.state === 'suspended' && this.pausedTime
  }

  get isStopped() {
    return this.state === 'suspended' && !this.pausedTime
  }

  start(callback?: Function, data?: any) {
    if (!this.pausedTime) {
      // Start
      this.startTime = this.context.currentTime
    } else {
      // Resume

      // Adjust remaining events in schedule

      const diffTime = this.context.currentTime - this.pausedTime
      const schedules = this.schedules

      for (let i = 0, len = schedules.length; i < len; i++) {
        schedules[i].time += diffTime
      }

      this.startTime += diffTime
      this.pausedTime = 0
    }

    if (this.timerId === 0) {
      // Start loop

      const loop = this.process.bind(this)
      this.timerId = this.timerAPI.setInterval(loop, this.interval * 1000)

      if (callback) {
        this.insert(this.context.currentTime, callback, data)
        loop()
      }
    } else {
      // Loop running already

      if (callback) {
        this.insert(this.context.currentTime, callback, data)
      }
    }

    return this
  }

  pause() {
    if (this.state !== 'running') return
    this.stop(false)
    this.pausedTime = this.context.currentTime
  }

  stop(reset = true) {
    this.pausedTime = 0

    if (this.timerId !== 0) {
      this.timerAPI.clearInterval(this.timerId)
      this.timerId = 0
    }
    if (reset) {
      this.schedules.splice(0)
    }

    return this
  }

  insert(time: number, callback: Function, data?: any): string {
    const id = ++this.scheduleId
    const event = { id, time, callback, data }
    const schedules = this.schedules

    if (
      schedules.length === 0 ||
      schedules[schedules.length - 1].time <= time
    ) {
      schedules.push(event)
    } else {
      for (let i = 0, len = schedules.length; i < len; i++) {
        if (time < schedules[i].time) {
          schedules.splice(i, 0, event)
          break
        }
      }
    }

    return id
  }

  nextTick(time: number, callback: Function, data?: any): string {
    if (typeof time === 'function') {
      data = callback
      callback = time
      time = this.playbackTime
    }

    return this.insert(time + this.aheadTime, callback, data)
  }

  remove(scheduleId) {
    const schedules = this.schedules

    if (typeof scheduleId === 'number') {
      for (let i = 0, max = schedules.length; i < max; i++) {
        if (scheduleId === schedules[i].id) {
          schedules.splice(i, 1)
          break
        }
      }
    }

    return scheduleId
  }

  removeAll() {
    this.schedules.splice(0)
  }

  process() {
    if (this.pausedTime) return

    const t0 = this.context.currentTime
    const t1 = t0 + this.aheadTime

    const schedules = this.schedules
    const playbackTime = t0

    this.playbackTime = playbackTime

    while (schedules.length && schedules[0].time < t1) {
      const event = schedules.shift()

      const playbackTime = event.time
      const position = playbackTime - this.startTime
      const data = event.data

      event.callback({ playbackTime, position, data })
    }
  }
}
