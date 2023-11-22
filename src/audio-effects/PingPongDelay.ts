import { getContext, Super, INT, BOOLEAN, FLOAT } from './common'

const PingPongDelay = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.wet = userContext.createGain()
  this.stereoToMonoMix = userContext.createGain()
  this.feedbackLevel = userContext.createGain()
  this.output = userContext.createGain()
  this.delayLeft = userContext.createDelay(10)
  this.delayRight = userContext.createDelay(10)

  this.activateNode = userContext.createGain()
  this.splitter = userContext.createChannelSplitter(2)
  this.merger = userContext.createChannelMerger(2)

  this.activateNode.connect(this.splitter)
  this.splitter.connect(this.stereoToMonoMix, 0, 0)
  this.splitter.connect(this.stereoToMonoMix, 1, 0)
  this.stereoToMonoMix.gain.value = 0.5
  this.stereoToMonoMix.connect(this.wet)
  this.wet.connect(this.delayLeft)
  this.feedbackLevel.connect(this.wet)
  this.delayLeft.connect(this.delayRight)
  this.delayRight.connect(this.feedbackLevel)
  this.delayLeft.connect(this.merger, 0, 0)
  this.delayRight.connect(this.merger, 0, 1)
  this.merger.connect(this.output)
  this.activateNode.connect(this.output)

  this.delayTimeLeft =
    properties.delayTimeLeft !== undefined
      ? properties.delayTimeLeft
      : this.defaults.delayTimeLeft.value
  this.delayTimeRight =
    properties.delayTimeRight !== undefined
      ? properties.delayTimeRight
      : this.defaults.delayTimeRight.value
  this.feedbackLevel.gain.value =
    properties.feedback !== undefined
      ? properties.feedback
      : this.defaults.feedback.value
  this.wet.gain.value =
    properties.wetLevel !== undefined
      ? properties.wetLevel
      : this.defaults.wetLevel.value
  this.bypass = properties.bypass || this.defaults.bypass.value
}

PingPongDelay.prototype = Object.create(Super, {
  name: {
    value: 'PingPongDelay',
  },
  delayTimeLeft: {
    enumerable: true,
    get: function () {
      return this._delayTimeLeft
    },
    set: function (value) {
      this._delayTimeLeft = value
      this.delayLeft.delayTime.value = value / 1000
    },
  },
  delayTimeRight: {
    enumerable: true,
    get: function () {
      return this._delayTimeRight
    },
    set: function (value) {
      this._delayTimeRight = value
      this.delayRight.delayTime.value = value / 1000
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
  feedback: {
    enumerable: true,
    get: function () {
      return this.feedbackLevel.gain
    },
    set: function (value) {
      this.feedbackLevel.gain.setTargetAtTime(
        value,
        this.userContext.currentTime,
        0.01
      )
    },
  },
  defaults: {
    writable: true,
    value: {
      delayTimeLeft: {
        value: 200,
        min: 1,
        max: 10000,
        automatable: false,
        type: INT,
      },
      delayTimeRight: {
        value: 400,
        min: 1,
        max: 10000,
        automatable: false,
        type: INT,
      },
      feedback: {
        value: 0.3,
        min: 0,
        max: 1,
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
      bypass: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
    },
  },
})

export default PingPongDelay
