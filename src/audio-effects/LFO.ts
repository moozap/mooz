import { getContext, initValue, Super, BOOLEAN, FLOAT } from './common'

const LFO = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  //Instantiate AudioNode
  this.input = userContext.createGain()
  this.output = userContext.createScriptProcessor(256, 1, 1)
  this.activateNode = userContext.destination

  //Set Properties
  this.frequency = initValue(
    properties.frequency,
    this.defaults.frequency.value
  )
  this.offset = initValue(properties.offset, this.defaults.offset.value)
  this.oscillation = initValue(
    properties.oscillation,
    this.defaults.oscillation.value
  )
  this.phase = initValue(properties.phase, this.defaults.phase.value)
  this.target = properties.target || {}
  this.output.onaudioprocess = this.callback(
    properties.callback || function () {}
  )
  this.bypass = properties.bypass || this.defaults.bypass.value
}

LFO.prototype = Object.create(Super, {
  name: {
    value: 'LFO',
  },
  bufferSize: {
    value: 256,
  },
  sampleRate: {
    value: 44100,
  },
  defaults: {
    value: {
      frequency: {
        value: 1,
        min: 0,
        max: 20,
        automatable: false,
        type: FLOAT,
      },
      offset: {
        value: 0.85,
        min: 0,
        max: 22049,
        automatable: false,
        type: FLOAT,
      },
      oscillation: {
        value: 0.3,
        min: -22050,
        max: 22050,
        automatable: false,
        type: FLOAT,
      },
      phase: {
        value: 0,
        min: 0,
        max: 2 * Math.PI,
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
  frequency: {
    get: function () {
      return this._frequency
    },
    set: function (value) {
      this._frequency = value
      this._phaseInc =
        (2 * Math.PI * this._frequency * this.bufferSize) / this.sampleRate
    },
  },
  offset: {
    get: function () {
      return this._offset
    },
    set: function (value) {
      this._offset = value
    },
  },
  oscillation: {
    get: function () {
      return this._oscillation
    },
    set: function (value) {
      this._oscillation = value
    },
  },
  phase: {
    get: function () {
      return this._phase
    },
    set: function (value) {
      this._phase = value
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
      if (doActivate) {
        this.output.connect(this.userContext.destination)
        if (this.activateCallback) {
          this.activateCallback(doActivate)
        }
      } else {
        this.output.disconnect()
      }
    },
  },
  callback: {
    value: function (callback) {
      var that = this
      return function () {
        that._phase += that._phaseInc
        if (that._phase > 2 * Math.PI) {
          that._phase = 0
        }
        callback(
          that._target,
          that._offset + that._oscillation * Math.sin(that._phase)
        )
      }
    },
  },
})

export default LFO
