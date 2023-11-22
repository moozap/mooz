import { getAudioContext } from '../context'

/**
 * Get playback rate for a given pitch shift in +/- semitones
 *
 * 1 semitone = 100 cents
 * rate = 2^(cents / 1200)
 */
function pitchShiftToPlaybackRate(semitones = 0) {
  const cents = semitones * 100
  return cents ? Math.pow(2, cents / 1200) : 1
}

export default class GranularSynth {
  constructor(options = {}) {
    const context = options.context || getAudioContext()

    Object.assign(this, {
      context,
      buffer: null, // AudioBuffer

      volume: 0.2, // 0~1

      pitchShift: 0, // In semitones +/-
      playbackRate: 1, // Multiplier for playback rate

      attack: 0.2,
      release: 0.6,

      position: 0.0, // 0~1 relative to buffer duration
      density: 0.65,
      spread: 0.3, // seconds left/right of position

      grains: 6,

      pan: 0.8,
      reverb: 0.5,

      ...options,
    })

    this.output = context.createGain()
    this.output.connect(context.destination)

    this.grainTimers = []

    if (this.density > 1) this.density = 1

    if (this.pitchShift) {
      this.playbackRate = pitchShiftToPlaybackRate(this.pitchShift)
    }
  }

  start() {
    /* if (this.timer) clearTimeout(this.timer)
    const loop = () => {
      this.play()

      // Calculate interval every time to respond to any changes in density
      const interval = ((1 - this.density) * 500) + 70

      this.timer = setTimeout(loop, interval)
    }
    loop()
    */

    this.grainTimers.forEach((f) => f())
    this.grainTimers = []

    for (let i = 0; i < this.grains; i++) {
      const grain = {}

      const loop = () => {
        this.play()

        // Calculate interval every time to respond to any changes in density
        const interval = (1 - this.density) * 500 + 70

        clearTimeout(grain.timer)
        grain.timer = setTimeout(loop, interval)
      }

      grain.timer = setTimeout(loop, Math.random() * 500)

      this.grainTimers[i] = () => clearTimeout(grain.timer)
    }
  }

  stop() {
    // clearTimeout(this.timer)
    this.grainTimers.forEach((f) => f())
    this.grainTimers = []
  }

  play() {
    const { context } = this
    const now = context.currentTime

    const source = context.createBufferSource()

    source.playbackRate.value = source.playbackRate.value * this.playbackRate
    source.buffer = this.buffer

    // Gain for envelope
    const gain = context.createGain()

    gain.connect(this.output)

    // Panner on some percentage of grains
    if (Math.random() > 0.7) {
      const panner = context.createPanner()
      panner.panningModel = 'equalpower'
      panner.distanceModel = 'linear'

      // Random position between -pan and pan
      const position = Math.random() * (this.pan * 2) - this.pan

      panner.setPosition(position, 0, 0)

      source.connect(panner)
      panner.connect(gain)
    } else {
      source.connect(gain)
    }

    const offset = this.position * this.buffer.duration

    // Spread to left/right of offset
    const spreadMaxDuration = this.spread * this.buffer.duration
    let spreadAmount = Math.random() * spreadMaxDuration - spreadMaxDuration / 2

    if (0 - spreadAmount > offset) spreadAmount = offset

    const duration = this.attack + this.release

    source.start(now, offset + spreadAmount, duration)

    gain.gain.setValueAtTime(0.0, now)
    // Attack
    gain.gain.linearRampToValueAtTime(this.volume * 0.1, now + this.attack)
    // Release
    gain.gain.linearRampToValueAtTime(0, now + duration)

    source.stop(now + duration + 0.1)

    setTimeout(function () {
      gain.disconnect()
    }, duration * 1000 + 200)
  }
}
