export function readString(data, offset, length) {
  return data.slice(offset, offset + length)
}

export function readIntL(data, offset, length) {
  var value = 0
  for (var i = 0; i < length; i++) {
    value = value + (data.charCodeAt(offset + i) & 0xff) * Math.pow(2, 8 * i)
  }
  return value
}

export function readChunkHeaderL(data, offset) {
  var chunk: {
    name: string
    length: number
  } = {
    name: readString(data, offset, 4),
    length: readIntL(data, offset + 4, 4),
  }
  return chunk
}

export function readIntB(data, offset, length) {
  var value = 0
  for (var i = 0; i < length; i++) {
    value =
      value +
      (data.charCodeAt(offset + i) & 0xff) * Math.pow(2, 8 * (length - i - 1))
  }
  return value
}

export function readChunkHeaderB(data, offset) {
  var chunk: {
    name: string
    length: number
  } = {
    name: readString(data, offset, 4),
    length: readIntB(data, offset + 4, 4),
  }
  return chunk
}

export function readFloatB(data, offset) {
  var expon = readIntB(data, offset, 2)
  var range = 1 << (16 - 1)
  if (expon >= range) {
    expon |= ~(range - 1)
  }

  var sign = 1
  if (expon < 0) {
    sign = -1
    expon += range
  }

  var himant = readIntB(data, offset + 2, 4)
  var lomant = readIntB(data, offset + 6, 4)
  var value
  if (
    // ((expon == himant) == lomant) == 0
    expon === 0 &&
    himant === 0 &&
    lomant === 0
  ) {
    value = 0
  } else if (expon == 0x7fff) {
    value = Number.MAX_VALUE
  } else {
    expon -= 16383
    value = (himant * 0x100000000 + lomant) * Math.pow(2, expon - 63)
  }
  return sign * value
}
