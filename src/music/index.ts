/**
 * Based on [tonal](https://github.com/tonaljs/tonal)
 * @module Music
 */
import * as AbcNotation from './abc-notation'
import * as Array from './array'
import * as Chord from './chord'
import * as ChordDetect from './chord-detect'
import * as ChordType from './chord-type'
import * as Collection from './collection'
// import * as Core from './core'
import * as DurationValue from './duration-value'
import * as Interval from './interval'
import * as Key from './key'
import * as Midi from './midi'
import * as Mode from './mode'
import * as Note from './note'
import * as Pcset from './pcset'
import * as Progression from './progression'
import * as Range from './range'
import * as RomanNumeral from './roman-numeral'
import * as Scale from './scale'
import * as ScaleType from './scale-type'
import * as TimeSignature from './time-signature'

export * from './core'

export {
  AbcNotation,
  Array,
  Chord,
  ChordDetect,
  ChordType,
  Collection,
  // Core,
  DurationValue,
  Note,
  Interval,
  Key,
  Midi,
  Mode,
  Pcset,
  Progression,
  Range,
  RomanNumeral,
  Scale,
  ScaleType,
  TimeSignature,
  // deprecated (backwards compatibility) (3.0)
  // Core as Tonal,
  // Pcset as PcSet,
  // ChordType as ChordDictionary,
  // ScaleType as ScaleDictionary,
}
