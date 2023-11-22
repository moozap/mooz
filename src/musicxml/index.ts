/**
 * @module MusicXml
 */
import { toXml } from 'xast-util-to-xml'
import { fromXml } from 'xast-util-from-xml'
import { u } from 'unist-builder'
import { x } from 'xastscript'

// import type { Node } from 'unist'
import type { Nodes } from 'xast'

export function parseMusicXml(xml) {
  return fromXml(xml)
}

export function renderMusicXml(musicxml: Nodes[]) {
  return toXml(musicxml)
}

type MusicJson = {
  parts: any[]
}

export function createMusicJson(musicXml: string | Nodes[] = []): MusicJson {
  const parsed = typeof musicXml === 'string' ? fromXml(musicXml) : musicXml
  const parts = []
  return {
    parts,
  }
}
/*
"measures": [
*/

type Part = {
  name: string
  attributes: Partial<MeasureAttributes>
  measures: Measure[]
}

type MeasureAttributes = {
  divisions: number // 4,
  clef: {
    line: number // 2,
    sign: number // "G"
  }
  key: {
    fifths: number // -1
  }
  time: {
    beats: number // "3",
    'beat-type': number // "4"
  }
  repeat?: {
    left: boolean // false,
    right: boolean // false
  }
}

type Measure = {
  attributes: MeasureAttributes
}

type Note = {
  pitch: {
    step: string // "C",
    octave: number // 4,
    alter: number // 0
  }
  rest: boolean // false,
  duration: number // 2,
  type: string // "eighth"
}

export function note(n: Note) {}

export function createMusicXml(
  musicJson: MusicJson = {
    parts: [],
  }
): string {
  return toXml(createMusicXmlNodes(musicJson))
}

export function createMusicXmlNodes(
  musicJson: MusicJson = {
    parts: [],
  }
): Nodes[] {
  const { parts } = musicJson
  return [
    u('instruction', {
      name: 'xml',
      value: 'version="1.0" encoding="UTF-8"',
    }),
    u('doctype', {
      name: 'score-partwise',
      public: '-//Recordare//DTD MusicXML 1.0 Partwise//EN',
      system: 'http://www.musicxml.org/dtds/partwise.dtd',
    }),
    x('score-partwise', [
      x('identification', [
        x('miscellaneous', [
          x(
            'miscellaneous-field',
            {
              name: 'description',
            },
            'Description'
          ),
        ]),
      ]),
      x('part-list', [
        x(
          'part-group',
          {
            number: '1',
            type: 'start',
          },
          [x('group-symbol', 'bracket'), x('group-barline', 'yes')]
        ),
        x('score-part', { id: 'P1' }, [x('part-name', 'MusicXML Part')]), // Score part
        // x('score-part', { id: 'P2' }, [x('part-name', 'MusicXML Part 2')]), // Score part
      ]), // Part list
      x('part', { id: 'P1' }, [
        x('measure', { number: '1' }, [
          // x('attributes', [
          //   x('divisions', '1'),
          //   x('key', [x('fifths', '0'), x('mode', 'major')]),
          //   x('time', [x('beats', '4'), x('beat-type', '4')]),
          //   x('clef', [x('sign', 'G'), x('line', '2')]),
          // ]),
          // x('note', [
          //   x('type', 'eighth'), // whole
          //   x('duration', '8'), // 4
          //   x('pitch', [x('step', 'C'), x('octave', '5')]),
          //   x('voice', '1'),
          //   x('beam', { number: '1' }, 'begin'),
          // ]),
          // x('note', [
          //   x('type', 'eighth'), // whole
          //   x('duration', '8'), // 4
          //   x('pitch', [x('step', 'C'), x('octave', '5')]),
          //   x('voice', '1'),
          //   x('beam', { number: '1' }, 'continue'),
          // ]),
          // x('note', [
          //   x('type', 'eighth'), // whole
          //   x('duration', '8'), // 4
          //   x('pitch', [x('step', 'C'), x('octave', '5')]),
          //   x('voice', '1'),
          //   x('beam', { number: '1' }, 'continue'),
          // ]),
          // x('note', [
          //   x('type', 'eighth'), // whole
          //   x('duration', '8'), // 4
          //   x('pitch', [x('step', 'C'), x('octave', '5')]),
          //   x('voice', '1'),
          //   x('beam', { number: '1' }, 'end'),
          // ]),
          // x('barline', { location: 'right' }, [x('bar-style', 'light-heavy')]),
        ]),
      ]),
    ]), // Score partwise
  ]
}
