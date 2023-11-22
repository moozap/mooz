export default class EventEmitter {
  listeners = {}

  constructor(props = {}) {
    Object.keys(props).forEach((key) => {
      this[key] =
        props[key] instanceof Function ? props[key].bind(this) : props[key]
    })
  }

  on(name, listener) {
    ;(this.listeners[name] || (this.listeners[name] = new Set())).add(listener)
    return () => this.off(name, listener)
  }

  once(name, listener) {
    const off = this.on(name, (event) => {
      off()
      listener(event)
    })
    return off
  }

  off(name, listener) {
    this.listeners[name] && this.listeners[name].delete(listener)
  }

  emit(name, ...args) {
    this.listeners[name] &&
      this.listeners[name].forEach((listener) => listener(...args))
  }

  removeListeners() {
    this.listeners = {}
  }
}
