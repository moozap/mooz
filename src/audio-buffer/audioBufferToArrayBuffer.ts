export default function audioBufferToArrayBuffer(src, littleEndian = true) {
  const dst = new ArrayBuffer(16 + src.length * src.numberOfChannels * 4)
  const view = new DataView(dst)
  view.setFloat32(0, src.sampleRate, littleEndian)
  view.setFloat32(4, src.duration, littleEndian)
  view.setUint32(8, src.length, littleEndian)
  view.setUint32(12, src.numberOfChannels, littleEndian)
  for (let c = 0; c < src.numberOfChannels; c++) {
    const f64 = src.getChannelData(c)
    for (let i = 0; i < f64.length; i++) {
      let j = 16 + c * src.length * 4 + i * 4
      view.setFloat32(j, f64[i], littleEndian)
    }
  }
  return dst
}

/*
    const buffers = []
    // Each channel is a Float32Array
    for (let i=0, len=audioBuffer.numberOfChannels; i < len; i++) {
      buffers.push(audioBuffer.getChannelData(i))
    }
*/
