import {
  getContext,
  initValue,
  Super,
  BOOLEAN,
  FLOAT,
  pipe,
  fmod,
} from './common'
import LFO from './LFO'

const Tremolo = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = getContext(properties.context)

  this.input = userContext.createGain()
  this.splitter = this.activateNode = userContext.createChannelSplitter(2)
  this.amplitudeL = userContext.createGain()
  this.amplitudeR = userContext.createGain()
  this.merger = userContext.createChannelMerger(2)
  this.output = userContext.createGain()
  this.lfoL = new LFO({
    target: this.amplitudeL.gain,
    callback: pipe,
  })
  this.lfoR = new LFO({
    target: this.amplitudeR.gain,
    callback: pipe,
  })

  this.input.connect(this.splitter)
  this.splitter.connect(this.amplitudeL, 0)
  this.splitter.connect(this.amplitudeR, 1)
  this.amplitudeL.connect(this.merger, 0, 0)
  this.amplitudeR.connect(this.merger, 0, 1)
  this.merger.connect(this.output)

  this.rate = properties.rate || this.defaults.rate.value
  this.intensity = initValue(
    properties.intensity,
    this.defaults.intensity.value
  )
  this.stereoPhase = initValue(
    properties.stereoPhase,
    this.defaults.stereoPhase.value
  )

  this.lfoL.offset = 1 - this.intensity / 2
  this.lfoR.offset = 1 - this.intensity / 2
  this.lfoL.phase = (this.stereoPhase * Math.PI) / 180

  this.lfoL.activate(true)
  this.lfoR.activate(true)
  this.bypass = properties.bypass || this.defaults.bypass.value
}

Tremolo.prototype = Object.create(Super, {
  name: {
    value: 'Tremolo',
  },
  defaults: {
    writable: true,
    value: {
      intensity: {
        value: 0.3,
        min: 0,
        max: 1,
        automatable: false,
        type: FLOAT,
      },
      stereoPhase: {
        value: 0,
        min: 0,
        max: 180,
        automatable: false,
        type: FLOAT,
      },
      rate: {
        value: 5,
        min: 0.1,
        max: 11,
        automatable: false,
        type: FLOAT,
      },
      bypass: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
    },
  },
  intensity: {
    enumerable: true,
    get: function () {
      return this._intensity
    },
    set: function (value) {
      this._intensity = value
      this.lfoL.offset = 1 - this._intensity / 2
      this.lfoR.offset = 1 - this._intensity / 2
      this.lfoL.oscillation = this._intensity
      this.lfoR.oscillation = this._intensity
    },
  },
  rate: {
    enumerable: true,
    get: function () {
      return this._rate
    },
    set: function (value) {
      this._rate = value
      this.lfoL.frequency = this._rate
      this.lfoR.frequency = this._rate
    },
  },
  stereoPhase: {
    enumerable: true,
    get: function () {
      return this._stereoPhase
    },
    set: function (value) {
      this._stereoPhase = value
      var newPhase = this.lfoL._phase + (this._stereoPhase * Math.PI) / 180
      newPhase = fmod(newPhase, 2 * Math.PI)
      this.lfoR.phase = newPhase
    },
  },
})

export default Tremolo
