import { getContext, initValue, Super, BOOLEAN, FLOAT, STRING } from './common'

const Filter = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.activateNode = userContext.createGain()
  this.filter = userContext.createBiquadFilter()
  this.output = userContext.createGain()

  this.activateNode.connect(this.filter)
  this.filter.connect(this.output)

  //don't use setters for freq and gain at init to avoid smoothing
  this.filter.frequency.value =
    properties.frequency || this.defaults.frequency.value
  this.Q = properties.resonance || this.defaults.Q.value
  this.filterType = initValue(
    properties.filterType,
    this.defaults.filterType.value
  )
  this.filter.gain.value = initValue(properties.gain, this.defaults.gain.value)
  this.bypass = properties.bypass || this.defaults.bypass.value
}
Filter.prototype = Object.create(Super, {
  name: {
    value: 'Filter',
  },
  defaults: {
    writable: true,
    value: {
      frequency: {
        value: 800,
        min: 20,
        max: 22050,
        automatable: true,
        type: FLOAT,
      },
      Q: {
        value: 1,
        min: 0.001,
        max: 100,
        automatable: true,
        type: FLOAT,
      },
      gain: {
        value: 0,
        min: -40,
        max: 40,
        automatable: true,
        type: FLOAT,
      },
      bypass: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
      filterType: {
        value: 'lowpass',
        automatable: false,
        type: STRING,
      },
    },
  },
  filterType: {
    enumerable: true,
    get: function () {
      return this.filter.type
    },
    set: function (value) {
      this.filter.type = value
    },
  },
  Q: {
    enumerable: true,
    get: function () {
      return this.filter.Q
    },
    set: function (value) {
      this.filter.Q.value = value
    },
  },
  gain: {
    enumerable: true,
    get: function () {
      return this.filter.gain
    },
    set: function (value) {
      this.filter.gain.setTargetAtTime(
        value,
        this.userContext.currentTime,
        0.01
      )
    },
  },
  frequency: {
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

export default Filter
