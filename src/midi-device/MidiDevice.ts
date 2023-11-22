import { EventEmitter } from '../event'
import { createMidiMessage } from './index'

export type MidiDeviceProps = {
  name?: any
  input?: any
  output?: any
}

export default class MidiDevice extends EventEmitter {
  name: string
  input: any
  output: any
  constructor(props = {}) {
    super({
      name: null,
      input: null,
      output: null,
      ...props,
    })
  }

  sendMessage(data) {
    if (!this.output) return
    const message = createMidiMessage(data)
    this.output.send(message)
  }
}
