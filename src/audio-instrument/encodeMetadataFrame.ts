import stringToArrayBuffer from '../audio-buffer/stringToArrayBuffer'

export default function encodeMetadataFrame(data: object) {
  const offset = 4 // Uint32

  const dataString = JSON.stringify(data)
  const dataBuffer = stringToArrayBuffer(dataString)

  const length = dataBuffer.byteLength
  const frame = new ArrayBuffer(offset + length)
  const frameView = new DataView(frame)

  frameView.setUint32(0, length)

  const ui16 = new Uint16Array(dataBuffer) // 2 bytes per char

  for (let i = 0, len = ui16.length; i < len; i++) {
    frameView.setUint16(offset + i * 2, ui16[i])
  }

  return frame
}
