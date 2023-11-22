import { getContext, initValue, Super, BOOLEAN, FLOAT } from './common'

const Delay = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.activateNode = userContext.createGain()
  this.dry = userContext.createGain()
  this.wet = userContext.createGain()
  this.filter = userContext.createBiquadFilter()
  this.delay = userContext.createDelay(10)
  this.feedbackNode = userContext.createGain()
  this.output = userContext.createGain()

  this.activateNode.connect(this.delay)
  this.activateNode.connect(this.dry)
  this.delay.connect(this.filter)
  this.filter.connect(this.feedbackNode)
  this.feedbackNode.connect(this.delay)
  this.feedbackNode.connect(this.wet)
  this.wet.connect(this.output)
  this.dry.connect(this.output)

  this.delayTime = properties.delayTime || this.defaults.delayTime.value
  //don't use setters at init to avoid smoothing
  this.feedbackNode.gain.value = initValue(
    properties.feedback,
    this.defaults.feedback.value
  )
  this.wet.gain.value = initValue(
    properties.wetLevel,
    this.defaults.wetLevel.value
  )
  this.dry.gain.value = initValue(
    properties.dryLevel,
    this.defaults.dryLevel.value
  )
  this.filter.frequency.value = properties.cutoff || this.defaults.cutoff.value
  this.filter.type = 'lowpass'
  this.bypass = properties.bypass || this.defaults.bypass.value
}
Delay.prototype = Object.create(Super, {
  name: {
    value: 'Delay',
  },
  defaults: {
    writable: true,
    value: {
      delayTime: {
        value: 100,
        min: 20,
        max: 1000,
        automatable: false,
        type: FLOAT,
      },
      feedback: {
        value: 0.45,
        min: 0,
        max: 0.9,
        automatable: true,
        type: FLOAT,
      },
      cutoff: {
        value: 20000,
        min: 20,
        max: 20000,
        automatable: true,
        type: FLOAT,
      },
      wetLevel: {
        value: 0.5,
        min: 0,
        max: 1,
        automatable: true,
        type: FLOAT,
      },
      dryLevel: {
        value: 1,
        min: 0,
        max: 1,
        automatable: true,
        type: FLOAT,
      },
      bypass: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
    },
  },
  delayTime: {
    enumerable: true,
    get: function () {
      return this.delay.delayTime
    },
    set: function (value) {
      this.delay.delayTime.value = value / 1000
    },
  },
  wetLevel: {
    enumerable: true,
    get: function () {
      return this.wet.gain
    },
    set: function (value) {
      this.wet.gain.setTargetAtTime(value, this.userContext.currentTime, 0.01)
    },
  },
  dryLevel: {
    enumerable: true,
    get: function () {
      return this.dry.gain
    },
    set: function (value) {
      this.dry.gain.setTargetAtTime(value, this.userContext.currentTime, 0.01)
    },
  },
  feedback: {
    enumerable: true,
    get: function () {
      return this.feedbackNode.gain
    },
    set: function (value) {
      this.feedbackNode.gain.setTargetAtTime(
        value,
        this.userContext.currentTime,
        0.01
      )
    },
  },
  cutoff: {
    enumerable: true,
    get: function () {
      return this.filter.frequency
    },
    set: function (value) {
      this.filter.frequency.setTargetAtTime(
        value,
        this.userContext.currentTime,
        0.01
      )
    },
  },
})

export default Delay
