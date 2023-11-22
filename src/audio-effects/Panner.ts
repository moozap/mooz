import { getContext, initValue, Super, BOOLEAN, FLOAT } from './common'

const Panner = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = getContext(properties.context)

  this.input = userContext.createGain()
  this.activateNode = userContext.createGain()
  this.panner = userContext.createStereoPanner()
  this.output = userContext.createGain()

  this.activateNode.connect(this.panner)
  this.panner.connect(this.output)

  this.pan = initValue(properties.pan, this.defaults.pan.value)
  this.bypass = properties.bypass || this.defaults.bypass.value
}

Panner.prototype = Object.create(Super, {
  name: {
    value: 'Panner',
  },
  defaults: {
    writable: true,
    value: {
      bypass: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
      pan: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        automatable: true,
        type: FLOAT,
      },
    },
  },
  pan: {
    enumerable: true,
    get: function () {
      return this.panner.pan
    },
    set: function (value) {
      this.panner.pan.value = value
    },
  },
})

export default Panner
