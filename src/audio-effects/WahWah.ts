import { getContext, initValue, Super, BOOLEAN, FLOAT } from './common'
import EnvelopeFollower from './EnvelopeFollower'

const WahWah = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.activateNode = userContext.createGain()
  this.envelopeFollower = new EnvelopeFollower({
    target: this,
    callback: function (context, value) {
      context.sweep = value
    },
  })
  this.filterBp = userContext.createBiquadFilter()
  this.filterPeaking = userContext.createBiquadFilter()
  this.output = userContext.createGain()

  //Connect AudioNodes
  this.activateNode.connect(this.filterBp)
  this.filterBp.connect(this.filterPeaking)
  this.filterPeaking.connect(this.output)

  //Set Properties
  this.init()
  this.automode = initValue(properties.automode, this.defaults.automode.value)
  this.resonance = properties.resonance || this.defaults.resonance.value
  this.sensitivity = initValue(
    properties.sensitivity,
    this.defaults.sensitivity.value
  )
  this.baseFrequency = initValue(
    properties.baseFrequency,
    this.defaults.baseFrequency.value
  )
  this.excursionOctaves =
    properties.excursionOctaves || this.defaults.excursionOctaves.value
  this.sweep = initValue(properties.sweep, this.defaults.sweep.value)

  this.activateNode.gain.value = 2
  this.envelopeFollower.activate(true)
  this.bypass = properties.bypass || this.defaults.bypass.value
}

WahWah.prototype = Object.create(Super, {
  name: {
    value: 'WahWah',
  },
  defaults: {
    writable: true,
    value: {
      automode: {
        value: true,
        automatable: false,
        type: BOOLEAN,
      },
      baseFrequency: {
        value: 0.153,
        min: 0,
        max: 1,
        automatable: false,
        type: FLOAT,
      },
      excursionOctaves: {
        value: 3.3,
        min: 1,
        max: 6,
        automatable: false,
        type: FLOAT,
      },
      sweep: {
        value: 0.35,
        min: 0,
        max: 1,
        automatable: false,
        type: FLOAT,
      },
      resonance: {
        value: 19,
        min: 1,
        max: 100,
        automatable: false,
        type: FLOAT,
      },
      sensitivity: {
        value: -0.5,
        min: -1,
        max: 1,
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
  automode: {
    get: function () {
      return this._automode
    },
    set: function (value) {
      this._automode = value
      if (value) {
        this.activateNode.connect(this.envelopeFollower.input)
        this.envelopeFollower.activate(true)
      } else {
        this.envelopeFollower.activate(false)
        this.activateNode.disconnect()
        this.activateNode.connect(this.filterBp)
      }
    },
  },
  filterFreqTimeout: {
    writable: true,
    value: 0,
  },
  setFilterFreq: {
    value: function () {
      try {
        this.filterBp.frequency.value = Math.min(
          22050,
          this._baseFrequency + this._excursionFrequency * this._sweep
        )
        this.filterPeaking.frequency.value = Math.min(
          22050,
          this._baseFrequency + this._excursionFrequency * this._sweep
        )
      } catch (e) {
        clearTimeout(this.filterFreqTimeout)
        //put on the next cycle to let all init properties be set
        this.filterFreqTimeout = setTimeout(
          function () {
            this.setFilterFreq()
          }.bind(this),
          0
        )
      }
    },
  },
  sweep: {
    enumerable: true,
    get: function () {
      return this._sweep
    },
    set: function (value) {
      this._sweep = Math.pow(
        value > 1 ? 1 : value < 0 ? 0 : value,
        this._sensitivity
      )
      this.setFilterFreq()
    },
  },
  baseFrequency: {
    enumerable: true,
    get: function () {
      return this._baseFrequency
    },
    set: function (value) {
      this._baseFrequency = 50 * Math.pow(10, value * 2)
      this._excursionFrequency = Math.min(
        this.userContext.sampleRate / 2,
        this.baseFrequency * Math.pow(2, this._excursionOctaves)
      )
      this.setFilterFreq()
    },
  },
  excursionOctaves: {
    enumerable: true,
    get: function () {
      return this._excursionOctaves
    },
    set: function (value) {
      this._excursionOctaves = value
      this._excursionFrequency = Math.min(
        this.userContext.sampleRate / 2,
        this.baseFrequency * Math.pow(2, this._excursionOctaves)
      )
      this.setFilterFreq()
    },
  },
  sensitivity: {
    enumerable: true,
    get: function () {
      return this._sensitivity
    },
    set: function (value) {
      this._sensitivity = Math.pow(10, value)
    },
  },
  resonance: {
    enumerable: true,
    get: function () {
      return this._resonance
    },
    set: function (value) {
      this._resonance = value
      this.filterPeaking.Q.value = this._resonance
    },
  },
  init: {
    value: function () {
      this.output.gain.value = 1
      this.filterPeaking.type = 'peaking'
      this.filterBp.type = 'bandpass'
      this.filterPeaking.frequency.value = 100
      this.filterPeaking.gain.value = 20
      this.filterPeaking.Q.value = 5
      this.filterBp.frequency.value = 100
      this.filterBp.Q.value = 1
    },
  },
})

export default WahWah
