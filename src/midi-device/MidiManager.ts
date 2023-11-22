import { EventEmitter } from '../event'
import { getMidiAccess, extractMidiDataFromEvent } from './index'
import MidiDevice from './MidiDevice'

export default class MidiManager extends EventEmitter {
  access = null
  inputs = []
  outputs = []
  devices = {}

  constructor(
    props: {
      devices?: {
        [key: string]: MidiDevice
      }
    } = {}
  ) {
    super(props)

    Object.keys(props.devices || {}).forEach((key) => {
      this.devices[key] =
        props.devices[key] instanceof MidiDevice
          ? props.devices[key]
          : new MidiDevice(props.devices[key])
    })

    // Device state and events

    this.on('connect', (port) => {
      const {
        name,
        type, // input or output
        state, // connected or disconnected
      } = port

      for (const key of Object.keys(this.devices)) {
        const device = this.devices[key]
        if (device.name !== name) continue

        device[type] = port

        this.emit('deviceConnect', device, port)
        device.emit('connect', port)
        if (type === 'input') {
          this.emit('deviceConnectInput', device, port)
          device.emit('connectInput', port)
        } else {
          this.emit('deviceConnectOutput', device, port)
          device.emit('connectOutput', port)
        }
        break
      }

      // console.log(name, type, state)
    })

    this.on('disconnect', (port) => {
      const {
        name,
        type, // input or output
        state, // connected or disconnected
      } = port

      for (const key of Object.keys(this.devices)) {
        const device = this.devices[key]
        if (device.name !== name) continue

        delete device[type]

        this.emit('deviceDisconnect', device, port)
        device.emit('disconnect', port)

        if (type === 'input') {
          this.emit('deviceDisconnectInput', device, port)
          device.emit('disconnectInput', port)
        } else {
          this.emit('deviceDisconnectOutput', device, port)
          device.emit('disconnectOutput', port)
        }
      }

      // console.log(name, type, state)
    })

    this.on('message', (message) => {
      const { name } = message.input

      for (const key of Object.keys(this.devices)) {
        const device = this.devices[key]
        if (device.name !== name) continue

        this.emit('deviceMessage', device, message)
        device.emit('message', message)
      }

      // console.log('MIDI Message', name, message)
    })
  }

  async requestAccess() {
    try {
      this.access = await getMidiAccess()
    } catch (e) {
      return false
    }

    this.access.onstatechange = (event) => {
      this.onChange(event.port)
    }

    for (const [id, input] of this.access.inputs) {
      this.onChange(input)
    }

    for (const [id, output] of this.access.outputs) {
      this.onChange(output)
    }

    this.emit('access', this.access)

    return this.access
  }

  onChange(port) {
    const { type, state } = port

    const isInput = type === 'input'
    const ports = isInput ? this.inputs : this.outputs

    if (state === 'connected') {
      // Already connected
      if (ports.indexOf(port) >= 0) return

      if (isInput) {
        port.onmidimessage = (event) => {
          this.emit('message', extractMidiDataFromEvent(event))
        }
      }

      ports.push(port)
      this.emit('connect', port)
    } else if (state === 'disconnected') {
      const pos = ports.indexOf(port)
      if (pos < 0) return // Already disconnected

      ports.splice(pos, 1)
      this.emit('disconnect', port)
    }

    this.emit('change', port)
  }
}
