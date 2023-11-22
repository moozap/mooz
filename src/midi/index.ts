/**
 * @module Midi
 */
// export { default as decodeMidi } from './decode'
// export { default as encodeMidi } from './encode'

import { encode } from 'json-midi-encoder'
import { parseArrayBuffer } from 'midi-json-parser'

export { encode as encodeMidi, parseArrayBuffer as decodeMidi }
