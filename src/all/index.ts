/**
 * All modules' main classes and functions as default export
 * 
 * ```ts
 * import mooz from 'mooz'
 * ```
 * 
 * The browser bundle assigns this to `window.mooz`.
 * @module All
 */
export * from '../audio-context'
export * from '../audio-instrument'
export * from '../audio-player'
export * from '../event'
export * as audioEffects from '../audio-effects'
export { Metronome } from '../metronome'
export * from '../midi'
export * from '../midi-device'
export * as music from '../music'
export * from '../musicxml'
export * from '../notation'
export * from '../player'
export * from '../schedule'
export * from '../score'
// export * as tone from '../tone' 

export * from '../keyboard'
export * from '../fretboard'
