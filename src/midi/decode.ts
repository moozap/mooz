// data can be any array-like object.  It just needs to support .length, .slice, and an element getter []

function decodeMidi(data) {
  if (data instanceof ArrayBuffer) {
    data = new Uint8Array(data)
  }

  const p = new Parser(data)

  const headerChunk = p.readChunk()
  if (headerChunk.id != 'MThd') {
    throw "Bad MIDI file.  Expected 'MHdr', got: '" + headerChunk.id + "'"
  }
  const header = parseHeader(headerChunk.data)

  const tracks = []
  for (let i = 0; !p.eof() && i < header.numTracks; i++) {
    const trackChunk = p.readChunk()
    if (trackChunk.id != 'MTrk') {
      throw "Bad MIDI file.  Expected 'MTrk', got: '" + trackChunk.id + "'"
    }
    const track = parseTrack(trackChunk.data)
    tracks.push(track)
  }

  return {
    header,
    tracks,
  }
}

function parseHeader(data) {
  const p = new Parser(data)

  const format = p.readUInt16()
  const numTracks = p.readUInt16()
  const timeDivision = p.readUInt16()

  const result: {
    format: number
    numTracks: number
    ticksPerBeat?: number
    ticksPerFrame?: number
    framesPerSecond?: number
  } = {
    format,
    numTracks,
    ticksPerBeat: timeDivision,
  }

  if (timeDivision & 0x8000) {
    result.framesPerSecond = 0x100 - (timeDivision >> 8)
    result.ticksPerFrame = timeDivision & 0xff
  } else {
    result.ticksPerBeat = timeDivision
  }

  return result
}

function parseTrack(data) {
  const p = new Parser(data)

  let lastEventTypeByte = null

  const events = []
  while (!p.eof()) {
    const event = readEvent()
    events.push(event)
  }

  return events

  function readEvent() {
    const event = {} as any

    event.deltaTime = p.readVarInt()

    let eventTypeByte = p.readUInt8()

    if ((eventTypeByte & 0xf0) === 0xf0) {
      // system / meta event
      if (eventTypeByte === 0xff) {
        // meta event
        event.meta = true
        const metatypeByte = p.readUInt8()
        var length = p.readVarInt()
        switch (metatypeByte) {
          case 0x00:
            event.type = 'sequenceNumber'
            if (length !== 2)
              throw (
                'Expected length for sequenceNumber event is 2, got ' + length
              )
            event.number = p.readUInt16()
            return event
          case 0x01:
            event.type = 'text'
            event.text = p.readString(length)
            return event
          case 0x02:
            event.type = 'copyrightNotice'
            event.text = p.readString(length)
            return event
          case 0x03:
            event.type = 'trackName'
            event.text = p.readString(length)
            return event
          case 0x04:
            event.type = 'instrumentName'
            event.text = p.readString(length)
            return event
          case 0x05:
            event.type = 'lyrics'
            event.text = p.readString(length)
            return event
          case 0x06:
            event.type = 'marker'
            event.text = p.readString(length)
            return event
          case 0x07:
            event.type = 'cuePoint'
            event.text = p.readString(length)
            return event
          case 0x20:
            event.type = 'channelPrefix'
            if (length != 1)
              throw (
                'Expected length for channelPrefix event is 1, got ' + length
              )
            event.channel = p.readUInt8()
            return event
          case 0x21:
            event.type = 'portPrefix'
            if (length != 1)
              throw 'Expected length for portPrefix event is 1, got ' + length
            event.port = p.readUInt8()
            return event
          case 0x2f:
            event.type = 'endOfTrack'
            if (length != 0)
              throw 'Expected length for endOfTrack event is 0, got ' + length
            return event
          case 0x51:
            event.type = 'setTempo'
            if (length != 3)
              throw 'Expected length for setTempo event is 3, got ' + length
            event.microsecondsPerBeat = p.readUInt24()
            return event
          case 0x54:
            event.type = 'smpteOffset'
            if (length != 5)
              throw 'Expected length for smpteOffset event is 5, got ' + length
            var hourByte = p.readUInt8()
            var FRAME_RATES = { 0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30 }
            event.frameRate = FRAME_RATES[hourByte & 0x60]
            event.hour = hourByte & 0x1f
            event.min = p.readUInt8()
            event.sec = p.readUInt8()
            event.frame = p.readUInt8()
            event.subFrame = p.readUInt8()
            return event
          case 0x58:
            event.type = 'timeSignature'
            if (length != 2 && length != 4)
              throw (
                'Expected length for timeSignature event is 4 or 2, got ' +
                length
              )
            event.numerator = p.readUInt8()
            event.denominator = 1 << p.readUInt8()
            if (length === 4) {
              event.metronome = p.readUInt8()
              event.thirtyseconds = p.readUInt8()
            } else {
              event.metronome = 0x24
              event.thirtyseconds = 0x08
            }
            return event
          case 0x59:
            event.type = 'keySignature'
            if (length != 2)
              throw 'Expected length for keySignature event is 2, got ' + length
            event.key = p.readInt8()
            event.scale = p.readUInt8()
            return event
          case 0x7f:
            event.type = 'sequencerSpecific'
            event.data = p.readBytes(length)
            return event
          default:
            event.type = 'unknownMeta'
            event.data = p.readBytes(length)
            event.metatypeByte = metatypeByte
            return event
        }
      } else if (eventTypeByte == 0xf0) {
        event.type = 'sysEx'
        var length = p.readVarInt()
        event.data = p.readBytes(length)
        return event
      } else if (eventTypeByte == 0xf7) {
        event.type = 'endSysEx'
        var length = p.readVarInt()
        event.data = p.readBytes(length)
        return event
      } else {
        throw 'Unrecognised MIDI event type byte: ' + eventTypeByte
      }
    } else {
      // channel event
      let param1
      if ((eventTypeByte & 0x80) === 0) {
        // running status - reuse lastEventTypeByte as the event type.
        // eventTypeByte is actually the first parameter
        if (lastEventTypeByte === null) {
          throw 'Running status byte encountered before status byte'
        }
        param1 = eventTypeByte
        eventTypeByte = lastEventTypeByte
        event.running = true
      } else {
        param1 = p.readUInt8()
        lastEventTypeByte = eventTypeByte
      }
      const eventType = eventTypeByte >> 4
      event.channel = eventTypeByte & 0x0f
      switch (eventType) {
        case 0x08:
          event.type = 'noteOff'
          event.note = param1
          event.velocity = p.readUInt8()
          return event
        case 0x09:
          var velocity = p.readUInt8()
          event.type = velocity === 0 ? 'noteOff' : 'noteOn'
          event.note = param1
          event.velocity = velocity
          if (velocity === 0) event.byte9 = true
          return event
        case 0x0a:
          event.type = 'noteAftertouch'
          event.note = param1
          event.value = p.readUInt8()
          return event
        case 0x0b:
          event.type = 'controller'
          event.controllerType = param1
          event.value = p.readUInt8()
          return event
        case 0x0c:
          event.type = 'programChange'
          event.programNumber = param1
          return event
        case 0x0d:
          event.type = 'channelAftertouch'
          event.value = param1
          return event
        case 0x0e:
          event.type = 'pitchBend'
          event.value = param1 + (p.readUInt8() << 7) - 0x2000
          return event
        default:
          throw 'Unrecognised MIDI event type: ' + eventType
      }
    }
  }
}

class Parser {
  pos: number
  buffer: number[]
  bufferLen: number

  constructor(data) {
    this.buffer = data
    this.bufferLen = this.buffer.length
    this.pos = 0
  }

  eof() {
    return this.pos >= this.bufferLen
  }

  readUInt8() {
    const result = this.buffer[this.pos]
    this.pos += 1
    return result
  }

  readInt8() {
    const u = this.readUInt8()
    if (u & 0x80) {
      return u - 0x100
    } else {
      return u
    }
  }

  readUInt16() {
    const b0 = this.readUInt8()
    const b1 = this.readUInt8()

    return (b0 << 8) + b1
  }

  readInt16() {
    const u = this.readUInt16()
    if (u & 0x8000) {
      return u - 0x10000
    } else {
      return u
    }
  }

  readUInt24() {
    const b0 = this.readUInt8()
    const b1 = this.readUInt8()
    const b2 = this.readUInt8()

    return (b0 << 16) + (b1 << 8) + b2
  }

  readInt24() {
    const u = this.readUInt24()
    if (u & 0x800000) {
      return u - 0x1000000
    } else {
      return u
    }
  }

  readUInt32() {
    const b0 = this.readUInt8()
    const b1 = this.readUInt8()
    const b2 = this.readUInt8()
    const b3 = this.readUInt8()

    return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3
  }

  readBytes(len) {
    const bytes = this.buffer.slice(this.pos, this.pos + len)
    this.pos += len
    return bytes
  }

  readString(len) {
    const bytes = this.readBytes(len)
    return String.fromCharCode.apply(null, bytes)
  }

  readVarInt() {
    let result = 0
    while (!this.eof()) {
      const b = this.readUInt8()
      if (b & 0x80) {
        result += b & 0x7f
        result <<= 7
      } else {
        // b is last byte
        return result + b
      }
    }
    // premature eof
    return result
  }

  readChunk() {
    const id = this.readString(4)
    const length = this.readUInt32()
    const data = this.readBytes(length)
    return {
      id,
      length,
      data,
    }
  }
}

export default decodeMidi
