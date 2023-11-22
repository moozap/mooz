import { getContext, initValue, Super, BOOLEAN, FLOAT, pipe } from './common'
import LFO from './LFO'

const Chorus = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = getContext(properties.context)

  this.input = userContext.createGain()
  this.attenuator = this.activateNode = userContext.createGain()
  this.splitter = userContext.createChannelSplitter(2)
  this.delayL = userContext.createDelay()
  this.delayR = userContext.createDelay()
  this.feedbackGainNodeLR = userContext.createGain()
  this.feedbackGainNodeRL = userContext.createGain()
  this.merger = userContext.createChannelMerger(2)
  this.output = userContext.createGain()

  this.lfoL = new LFO({
    target: this.delayL.delayTime,
    callback: pipe,
  })
  this.lfoR = new LFO({
    target: this.delayR.delayTime,
    callback: pipe,
  })

  this.input.connect(this.attenuator)
  this.attenuator.connect(this.output)
  this.attenuator.connect(this.splitter)
  this.splitter.connect(this.delayL, 0)
  this.splitter.connect(this.delayR, 1)
  this.delayL.connect(this.feedbackGainNodeLR)
  this.delayR.connect(this.feedbackGainNodeRL)
  this.feedbackGainNodeLR.connect(this.delayR)
  this.feedbackGainNodeRL.connect(this.delayL)
  this.delayL.connect(this.merger, 0, 0)
  this.delayR.connect(this.merger, 0, 1)
  this.merger.connect(this.output)

  this.feedback = initValue(properties.feedback, this.defaults.feedback.value)
  this.rate = initValue(properties.rate, this.defaults.rate.value)
  this.delay = initValue(properties.delay, this.defaults.delay.value)
  this.depth = initValue(properties.depth, this.defaults.depth.value)
  this.lfoR.phase = Math.PI / 2
  this.attenuator.gain.value = 0.6934 // 1 / (10 ^ (((20 * log10(3)) / 3) / 20))
  this.lfoL.activate(true)
  this.lfoR.activate(true)
  this.bypass = properties.bypass || this.defaults.bypass.value
}

Chorus.prototype = Object.create(Super, {
  name: {
    value: 'Chorus',
  },
  defaults: {
    writable: true,
    value: {
      feedback: {
        value: 0.4,
        min: 0,
        max: 0.95,
        automatable: false,
        type: FLOAT,
      },
      delay: {
        value: 0.0045,
        min: 0,
        max: 1,
        automatable: false,
        type: FLOAT,
      },
      depth: {
        value: 0.7,
        min: 0,
        max: 1,
        automatable: false,
        type: FLOAT,
      },
      rate: {
        value: 1.5,
        min: 0,
        max: 8,
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
  delay: {
    enumerable: true,
    get: function () {
      return this._delay
    },
    set: function (value) {
      this._delay = 0.0002 * (Math.pow(10, value) * 2)
      this.lfoL.offset = this._delay
      this.lfoR.offset = this._delay
      // this._depth = this._depth
    },
  },
  depth: {
    enumerable: true,
    get: function () {
      return this._depth
    },
    set: function (value) {
      this._depth = value
      this.lfoL.oscillation = this._depth * this._delay
      this.lfoR.oscillation = this._depth * this._delay
    },
  },
  feedback: {
    enumerable: true,
    get: function () {
      return this._feedback
    },
    set: function (value) {
      this._feedback = value
      this.feedbackGainNodeLR.gain.setTargetAtTime(
        this._feedback,
        this.userContext.currentTime,
        0.01
      )
      this.feedbackGainNodeRL.gain.setTargetAtTime(
        this._feedback,
        this.userContext.currentTime,
        0.01
      )
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
})

export default Chorus
