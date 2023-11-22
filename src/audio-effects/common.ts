let userContext

export const getContext = function (context) {
  if (!userContext) {
    userContext =
      context ||
      new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  connectify(userContext)
  return userContext
}

export const pipe = function (param, val) {
  param.value = val
}

/**
 * TODO: Rewrite Object.create with class
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties#parameters
 */

export const Super = Object.create(null, {
  activate: {
    writable: true,
    value: function (doActivate) {
      if (doActivate) {
        this.input.disconnect()
        this.input.connect(this.activateNode)
        if (this.activateCallback) {
          this.activateCallback(doActivate)
        }
      } else {
        this.input.disconnect()
        this.input.connect(this.output)
      }
    },
  },
  bypass: {
    get: function () {
      return this._bypass
    },
    set: function (value) {
      if (this._lastBypassValue === value) {
        return
      }
      this._bypass = value
      this.activate(!value)
      this._lastBypassValue = value
    },
  },
  connect: {
    value: function (target) {
      this.output.connect(target)
    },
  },
  disconnect: {
    value: function (target) {
      this.output.disconnect(target)
    },
  },
  connectInOrder: {
    value: function (nodeArray) {
      var i = nodeArray.length - 1
      while (i--) {
        if (!nodeArray[i].connect) {
          return console.error(
            'AudioNode.connectInOrder: TypeError: Not an AudioNode.',
            nodeArray[i]
          )
        }
        if (nodeArray[i + 1].input) {
          nodeArray[i].connect(nodeArray[i + 1].input)
        } else {
          nodeArray[i].connect(nodeArray[i + 1])
        }
      }
    },
  },
  getDefaults: {
    value: function () {
      var result = {}
      for (var key in this.defaults) {
        result[key] = this.defaults[key].value
      }
      return result
    },
  },
  automate: {
    value: function (property, value, duration, startTime) {
      var start = startTime ? ~~(startTime / 1000) : userContext.currentTime,
        dur = duration ? ~~(duration / 1000) : 0,
        _is = this.defaults[property],
        param = this[property],
        method

      if (param) {
        if (_is.automatable) {
          if (!duration) {
            method = 'setValueAtTime'
          } else {
            method = 'linearRampToValueAtTime'
            param.cancelScheduledValues(start)
            param.setValueAtTime(param.value, start)
          }
          param[method](value, dur + start)
        } else {
          param = value
        }
      } else {
        console.error('Invalid Property for ' + this.name)
      }
    },
  },
})

export const FLOAT = 'float'
export const BOOLEAN = 'boolean'
export const STRING = 'string'
export const INT = 'int'

export function connectify(context) {
  if (context.__connectified__ === true) return

  var gain = context.createGain(),
    proto = Object.getPrototypeOf(Object.getPrototypeOf(gain)),
    oconnect = proto.connect

  proto.connect = shimConnect
  context.__connectified__ = true // Prevent overriding connect more than once

  function shimConnect() {
    var node = arguments[0]
    arguments[0] = Super.isPrototypeOf
      ? Super.isPrototypeOf(node)
        ? node.input
        : node
      : node.input || node
    oconnect.apply(this, arguments)
    return node
  }
}

export function dbToWAVolume(db) {
  return Math.max(0, Math.round(100 * Math.pow(2, db / 6)) / 100)
}

export function fmod(x, y) {
  // http://kevin.vanzonneveld.net
  // *     example 1: fmod(5.7, 1.3);
  // *     returns 1: 0.5
  var tmp,
    tmp2,
    p = 0,
    pY = 0,
    l = 0.0,
    l2 = 0.0

  tmp = x.toExponential().match(/^.\.?(.*)e(.+)$/)
  p = parseInt(tmp[2], 10) - (tmp[1] + '').length
  tmp = y.toExponential().match(/^.\.?(.*)e(.+)$/)
  pY = parseInt(tmp[2], 10) - (tmp[1] + '').length

  if (pY > p) {
    p = pY
  }

  tmp2 = x % y

  if (p < -100 || p > 20) {
    // toFixed will give an out of bound error so we fix it like this:
    l = Math.round(Math.log(tmp2) / Math.log(10))
    l2 = Math.pow(10, l)

    return parseFloat((tmp2 / l2).toFixed(l - p)) * l2
  } else {
    return parseFloat(tmp2.toFixed(-p))
  }
}

export function sign(x) {
  if (x === 0) {
    return 1
  } else {
    return Math.abs(x) / x
  }
}

export function tanh(n) {
  return (Math.exp(n) - Math.exp(-n)) / (Math.exp(n) + Math.exp(-n))
}

export function initValue(userVal, defaultVal) {
  return userVal === undefined ? defaultVal : userVal
}
