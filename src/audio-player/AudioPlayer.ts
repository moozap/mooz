// @ts-nocheck
import { createADSRNode } from './adsr'
import { getAudioContext } from '../audio-context'
import type { Player, NoteEvent } from '../player'

export type AudioPlayerState = {
  gain: number
  attack: number
  decay: number
  sustain: number
  release: number
  cents: number

  volume: number

  loop: boolean
  loopStart: number
  loopEnd: number
}

export type AudioBufferMap = {
  [key: string]: AudioBuffer
}

export type AudioNoteEvent = NoteEvent & {
  pitchShift?: number
}

const initState: AudioPlayerState = {
  gain: 1,
  attack: 0.01,
  decay: 0.1,
  sustain: 0.9,
  release: 0.3,
  cents: 0,
  loop: false,
  loopStart: 0,
  loopEnd: 0,
  volume: 100,
}

const envParams = ['attack', 'decay', 'sustain', 'release']

/**
 * Get playback rate for a given pitch change in cents (1200 cents = 1 semitone)
 * rate = 2 ^ ( cents / 1200 )
 * f2 = f1 * rate
 */
function centsToRate(cents) {
  return cents ? Math.pow(2, cents / 1200) : 1
}

export type AudioPlayerProps = {
  buffers?: AudioBufferMap
  autoPitchShift?: boolean
}

export class AudioPlayer implements Player {
  context: AudioContext = getAudioContext() as AudioContext
  connected: boolean = false
  output: GainNode

  autoPitchShift: boolean = false
  nextId: number = 0
  tracked = {}

  state: AudioPlayerState

  buffers: AudioBufferMap = {}

  constructor(
    props: AudioPlayerProps = {}
  ) {
    const { buffers = {}, autoPitchShift = false, ...options } = props

    Object.assign(this, {
      buffers,
      autoPitchShift,
      state: {
        ...initState,
        ...options, // envParams
      },
    })

    this.output = this.context.createGain()
    this.setVolume(this.state.volume)
  }

  setBuffer(name, buffer) {
    this.buffers[name] = buffer
  }

  setBuffers(buffers) {
    Object.assign(this.buffers, buffers)
  }

  clearBuffers() {
    this.buffers = {}
  }

  getVolume() {
    return this.state.volume
  }

  setVolume(volume = 100) {
    // Volume = 0~100
    this.state.volume = volume
    this.output.gain.value = (volume / 100) * this.state.gain
  }

  play(event: AudioNoteEvent) {
    if (event.type && event.type !== 'note') {
      // Control event
      return
    }

    if (!this.connected) {
      return console.warn('Audio player not connected')
    }

    if (typeof event.note === 'undefined') {
      return console.warn('No note for audio player', event, this)
    }

    const {
      note, // 0~127
      playbackTime = 0,
      duration = 0, // 0 = Let sound finish
      velocity = 100, // 0~127

      loop,
      loopStart,
      loopEnd,

      // ...adsrOptions
    } = event

    let { pitchShift = 0 } = event
    let buffer = this.buffers[note]

    if (!buffer) {
      // TODO: Alias map

      // Optionally find closest buffer and pitch shift

      if (this.autoPitchShift && typeof note === 'number') {
        const diff = this.findClosestDiff(note)
        if (typeof diff === 'number') {
          pitchShift += diff
          buffer = this.buffers[note - diff]
        }
      }

      if (!buffer) {
        return console.warn('Buffer not found for note', note, this)
      }
    }

    // Velocity map

    // Velocity scaled to player volume
    const gain = (velocity / 127) * (this.state.volume / 100)

    const node = this.createNode(buffer, {
      gain,
      pitchShift,
      loop,
      loopStart,
      loopEnd,
    })

    node.id = this.trackNode(node)

    // Playback time
    const contextTime = Math.max(this.context.currentTime, playbackTime)

    node.env.start(contextTime)
    node.source.start(contextTime)

    if (duration > 0) node.stop(contextTime + duration)

    return node
  }

  setAdsrOptions(adsrOptions) {
    for (const key of Object.keys(adsrOptions)) {
      if (this.state[key] !== undefined) {
        this.state[key] = adsrOptions[key]
      }
    }
  }

  /**
   * Returns the difference in steps between the given midi note and the closest sample
   * Based on logic from tonejs/Tone/instrument/Sampler.ts
   */
  findClosestDiff(midi) {
    // Search within 8 octaves of the given midi note
    const maxInterval = 96

    let interval = 0
    while (interval < maxInterval) {
      // Check above and below
      if (this.buffers[midi + interval]) {
        return -interval
      } else if (this.buffers[midi - interval]) {
        return interval
      }
      interval++
    }

    return false
  }

  stop(playbackTime, ids) {
    let node
    ids = ids || Object.keys(this.tracked)
    return ids.map((id) => {
      node = this.tracked[id]
      if (!node) return null
      node.stop(playbackTime)
      return node.id
    })
  }

  connect(dest) {
    if (this.connected && this.dest) {
      this.output.disconnect(this.dest)
    }
    this.connected = true
    this.output.connect(dest)
    this.dest = dest
    return this
  }

  setMute(mute = true) {
    if (!mute) {
      this.setVolume(this.previousVolume)
      return
    }

    this.previousVolume = this.state.volume
    this.setVolume(0)
  }

  trackNode(node) {
    node.id = this.nextId++

    this.tracked[node.id] = node

    node.source.onended = () => {
      node.source.disconnect()
      node.env.disconnect()
      node.disconnect()

      delete this.tracked[node.id]
    }

    return node.id
  }

  createNode(buffer, options) {
    const node = this.context.createGain()

    node.gain.value = 0 // the envelope will control the gain
    node.connect(this.output)

    // Envelope
    node.env = this.createEnvelope(options)
    node.env.connect(node.gain)

    // Buffer source
    node.source = this.context.createBufferSource()
    node.source.buffer = buffer
    node.source.connect(node)

    node.source.loop = options.loop || this.state.loop
    node.source.loopStart = options.loopStart || this.state.loopStart
    node.source.loopEnd = options.loopEnd || this.state.loopEnd

    node.source.playbackRate.value = centsToRate(
      typeof options.pitchShift !== 'undefined'
        ? options.pitchShift * 100 // Each semi-tone is 100 cents
        : typeof options.cents !== 'undefined'
        ? options.cents
        : this.state.cents
    )

    node.stop = (playbackTime) => {
      const time = playbackTime || this.context.currentTime
      const stopAt = node.env.stop(time)
      node.source.stop(stopAt)
    }

    return node
  }

  createEnvelope(options) {
    const env = createADSRNode(this.context)
    const adsr = options.adsr || this.state.adsr

    envParams.forEach((name, i) => {
      if (adsr) {
        env[name] = adsr[i]
      } else {
        env[name] = options[name] || this.state[name]
      }
    })

    env.value.value =
      typeof options.gain === 'number'
        ? options.gain
        : typeof this.state.gain === 'number'
        ? this.state.gain
        : 1

    return env
  }
}
