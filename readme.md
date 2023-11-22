# Mooz:  Modules for web audio and music

This library aims to support the authoring of music-related multimedia content on the web, such as articles, books, and courses for music education.

[API Documentation](https://moozap.github.io/mooz) &bullet; [GitHub repository](https://github.com/moozap/mooz)

## Install

```sh
npm install --save mooz
```

## Overview

### Metronome

```ts
import { Metronome } from 'mooz/metronome'

const metronome = new Metronome({
  tempo: 80
})

metronome.start()
metronome.pause()
metronome.stop()
```

### Score

- Schedules from MIDI, MusicXML, JSON

- Players with Instruments

- Notation

- Score-wide music info: tempo, time signature, key signature..

- Score details: title, composer


### Schedule

- Event timing data

- Events are expressed in relative time

- Multiple schedules can be synchronized to same metronome, or played independently

### Player

Any callback function that accepts event

#### Audio player

#### Visual player

- Fretboard
- Keyboard


### Audio Instrument

- Audio buffers
- Note aliases
- Velocity map
- Import/export an instrument file as binary data format

### Audio Buffer

```ts
import { fetchAudioBuffer } from 'mooz/audio-buffer'

const buffer = await fetchAudioBuffer('/assets/audio.wav')
```


### Audio Channel

- A channel has input, a set of effects, and output

### Audio Effects

- Convolution reverb with impulse response WAV file

