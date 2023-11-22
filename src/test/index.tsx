import React, { useEffect, useRef, useState, MutableRefObject } from 'react'
import { createRoot } from 'react-dom/client'
import type { MoozType } from '../global.ts'

declare global {
  interface Window {
    mooz: MoozType
  }
}

const $app = document.getElementById('app') as HTMLElement

const root = createRoot($app)
const mooz = window.mooz

const Metronome = () => {
  const ref = useRef() as MutableRefObject<HTMLDivElement>
  const [position, setPosition] = useState({
    beatIndex: 0,
    metronomeBeat: 0,
    currentMeasure: 1,
    currentBeat: 1,
  })
  useEffect(() => {
    const el = ref.current

    const callback = ({
      beatIndex,
      metronomeBeat,
      currentMeasure,
      currentBeat,
    }) => {
      setPosition({
        beatIndex,
        metronomeBeat,
        currentMeasure,
        currentBeat,
      })
      // console.log(`${currentMeasure}:${currentBeat}`) // beatIndex, metronomeBeat, currentBeat, currentMeasure
    }
    mooz.on('metronomeBeat', callback)
    mooz.on('stop', callback)

    return () => {
      mooz.off('metronomeBeat', callback)
      mooz.off('stop', callback)
    }
  }, [])

  return (
    <section>
      <h1>Metronome</h1>
      <p>
        Musical time (Measure, Beat): {position.currentMeasure}:
        {position.currentBeat}
      </p>
      {/* <p>Metronome beat count (Starting from 1): {position.metronomeBeat}</p> */}
      <p>Absolute beat index (Starting from 0): {position.beatIndex}</p>
      <p>Loop by absolute beats: {mooz.loopDuration}</p>
      <div ref={ref}></div>

      <button onClick={() => mooz.start()}>Start</button>
      <button onClick={() => mooz.pause()}>Pause</button>
      <button onClick={() => mooz.stop()}>Stop</button>
    </section>
  )
}

function MidiTest() {
  return (
    <section>
      <h1>MIDI</h1>
      <button>
        Upload
      </button>
    </section>
  )
}

function MusicXmlTest() {
  return (
    <section>
      <h1>MusicXml</h1>
      <button>
        Upload
      </button>
    </section>
  )
}

function AudioContextTest() {
  const [state, setState] = useState(mooz.audioContext.state==='running')
  useEffect(() => {

    const onStateChange = function(e) {
      const isActive = mooz.audioContext.state==='running'
      setState(isActive)
    }

    mooz.audioContext.addEventListener('statechange', onStateChange)

    return function() {
      mooz.audioContext.removeEventListener('statechange', onStateChange)
    }
  }, [])
  return (
    <section>
      <h1>Audio Context</h1>
      Active: {state ? 'True' : 'False'}
    </section>
  )
}

function AudioInstrumentTest() {
  return (
    <section>
      <h1>Audio Instrument</h1>
    </section>
  )
}

const App = () => {
  return (
    <>
      <Metronome />
      <MidiTest />
      <MusicXmlTest />
      <AudioContextTest />
      <AudioInstrumentTest />
    </>
  )
}

mooz.setLoop(4)
mooz.start()

root.render(<App />)

console.log('mooz', mooz)
