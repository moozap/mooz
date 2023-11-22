import { getContext, initValue, Super, BOOLEAN, FLOAT, fmod } from './common'
import LFO from './LFO'

const Phaser = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.splitter = this.activateNode = userContext.createChannelSplitter(2)
  this.filtersL = []
  this.filtersR = []
  this.feedbackGainNodeL = userContext.createGain()
  this.feedbackGainNodeR = userContext.createGain()
  this.merger = userContext.createChannelMerger(2)
  this.filteredSignal = userContext.createGain()
  this.output = userContext.createGain()
  this.lfoL = new LFO({
    target: this.filtersL,
    callback: this.callback,
  })
  this.lfoR = new LFO({
    target: this.filtersR,
    callback: this.callback,
  })

  var i = this.stage
  while (i--) {
    this.filtersL[i] = userContext.createBiquadFilter()
    this.filtersR[i] = userContext.createBiquadFilter()
    this.filtersL[i].type = 'allpass'
    this.filtersR[i].type = 'allpass'
  }
  this.input.connect(this.splitter)
  this.input.connect(this.output)
  this.splitter.connect(this.filtersL[0], 0, 0)
  this.splitter.connect(this.filtersR[0], 1, 0)
  this.connectInOrder(this.filtersL)
  this.connectInOrder(this.filtersR)
  this.filtersL[this.stage - 1].connect(this.feedbackGainNodeL)
  this.filtersL[this.stage - 1].connect(this.merger, 0, 0)
  this.filtersR[this.stage - 1].connect(this.feedbackGainNodeR)
  this.filtersR[this.stage - 1].connect(this.merger, 0, 1)
  this.feedbackGainNodeL.connect(this.filtersL[0])
  this.feedbackGainNodeR.connect(this.filtersR[0])
  this.merger.connect(this.output)

  this.rate = initValue(properties.rate, this.defaults.rate.value)
  this.baseModulationFrequency =
    properties.baseModulationFrequency ||
    this.defaults.baseModulationFrequency.value
  this.depth = initValue(properties.depth, this.defaults.depth.value)
  this.feedback = initValue(properties.feedback, this.defaults.feedback.value)
  this.stereoPhase = initValue(
    properties.stereoPhase,
    this.defaults.stereoPhase.value
  )

  this.lfoL.activate(true)
  this.lfoR.activate(true)
  this.bypass = properties.bypass || this.defaults.bypass.value
}

Phaser.prototype = Object.create(Super, {
  name: {
    value: 'Phaser',
  },
  stage: {
    value: 4,
  },
  defaults: {
    writable: true,
    value: {
      rate: {
        value: 0.1,
        min: 0,
        max: 8,
        automatable: false,
        type: FLOAT,
      },
      depth: {
        value: 0.6,
        min: 0,
        max: 1,
        automatable: false,
        type: FLOAT,
      },
      feedback: {
        value: 0.7,
        min: 0,
        max: 1,
        automatable: false,
        type: FLOAT,
      },
      stereoPhase: {
        value: 40,
        min: 0,
        max: 180,
        automatable: false,
        type: FLOAT,
      },
      baseModulationFrequency: {
        value: 700,
        min: 500,
        max: 1500,
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
  callback: {
    value: function (filters, value) {
      for (var stage = 0; stage < 4; stage++) {
        filters[stage].frequency.value = value
      }
    },
  },
  depth: {
    get: function () {
      return this._depth
    },
    set: function (value) {
      this._depth = value
      this.lfoL.oscillation = this._baseModulationFrequency * this._depth
      this.lfoR.oscillation = this._baseModulationFrequency * this._depth
    },
  },
  rate: {
    get: function () {
      return this._rate
    },
    set: function (value) {
      this._rate = value
      this.lfoL.frequency = this._rate
      this.lfoR.frequency = this._rate
    },
  },
  baseModulationFrequency: {
    enumerable: true,
    get: function () {
      return this._baseModulationFrequency
    },
    set: function (value) {
      this._baseModulationFrequency = value
      this.lfoL.offset = this._baseModulationFrequency
      this.lfoR.offset = this._baseModulationFrequency
      this.depth = this._depth
    },
  },
  feedback: {
    get: function () {
      return this._feedback
    },
    set: function (value) {
      this._feedback = value
      this.feedbackGainNodeL.gain.setTargetAtTime(
        this._feedback,
        this.userContext.currentTime,
        0.01
      )
      this.feedbackGainNodeR.gain.setTargetAtTime(
        this._feedback,
        this.userContext.currentTime,
        0.01
      )
    },
  },
  stereoPhase: {
    get: function () {
      return this._stereoPhase
    },
    set: function (value) {
      this._stereoPhase = value
      var newPhase = this.lfoL._phase + (this._stereoPhase * Math.PI) / 180
      newPhase = fmod(newPhase, 2 * Math.PI)
      this.lfoR._phase = newPhase
    },
  },
})

export default Phaser
