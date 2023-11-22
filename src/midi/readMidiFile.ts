import midiToSchedules from './toSchedules'

export default async function readMidiFile(file: File) {
  const extension = file.name.split('.').slice(-1)[0]
  if (extension !== 'mid') throw new Error('Not a MIDI file')

  const buffer: ArrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = function (e) {
      resolve(reader.result as ArrayBuffer)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

  // const length = buffer.byteLength

  const schedules = midiToSchedules(buffer)

  return { schedules }
}
