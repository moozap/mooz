import { getContext, initValue, Super, BOOLEAN, FLOAT } from './common'

const EnvelopeFollower = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.jsNode = this.output = userContext.createScriptProcessor(
    this.buffersize,
    1,
    1
  )

  this.input.connect(this.output)

  this.attackTime = initValue(
    properties.attackTime,
    this.defaults.attackTime.value
  )
  this.releaseTime = initValue(
    properties.releaseTime,
    this.defaults.releaseTime.value
  )
  this._envelope = 0
  this.target = properties.target || {}
  this.callback = properties.callback || function () {}

  this.bypass = properties.bypass || this.defaults.bypass.value
}

EnvelopeFollower.prototype = Object.create(Super, {
  name: {
    value: 'EnvelopeFollower',
  },
  defaults: {
    value: {
      attackTime: {
        value: 0.003,
        min: 0,
        max: 0.5,
        automatable: false,
        type: FLOAT,
      },
      releaseTime: {
        value: 0.5,
        min: 0,
        max: 0.5,
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
  buffersize: {
    value: 256,
  },
  envelope: {
    value: 0,
  },
  sampleRate: {
    value: 44100,
  },
  attackTime: {
    enumerable: true,
    get: function () {
      return this._attackTime
    },
    set: function (value) {
      this._attackTime = value
      this._attackC = Math.exp(
        ((-1 / this._attackTime) * this.sampleRate) / this.buffersize
      )
    },
  },
  releaseTime: {
    enumerable: true,
    get: function () {
      return this._releaseTime
    },
    set: function (value) {
      this._releaseTime = value
      this._releaseC = Math.exp(
        ((-1 / this._releaseTime) * this.sampleRate) / this.buffersize
      )
    },
  },
  callback: {
    get: function () {
      return this._callback
    },
    set: function (value) {
      if (typeof value === 'function') {
        this._callback = value
      } else {
        console.error(
          'tuna.js: ' + this.name + ': Callback must be a function!'
        )
      }
    },
  },
  target: {
    get: function () {
      return this._target
    },
    set: function (value) {
      this._target = value
    },
  },
  activate: {
    value: function (doActivate) {
      this.activated = doActivate
      if (doActivate) {
        this.jsNode.connect(this.userContext.destination)
        this.jsNode.onaudioprocess = this.returnCompute(this)
      } else {
        this.jsNode.disconnect()
        this.jsNode.onaudioprocess = null
      }
      if (this.activateCallback) {
        this.activateCallback(doActivate)
      }
    },
  },
  returnCompute: {
    value: function (instance) {
      return function (event) {
        instance.compute(event)
      }
    },
  },
  compute: {
    value: function (event) {
      var count = event.inputBuffer.getChannelData(0).length,
        channels = event.inputBuffer.numberOfChannels,
        current,
        chan,
        rms,
        i
      chan = rms = i = 0

      for (chan = 0; chan < channels; ++chan) {
        for (i = 0; i < count; ++i) {
          current = event.inputBuffer.getChannelData(chan)[i]
          rms += current * current
        }
      }
      rms = Math.sqrt(rms / channels)

      if (this._envelope < rms) {
        this._envelope *= this._attackC
        this._envelope += (1 - this._attackC) * rms
      } else {
        this._envelope *= this._releaseC
        this._envelope += (1 - this._releaseC) * rms
      }
      this._callback(this._target, this._envelope)
    },
  },
})

export default EnvelopeFollower
