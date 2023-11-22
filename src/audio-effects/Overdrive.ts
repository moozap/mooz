import {
  getContext,
  initValue,
  Super,
  INT,
  BOOLEAN,
  FLOAT,
  sign,
  tanh,
  dbToWAVolume,
} from './common'

const Overdrive = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.activateNode = userContext.createGain()
  this.inputDrive = userContext.createGain()
  this.waveshaper = userContext.createWaveShaper()
  this.outputDrive = userContext.createGain()
  this.output = userContext.createGain()

  this.activateNode.connect(this.inputDrive)
  this.inputDrive.connect(this.waveshaper)
  this.waveshaper.connect(this.outputDrive)
  this.outputDrive.connect(this.output)

  this.ws_table = new Float32Array(this.k_nSamples)
  this.drive = initValue(properties.drive, this.defaults.drive.value)
  this.outputGain = initValue(
    properties.outputGain,
    this.defaults.outputGain.value
  )
  this.curveAmount = initValue(
    properties.curveAmount,
    this.defaults.curveAmount.value
  )
  this.algorithmIndex = initValue(
    properties.algorithmIndex,
    this.defaults.algorithmIndex.value
  )
  this.bypass = properties.bypass || this.defaults.bypass.value
}

Overdrive.prototype = Object.create(Super, {
  name: {
    value: 'Overdrive',
  },
  defaults: {
    writable: true,
    value: {
      drive: {
        value: 0.197,
        min: 0,
        max: 1,
        automatable: true,
        type: FLOAT,
        scaled: true,
      },
      outputGain: {
        value: -9.154,
        min: -46,
        max: 0,
        automatable: true,
        type: FLOAT,
        scaled: true,
      },
      curveAmount: {
        value: 0.979,
        min: 0,
        max: 1,
        automatable: false,
        type: FLOAT,
      },
      algorithmIndex: {
        value: 0,
        min: 0,
        max: 5,
        automatable: false,
        type: INT,
      },
      bypass: {
        value: false,
        automatable: false,
        type: BOOLEAN,
      },
    },
  },
  k_nSamples: {
    value: 8192,
  },
  drive: {
    get: function () {
      return this.inputDrive.gain
    },
    set: function (value) {
      this.inputDrive.gain.value = value
    },
  },
  curveAmount: {
    get: function () {
      return this._curveAmount
    },
    set: function (value) {
      this._curveAmount = value
      if (this._algorithmIndex === undefined) {
        this._algorithmIndex = 0
      }
      this.waveshaperAlgorithms[this._algorithmIndex](
        this._curveAmount,
        this.k_nSamples,
        this.ws_table
      )
      this.waveshaper.curve = this.ws_table
    },
  },
  outputGain: {
    get: function () {
      return this.outputDrive.gain
    },
    set: function (value) {
      this._outputGain = dbToWAVolume(value)
      this.outputDrive.gain.setValueAtTime(
        this._outputGain,
        this.userContext.currentTime,
        0.01
      )
    },
  },
  algorithmIndex: {
    get: function () {
      return this._algorithmIndex
    },
    set: function (value) {
      this._algorithmIndex = value
      this.curveAmount = this._curveAmount
    },
  },
  waveshaperAlgorithms: {
    value: [
      function (amount, n_samples, ws_table) {
        amount = Math.min(amount, 0.9999)
        var k = (2 * amount) / (1 - amount),
          i,
          x
        for (i = 0; i < n_samples; i++) {
          x = (i * 2) / n_samples - 1
          ws_table[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
        }
      },
      function (amount, n_samples, ws_table) {
        var i, x, y
        for (i = 0; i < n_samples; i++) {
          x = (i * 2) / n_samples - 1
          y = (0.5 * Math.pow(x + 1.4, 2) - 1) * (y >= 0 ? 5.8 : 1.2)
          ws_table[i] = tanh(y)
        }
      },
      function (amount, n_samples, ws_table) {
        var i,
          x,
          y,
          a = 1 - amount
        for (i = 0; i < n_samples; i++) {
          x = (i * 2) / n_samples - 1
          y = x < 0 ? -Math.pow(Math.abs(x), a + 0.04) : Math.pow(x, a)
          ws_table[i] = tanh(y * 2)
        }
      },
      function (amount, n_samples, ws_table) {
        var i,
          x,
          y,
          abx,
          a = 1 - amount > 0.99 ? 0.99 : 1 - amount
        for (i = 0; i < n_samples; i++) {
          x = (i * 2) / n_samples - 1
          abx = Math.abs(x)
          if (abx < a) {
            y = abx
          } else if (abx > a) {
            y = a + (abx - a) / (1 + Math.pow((abx - a) / (1 - a), 2))
          } else if (abx > 1) {
            y = abx
          }
          ws_table[i] = sign(x) * y * (1 / ((a + 1) / 2))
        }
      },
      function (amount, n_samples, ws_table) {
        // fixed curve, amount doesn't do anything, the distortion is just from the drive
        var i, x
        for (i = 0; i < n_samples; i++) {
          x = (i * 2) / n_samples - 1
          if (x < -0.08905) {
            ws_table[i] =
              (-3 / 4) *
                (1 -
                  Math.pow(1 - (Math.abs(x) - 0.032857), 12) +
                  (1 / 3) * (Math.abs(x) - 0.032847)) +
              0.01
          } else if (x >= -0.08905 && x < 0.320018) {
            ws_table[i] = -6.153 * (x * x) + 3.9375 * x
          } else {
            ws_table[i] = 0.630035
          }
        }
      },
      function (amount, n_samples, ws_table) {
        var a = 2 + Math.round(amount * 14),
          // we go from 2 to 16 bits, keep in mind for the UI
          bits = Math.round(Math.pow(2, a - 1)),
          // real number of quantization steps divided by 2
          i,
          x
        for (i = 0; i < n_samples; i++) {
          x = (i * 2) / n_samples - 1
          ws_table[i] = Math.round(x * bits) / bits
        }
      },
    ],
  },
})

export default Overdrive
