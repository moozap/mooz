export default function arrayBufferToAudioBuffer(src, littleEndian = true) {
  const view = new DataView(src)
  const dst = new AudioBuffer({
    sampleRate: view.getFloat32(0, littleEndian),
    length: view.getUint32(8, littleEndian),
    numberOfChannels: view.getUint32(12, littleEndian),
  })
  for (let c = 0; c < dst.numberOfChannels; c++) {
    let f32 = new Float32Array(dst.length)
    for (let i = 0; i < f32.length; i++) {
      let j = 16 + c * dst.length * 4 + i * 4
      f32[i] = view.getFloat32(j, littleEndian)
    }
    dst.copyToChannel(f32, c)
  }
  return dst
}
