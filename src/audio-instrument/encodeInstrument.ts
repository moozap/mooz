import encodeMetadataFrame from './encodeMetadataFrame'
import encodeAudioFrame from './encodeAudioFrame'

export default async function encodeInstrument(instrument) {
  const { audioBuffers, ...metadata } = instrument

  const audioSpriteFrames: ArrayBuffer[] = []

  let totalLength = 0

  // First frame: Metadata

  const firstFrame = encodeMetadataFrame(metadata)
  audioSpriteFrames.push(firstFrame)

  totalLength += firstFrame.byteLength

  // Audio frames

  await Promise.all(
    audioBuffers.map(async (au, index) => {
      const frame = await encodeAudioFrame(au)

      /**
       * Use index, not push, to ensure correct order
       */
      audioSpriteFrames[index + 1] = frame

      totalLength += frame.byteLength

      // Test if encode/decode results in valid audio buffer
      // const audioBuffer = await decodeAudioFrame(frame)
      // playBuffer(audioBuffer)
    })
  )

  // Create single ArrayBuffer for export

  const fileData = new ArrayBuffer(totalLength)
  const targetView = new DataView(fileData)

  let frameIndex = 0
  let currentOffset = 0
  for (const frame of audioSpriteFrames) {
    const frameView = new DataView(frame)
    const length = frameView.getUint32(0)
    const data = new Uint8Array(frame, 4, length)

    targetView.setUint32(currentOffset, length)
    for (let i = 0, len = data.length; i < len; i++) {
      targetView.setUint8(currentOffset + 4 + i, data[i])
    }

    // console.log('Export frame', frameIndex, frame, 'data', length, data)

    /*
const decodeFrame = targetView.buffer.slice(
  currentOffset, currentOffset + 4 + length
)
console.log('decodeFrame', decodeFrame)
    if (frameIndex===0) {
console.log('frame metadata', decodeMetadataFrame(decodeFrame))
    } else {
      // Audio frames
console.log('Audio frame', await decodeAudioFrame(decodeFrame))
    }
*/

    frameIndex++
    currentOffset += frame.byteLength
  }

  return fileData
}
