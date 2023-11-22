import decodeMetadataFrame from './decodeMetadataFrame'
import decodeAudioFrame from './decodeAudioFrame'

export default async function decodeInstrument(buffer: ArrayBuffer) {
  const { metadata, length: metadataLength } = decodeMetadataFrame(buffer)

  // console.log('decodeInstrumentFile', metadata)

  const tasks: Promise<object>[] = []
  const bufferView = new DataView(buffer)

  let currentOffset = metadataLength

  while (currentOffset < buffer.byteLength) {
    // Length

    const frameLength = bufferView.getUint32(currentOffset) // 4

    // Data

    const endIndex = currentOffset + 4 + frameLength
    const frame = buffer.slice(currentOffset, endIndex)

    tasks.push(decodeAudioFrame(frame))

    currentOffset = endIndex
  }

  const audioBuffers = await Promise.all(tasks)

  return {
    audioBuffers,
    ...metadata,
  }
}
