import { getContext, initValue, Super, INT, BOOLEAN, FLOAT } from './common'

const Bitcrusher = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = getContext(properties.context)

  this.bufferSize = properties.bufferSize || this.defaults.bufferSize.value

  this.input = userContext.createGain()
  this.activateNode = userContext.createGain()
  this.processor = userContext.createScriptProcessor(this.bufferSize, 1, 1)
  this.output = userContext.createGain()

  this.activateNode.connect(this.processor)
  this.processor.connect(this.output)

  var phaser = 0,
    last = 0,
    input,
    output,
    step,
    i,
    length
  this.processor.onaudioprocess = function (e) {
    ;(input = e.inputBuffer.getChannelData(0)),
      (output = e.outputBuffer.getChannelData(0)),
      (step = Math.pow(1 / 2, this.bits))
    length = input.length
    for (i = 0; i < length; i++) {
      phaser += this.normfreq
      if (phaser >= 1.0) {
        phaser -= 1.0
        last = step * Math.floor(input[i] / step + 0.5)
      }
      output[i] = last
    }
  }

  this.bits = properties.bits || this.defaults.bits.value
  this.normfreq = initValue(properties.normfreq, this.defaults.normfreq.value)
  this.bypass = properties.bypass || this.defaults.bypass.value
}

Bitcrusher.prototype = Object.create(Super, {
  name: {
    value: 'Bitcrusher',
  },
  defaults: {
    writable: true,
    value: {
      bits: {
        value: 4,
        min: 1,
        max: 16,
        automatable: false,
        type: INT,
      },
      bufferSize: {
        value: 4096,
        min: 256,
        max: 16384,
        automatable: false,
        type: INT,
      },
      bypass: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
      normfreq: {
        value: 0.1,
        min: 0.0001,
        max: 1.0,
        automatable: false,
        type: FLOAT,
      },
    },
  },
  bits: {
    enumerable: true,
    get: function () {
      return this.processor.bits
    },
    set: function (value) {
      this.processor.bits = value
    },
  },
  normfreq: {
    enumerable: true,
    get: function () {
      return this.processor.normfreq
    },
    set: function (value) {
      this.processor.normfreq = value
    },
  },
})

export default Bitcrusher
