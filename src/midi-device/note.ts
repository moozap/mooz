export const noteNames = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
]
export const noteNamesWithSharps = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]
export const noteValues = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/**
 * Note number (0~127) to name + octave (like "C4")
 *
 * Middle C is 60 = C4
 */
export function noteNumberToName(
  note,
  options: {
    asObject?: boolean
    octaveOffset?: number
    sharp?: boolean
  } = {}
) {
  const data = noteNumberToNameAndOctave(note, options)
  if (options.asObject) return data
  return data.noteName + data.octave
}

/**
 * Note number (0~127) to object { noteName, octave }
 */
export function noteNumberToNameAndOctave(
  note,
  options: {
    octaveOffset?: number
    sharp?: boolean
  } = {}
) {
  const { octaveOffset = 0, sharp = false } = options

  const noteName = sharp ? noteNamesWithSharps[note % 12] : noteNames[note % 12]
  const octave = Math.floor(Math.floor(note) / 12 - 1) + octaveOffset

  return {
    noteName,
    octave,
  }
}

/**
 * Note name with octave (like "C4") to number (0~127)
 */
export function noteNameToNumber(name) {
  if (typeof name !== 'string') name = ''

  const matches = name.match(/([CDEFGAB])(#{0,2}|b{0,2})(-?\d+)/i)

  if (!matches) return -1 // throw new RangeError('Invalid note name.')

  const semitones = noteValues[matches[1].toUpperCase()]
  const octave = parseInt(matches[3])
  const octaveOffset = 0

  let result = (octave + 1 - Math.floor(octaveOffset)) * 12 + semitones

  if (matches[2].indexOf('b') > -1) {
    result -= matches[2].length
  } else if (matches[2].indexOf('#') > -1) {
    result += matches[2].length
  }

  if (result < 0 || result > 127) {
    // throw new RangeError('Invalid note name or note outside valid range.')
  }

  return result
}
