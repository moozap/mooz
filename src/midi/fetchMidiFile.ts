import midiToSchedules from './toSchedules'

export default async function fetchMidiFile(url: string) {
  const extension = url.split('.').slice(-1)[0]
  if (extension !== 'mid') throw new Error('Not a MIDI file')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error, status = ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  // const length = buffer.byteLength

  const schedules = midiToSchedules(buffer)

  return { schedules }
}
