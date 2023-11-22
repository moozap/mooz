import arrayBufferToAudioBuffer from '../audio-buffer/arrayBufferToAudioBuffer'

export default async function decodeAudioFrame(frame: ArrayBuffer) {
  const offset = 4 // Uint32 for length

  const view = new DataView(frame)
  const length = view.getUint32(0)

  const buffer = new ArrayBuffer(length)
  const ui8 = new Uint8Array(buffer)
  for (let i = 0; i < length; i++) {
    ui8[i] = view.getUint8(offset + i)
  }

  // TODO: Decompress

  const audioBuffer = await arrayBufferToAudioBuffer(buffer)

  return audioBuffer
}
