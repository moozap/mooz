import audioBufferToArrayBuffer from '../audio-buffer/audioBufferToArrayBuffer'

export default async function encodeAudioFrame(audioBuffer: AudioBuffer) {
  const offset = 4 // Uint32 for length

  const buffer: ArrayBuffer = await audioBufferToArrayBuffer(audioBuffer)

  // TODO: Compress

  const frame = new ArrayBuffer(offset + buffer.byteLength)

  const view = new DataView(frame)

  const length = buffer.byteLength
  view.setUint32(0, length)

  // Data
  const ui8 = new Uint8Array(buffer)
  for (let i = 0; i < length; i++) {
    view.setUint8(offset + i, ui8[i])
  }

  return frame
}
