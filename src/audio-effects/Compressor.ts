import {
  getContext,
  initValue,
  Super,
  BOOLEAN,
  FLOAT,
  dbToWAVolume,
} from './common'

const Compressor = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.compNode = this.activateNode = userContext.createDynamicsCompressor()
  this.makeupNode = userContext.createGain()
  this.output = userContext.createGain()

  this.compNode.connect(this.makeupNode)
  this.makeupNode.connect(this.output)

  this.automakeup = initValue(
    properties.automakeup,
    this.defaults.automakeup.value
  )

  //don't use makeupGain setter at initialization to avoid smoothing
  if (this.automakeup) {
    this.makeupNode.gain.value = dbToWAVolume(this.computeMakeup())
  } else {
    this.makeupNode.gain.value = dbToWAVolume(
      initValue(properties.makeupGain, this.defaults.makeupGain.value)
    )
  }
  this.threshold = initValue(
    properties.threshold,
    this.defaults.threshold.value
  )
  this.release = initValue(properties.release, this.defaults.release.value)
  this.attack = initValue(properties.attack, this.defaults.attack.value)
  this.ratio = properties.ratio || this.defaults.ratio.value
  this.knee = initValue(properties.knee, this.defaults.knee.value)
  this.bypass = properties.bypass || this.defaults.bypass.value
}
Compressor.prototype = Object.create(Super, {
  name: {
    value: 'Compressor',
  },
  defaults: {
    writable: true,
    value: {
      threshold: {
        value: -20,
        min: -60,
        max: 0,
        automatable: true,
        type: FLOAT,
      },
      release: {
        value: 250,
        min: 10,
        max: 2000,
        automatable: true,
        type: FLOAT,
      },
      makeupGain: {
        value: 1,
        min: 1,
        max: 100,
        automatable: true,
        type: FLOAT,
      },
      attack: {
        value: 1,
        min: 0,
        max: 1000,
        automatable: true,
        type: FLOAT,
      },
      ratio: {
        value: 4,
        min: 1,
        max: 50,
        automatable: true,
        type: FLOAT,
      },
      knee: {
        value: 5,
        min: 0,
        max: 40,
        automatable: true,
        type: FLOAT,
      },
      automakeup: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
      bypass: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
    },
  },
  computeMakeup: {
    value: function () {
      var magicCoefficient = 4, // raise me if the output is too hot
        c = this.compNode
      return (
        -(c.threshold.value - c.threshold.value / c.ratio.value) /
        magicCoefficient
      )
    },
  },
  automakeup: {
    enumerable: true,
    get: function () {
      return this._automakeup
    },
    set: function (value) {
      this._automakeup = value
      if (this._automakeup) this.makeupGain = this.computeMakeup()
    },
  },
  threshold: {
    enumerable: true,
    get: function () {
      return this.compNode.threshold
    },
    set: function (value) {
      this.compNode.threshold.value = value
      if (this._automakeup) this.makeupGain = this.computeMakeup()
    },
  },
  ratio: {
    enumerable: true,
    get: function () {
      return this.compNode.ratio
    },
    set: function (value) {
      this.compNode.ratio.value = value
      if (this._automakeup) this.makeupGain = this.computeMakeup()
    },
  },
  knee: {
    enumerable: true,
    get: function () {
      return this.compNode.knee
    },
    set: function (value) {
      this.compNode.knee.value = value
      if (this._automakeup) this.makeupGain = this.computeMakeup()
    },
  },
  attack: {
    enumerable: true,
    get: function () {
      return this.compNode.attack
    },
    set: function (value) {
      this.compNode.attack.value = value / 1000
    },
  },
  release: {
    enumerable: true,
    get: function () {
      return this.compNode.release
    },
    set: function (value) {
      this.compNode.release.value = value / 1000
    },
  },
  makeupGain: {
    enumerable: true,
    get: function () {
      return this.makeupNode.gain
    },
    set: function (value) {
      this.makeupNode.gain.setTargetAtTime(
        dbToWAVolume(value),
        this.userContext.currentTime,
        0.01
      )
    },
  },
})

export default Compressor
