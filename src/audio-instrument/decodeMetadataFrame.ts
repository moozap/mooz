export default function decodeMetadataFrame(frame: ArrayBuffer) {
  const offset = 4 // Uint32

  const view = new DataView(frame)
  const length = view.getUint32(0)

  let str = ''
  for (let i = 0; i < length; i += 2) {
    const char = String.fromCharCode(view.getUint16(offset + i))
    str += char
  }

  return {
    metadata: JSON.parse(str),
    length: offset + length,
  }
}
