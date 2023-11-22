import { getContext, initValue, Super, BOOLEAN, FLOAT } from './common'
import Convolver from './Convolver'

const Cabinet = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.activateNode = userContext.createGain()
  this.convolver = this.newConvolver(
    properties.impulsePath || '../impulses/impulse_guitar.wav'
  )
  this.makeupNode = userContext.createGain()
  this.output = userContext.createGain()

  this.activateNode.connect(this.convolver.input)
  this.convolver.output.connect(this.makeupNode)
  this.makeupNode.connect(this.output)
  //don't use makeupGain setter at init to avoid smoothing
  this.makeupNode.gain.value = initValue(
    properties.makeupGain,
    this.defaults.makeupGain.value
  )
  this.bypass = properties.bypass || this.defaults.bypass.value
}

Cabinet.prototype = Object.create(Super, {
  name: {
    value: 'Cabinet',
  },
  defaults: {
    writable: true,
    value: {
      makeupGain: {
        value: 1,
        min: 0,
        max: 20,
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
  makeupGain: {
    enumerable: true,
    get: function () {
      return this.makeupNode.gain
    },
    set: function (value) {
      this.makeupNode.gain.setTargetAtTime(
        value,
        this.userContext.currentTime,
        0.01
      )
    },
  },
  newConvolver: {
    value: function (impulsePath) {
      return new Convolver({
        impulse: impulsePath,
        dryLevel: 0,
        wetLevel: 1,
      })
    },
  },
})

export default Cabinet
