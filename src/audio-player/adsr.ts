// @ts-nocheck
/**
 * ADSR envelope:  attack, decay, sustain and release
 * @see https://en.wikipedia.org/wiki/Envelope_(music)#ADSR
 */

const props = {
  attack: { value: 0, writable: true },
  decay: { value: 0, writable: true },
  sustain: { value: 1, writable: true },
  release: { value: 0, writable: true },

  getReleaseDuration: {
    value: function () {
      return this.release
    },
  },

  start: {
    value: function (at) {
      let target = this._multiplier.gain
      let startAmount = this._startAmount.gain
      let endAmount = this._endAmount.gain

      this._voltage.start(at)
      this._decayFrom = this._decayFrom = at + this.attack
      this._startedAt = at

      let sustain = this.sustain

      target.cancelScheduledValues(at)
      startAmount.cancelScheduledValues(at)
      endAmount.cancelScheduledValues(at)

      endAmount.setValueAtTime(0, at)

      if (this.attack) {
        target.setValueAtTime(0, at)
        target.linearRampToValueAtTime(1, at + this.attack)

        startAmount.setValueAtTime(1, at)
        startAmount.linearRampToValueAtTime(0, at + this.attack)
      } else {
        target.setValueAtTime(1, at)
        startAmount.setValueAtTime(0, at)
      }

      if (this.decay) {
        target.setTargetAtTime(
          sustain,
          this._decayFrom,
          getTimeConstant(this.decay)
        )
      }
    },
  },

  stop: {
    value: function (at, isTarget) {
      if (isTarget) {
        at = at - this.release
      }

      let endTime = at + this.release
      if (this.release) {
        let target = this._multiplier.gain
        let startAmount = this._startAmount.gain
        let endAmount = this._endAmount.gain

        target.cancelScheduledValues(at)
        startAmount.cancelScheduledValues(at)
        endAmount.cancelScheduledValues(at)

        let expFalloff = getTimeConstant(this.release)

        // truncate attack (required as linearRamp is removed by cancelScheduledValues)
        if (this.attack && at < this._decayFrom) {
          let valueAtTime = getValue(0, 1, this._startedAt, this._decayFrom, at)
          target.linearRampToValueAtTime(valueAtTime, at)
          startAmount.linearRampToValueAtTime(1 - valueAtTime, at)
          startAmount.setTargetAtTime(0, at, expFalloff)
        }

        endAmount.setTargetAtTime(1, at, expFalloff)
        target.setTargetAtTime(0, at, expFalloff)
      }

      this._voltage.stop(endTime)
      return endTime
    },
  },

  onended: {
    get: function () {
      return this._voltage.onended
    },
    set: function (value) {
      this._voltage.onended = value
    },
  },
}

const flat = new Float32Array([1, 1])

function getVoltage(context) {
  let voltage = context.createBufferSource()
  let buffer = context.createBuffer(1, 2, context.sampleRate)
  buffer.getChannelData(0).set(flat)
  voltage.buffer = buffer
  voltage.loop = true
  return voltage
}

function scale(node) {
  let gain = node.context.createGain()
  node.connect(gain)
  return gain
}

function getTimeConstant(time) {
  return Math.log(time + 1) / Math.log(100)
}

function getValue(start, end, fromTime, toTime, at) {
  let difference = end - start
  let time = toTime - fromTime
  let truncateTime = at - fromTime
  let phase = truncateTime / time
  let value = start + phase * difference

  if (value <= start) {
    value = start
  }
  if (value >= end) {
    value = end
  }

  return value
}

/**
 * Create an ADSR node
 */
export function createADSRNode(audioContext) {
  let node = audioContext.createGain()

  let voltage = (node._voltage = getVoltage(audioContext))
  let value = scale(voltage)
  let startValue = scale(voltage)
  let endValue = scale(voltage)

  node._startAmount = scale(startValue)
  node._endAmount = scale(endValue)

  node._multiplier = scale(value)
  node._multiplier.connect(node)
  node._startAmount.connect(node)
  node._endAmount.connect(node)

  node.value = value.gain
  node.startValue = startValue.gain
  node.endValue = endValue.gain

  node.startValue.value = 0
  node.endValue.value = 0

  Object.defineProperties(node, props)

  return node
}
