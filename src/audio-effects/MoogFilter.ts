import { getContext, initValue, Super, INT, BOOLEAN, FLOAT } from './common'

const MoogFilter = function (properties) {
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

  var in1, in2, in3, in4, out1, out2, out3, out4
  in1 = in2 = in3 = in4 = out1 = out2 = out3 = out4 = 0.0
  var input, output, f, fb, i, length, inputFactor
  this.processor.onaudioprocess = function (e) {
    input = e.inputBuffer.getChannelData(0)
    output = e.outputBuffer.getChannelData(0)
    f = this.cutoff * 1.16
    inputFactor = 0.35013 * (f * f) * (f * f)
    fb = this.resonance * (1.0 - 0.15 * f * f)
    length = input.length
    for (i = 0; i < length; i++) {
      input[i] -= out4 * fb
      input[i] *= inputFactor
      out1 = input[i] + 0.3 * in1 + (1 - f) * out1 // Pole 1
      in1 = input[i]
      out2 = out1 + 0.3 * in2 + (1 - f) * out2 // Pole 2
      in2 = out1
      out3 = out2 + 0.3 * in3 + (1 - f) * out3 // Pole 3
      in3 = out2
      out4 = out3 + 0.3 * in4 + (1 - f) * out4 // Pole 4
      in4 = out3
      output[i] = out4
    }
  }

  this.cutoff = initValue(properties.cutoff, this.defaults.cutoff.value)
  this.resonance = initValue(
    properties.resonance,
    this.defaults.resonance.value
  )
  this.bypass = properties.bypass || this.defaults.bypass.value
}
MoogFilter.prototype = Object.create(Super, {
  name: {
    value: 'MoogFilter',
  },
  defaults: {
    writable: true,
    value: {
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
      cutoff: {
        value: 0.065,
        min: 0.0001,
        max: 1.0,
        automatable: false,
        type: FLOAT,
      },
      resonance: {
        value: 3.5,
        min: 0.0,
        max: 4.0,
        automatable: false,
        type: FLOAT,
      },
    },
  },
  cutoff: {
    enumerable: true,
    get: function () {
      return this.processor.cutoff
    },
    set: function (value) {
      this.processor.cutoff = value
    },
  },
  resonance: {
    enumerable: true,
    get: function () {
      return this.processor.resonance
    },
    set: function (value) {
      this.processor.resonance = value
    },
  },
})

export default MoogFilter
