import { toXml } from 'xast-util-to-xml'
import { fromXml } from 'xast-util-from-xml'
import { u } from 'unist-builder'
import { x } from 'xastscript'
import * as osmd from 'opensheetmusicdisplay'

//import extractScoreData from 'mooz/notation/extractScoreData.js'

// import { VexFlow } from './vexflow'
// import { Vexml } from './vexml'
// import * as v from './vexml/util/xml'
// import * as m from './vexml/musicxml'
// import X2JS from './xml2json'

// import * as musicxml from './musicxml'

// console.log('vexflow', VexFlow)
// console.log('vexml', Vexml)
// console.log('vexml.xml', v)
// console.log('vexml.musicxml', m) // Interface for parsed XML elements
// console.log('musicxml', musicxml)

/**
 * Load font face to be ready to use in canvas context
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FontFace/FontFace
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/add
 */
async function loadFontFace(name, url) {
  const f = new FontFace(name, `url("${url}")`)
  await f.load()
  // @ts-ignore
  document.fonts.add(f)
}

/**
 * Debounce
 */
const debounce = (callback, wait) => {
  let timeoutId = null
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      callback(args)
      timeoutId = null
    }, wait)
  }
}

;(async () => {
  await Promise.all([
    loadFontFace('Bravura', '/vexflow-fonts/bravura/bravura.woff2'),
    loadFontFace('Academico', '/vexflow-fonts/academico/academico.woff2'),
  ])

  const maxWidth = 960

  let width = maxWidth
  const height = 600

  const div = document.createElement('div')
  // div.style.width = `${width}px`
  // div.style.height = `${height}px`

  div.style.textAlign = 'center'

  //   const _xml = await (
  //     await fetch(
  //       // '/vexml-tests/01a-Pitches-Pitches.xml'
  //       // '/vexml-tests/11a-TimeSignatures.xml'
  //       // '/vexml-tests/12a-Clefs.xml'
  //       // '/vexml-tests/61e-Lyrics-Chords.xml'
  //       '/vexml-tests/71e-TabStaves.xml'
  //     )
  //   ).text()
  // console.log(_xml)

  // x2js.json2xml_str
  const xml = toXml([
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
        x('score-part', { id: 'P2' }, [x('part-name', 'MusicXML Part 2')]), // Score part
      ]), // Part list
      x('part', { id: 'P1' }, [
        x('measure', { number: '1' }, [
          x('attributes', [
            x('divisions', '1'),
            x('key', [x('fifths', '0'), x('mode', 'major')]),
            x('time', [x('beats', '4'), x('beat-type', '4')]),
            x('clef', [x('sign', 'G'), x('line', '2')]),
          ]),
          x('note', [
            x('type', 'eighth'), // whole
            x('duration', '8'), // 4
            x('pitch', [x('step', 'C'), x('octave', '5')]),
            x('voice', '1'),
            x('beam', { number: '1' }, 'begin'),
          ]),
          x('note', [
            x('type', 'eighth'), // whole
            x('duration', '8'), // 4
            x('pitch', [x('step', 'C'), x('octave', '5')]),
            x('voice', '1'),
            x('beam', { number: '1' }, 'continue'),
          ]),
          x('note', [
            x('type', 'eighth'), // whole
            x('duration', '8'), // 4
            x('pitch', [x('step', 'C'), x('octave', '5')]),
            x('voice', '1'),
            x('beam', { number: '1' }, 'continue'),
          ]),
          x('note', [
            x('type', 'eighth'), // whole
            x('duration', '8'), // 4
            x('pitch', [x('step', 'C'), x('octave', '5')]),
            x('voice', '1'),
            x('beam', { number: '1' }, 'end'),
          ]),
          x('barline', { location: 'right' }, [x('bar-style', 'light-heavy')]),
        ]),
      ]),
      x('part', { id: 'P2' }, [
        x('measure', { number: '1' }, [
          x('attributes', [
            x('divisions', '1'),
            x('key', [x('fifths', '0'), x('mode', 'major')]),
            x('time', [x('beats', '4'), x('beat-type', '4')]),
            x('clef', [x('sign', 'G'), x('line', '2')]),
          ]),
          x('note', [
            x('type', 'eighth'), // whole
            x('duration', '8'), // 4
            x('pitch', [x('step', 'F'), x('octave', '4')]),
            x('voice', '1'),
            x('beam', { number: '1' }, 'begin'),
          ]),
          x('note', [
            x('type', 'eighth'), // whole
            x('duration', '8'), // 4
            x('pitch', [x('step', 'C'), x('octave', '5')]),
            x('voice', '1'),
            x('beam', { number: '1' }, 'continue'),
          ]),
          x('note', [
            x('type', 'eighth'), // whole
            x('duration', '8'), // 4
            x('pitch', [x('step', 'C'), x('octave', '5')]),
            x('voice', '1'),
            x('beam', { number: '1' }, 'continue'),
          ]),
          x('note', [
            x('type', 'eighth'), // whole
            x('duration', '8'), // 4
            x('pitch', [x('step', 'C'), x('octave', '5')]),
            x('voice', '1'),
            x('beam', { number: '1' }, 'end'),
          ]),
          x('barline', { location: 'right' }, [x('bar-style', 'light-heavy')]),
        ]),
      ]),
    ]), // Score partwise
  ])

  // console.log('parsed', fromXml(xml))
  // console.log('xml', xml)

  // console.log('Parsed', Vexml.parse({ xml }))

  const score = new osmd.OpenSheetMusicDisplay(div)
  score.setOptions({
    backend: 'svg', // canvas
    // drawTitle: true,
    drawingParameters: 'compacttight',
    defaultColorMusic: '#ddd',
  })

  // console.log('xml', xml)
  await score.load(xml)

  document.body.append(div)

  console.log('score', score)

  window.addEventListener(
    'resize',
    debounce(function () {
      width = Math.min(maxWidth, window.innerWidth)
      // div.replaceChildren()
      // Vexml.render({
      //   element: div,
      //   width,
      //   xml,
      // })

      // score.render({
      //   element: canvas,
      //   width,
      // })
    }, 100)
  )
})().catch(console.error)
