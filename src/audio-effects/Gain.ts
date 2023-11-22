import { getContext, initValue, Super, BOOLEAN, FLOAT } from './common'

const Gain = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.activateNode = userContext.createGain()
  this.gainNode = userContext.createGain()
  this.output = userContext.createGain()

  this.activateNode.connect(this.gainNode)
  this.gainNode.connect(this.output)

  //don't use setter at init to avoid smoothing
  this.gainNode.gain.value = initValue(
    properties.gain,
    this.defaults.gain.value
  )
  this.bypass = properties.bypass || this.defaults.bypass.value
}

Gain.prototype = Object.create(Super, {
  name: {
    value: 'Gain',
  },
  defaults: {
    writable: true,
    value: {
      bypass: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
      gain: {
        value: 1.0,
        automatable: true,
        type: FLOAT,
      },
    },
  },
  gain: {
    enumerable: true,
    get: function () {
      return this.gainNode.gain
    },
    set: function (value) {
      this.gainNode.gain.setTargetAtTime(
        value,
        this.userContext.currentTime,
        0.01
      )
    },
  },
})

export default Gain
