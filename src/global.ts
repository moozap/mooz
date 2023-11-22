import moozAll from './index.ts'

const mooz = Object.assign(new moozAll.Metronome(), moozAll)

export type MoozType = typeof mooz

declare global {
  interface Window {
    mooz: typeof mooz
  }
}

window.mooz = Object.assign(mooz, window.mooz || {}, )
