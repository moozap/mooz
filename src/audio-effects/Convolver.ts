import { getContext, initValue, Super, BOOLEAN, FLOAT } from './common'

const Convolver = function (properties) {
  if (!properties) {
    properties = this.getDefaults()
  }

  const userContext = (this.userContext = getContext(properties.context))

  this.input = userContext.createGain()
  this.activateNode = userContext.createGain()
  this.convolver = userContext.createConvolver()
  this.dry = userContext.createGain()
  this.filterLow = userContext.createBiquadFilter()
  this.filterHigh = userContext.createBiquadFilter()
  this.wet = userContext.createGain()
  this.output = userContext.createGain()

  this.activateNode.connect(this.filterLow)
  this.activateNode.connect(this.dry)
  this.filterLow.connect(this.filterHigh)
  this.filterHigh.connect(this.convolver)
  this.convolver.connect(this.wet)
  this.wet.connect(this.output)
  this.dry.connect(this.output)

  //don't use setters at init to avoid smoothing
  this.dry.gain.value = initValue(
    properties.dryLevel,
    this.defaults.dryLevel.value
  )
  this.wet.gain.value = initValue(
    properties.wetLevel,
    this.defaults.wetLevel.value
  )
  this.filterHigh.frequency.value =
    properties.highCut || this.defaults.highCut.value
  this.filterLow.frequency.value =
    properties.lowCut || this.defaults.lowCut.value
  this.output.gain.value = initValue(
    properties.level,
    this.defaults.level.value
  )
  this.filterHigh.type = 'lowpass'
  this.filterLow.type = 'highpass'

  this.buffer = properties.impulse || '../impulses/ir_rev_short.wav'
  this.bypass = properties.bypass || this.defaults.bypass.value
}
Convolver.prototype = Object.create(Super, {
  name: {
    value: 'Convolver',
  },
  defaults: {
    writable: true,
    value: {
      highCut: {
        value: 22050,
        min: 20,
        max: 22050,
        automatable: true,
        type: FLOAT,
      },
      lowCut: {
        value: 20,
        min: 20,
        max: 22050,
        automatable: true,
        type: FLOAT,
      },
      dryLevel: {
        value: 1,
        min: 0,
        max: 1,
        automatable: true,
        type: FLOAT,
      },
      wetLevel: {
        value: 1,
        min: 0,
        max: 1,
        automatable: true,
        type: FLOAT,
      },
      level: {
        value: 1,
        min: 0,
        max: 1,
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
  lowCut: {
    get: function () {
      return this.filterLow.frequency
    },
    set: function (value) {
      this.filterLow.frequency.setTargetAtTime(
        value,
        this.userContext.currentTime,
        0.01
      )
    },
  },
  highCut: {
    get: function () {
      return this.filterHigh.frequency
    },
    set: function (value) {
      this.filterHigh.frequency.setTargetAtTime(
        value,
        this.userContext.currentTime,
        0.01
      )
    },
  },
  level: {
    get: function () {
      return this.output.gain
    },
    set: function (value) {
      this.output.gain.setTargetAtTime(
        value,
        this.userContext.currentTime,
        0.01
      )
    },
  },
  dryLevel: {
    get: function () {
      return this.dry.gain
    },
    set: function (value) {
      this.dry.gain.setTargetAtTime(value, this.userContext.currentTime, 0.01)
    },
  },
  wetLevel: {
    get: function () {
      return this.wet.gain
    },
    set: function (value) {
      this.wet.gain.setTargetAtTime(value, this.userContext.currentTime, 0.01)
    },
  },
  buffer: {
    enumerable: false,
    get: function () {
      return this.convolver.buffer
    },
    set: function (impulse) {
      var convolver = this.convolver,
        xhr = new XMLHttpRequest()
      if (!impulse) {
        console.log('Tuna.Convolver.setBuffer: Missing impulse path!')
        return
      }
      xhr.open('GET', impulse, true)
      xhr.responseType = 'arraybuffer'
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if ((xhr.status < 300 && xhr.status > 199) || xhr.status === 302) {
            this.userContext.decodeAudioData(
              xhr.response,
              function (buffer) {
                convolver.buffer = buffer
              },
              function (e) {
                if (e)
                  console.log(
                    'Tuna.Convolver.setBuffer: Error decoding data' + e
                  )
              }
            )
          }
        }
      }
      xhr.send(null)
    },
  },
})

export default Convolver
