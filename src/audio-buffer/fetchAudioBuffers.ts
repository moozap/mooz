import fetchAudioBuffer from './fetchAudioBuffer'

export default async function fetchAudioBuffers(urls: string[]) {
  let totalLength = 0
  const audioBufferNames: string[] = []
  const audioBuffers = await Promise.all(
    urls.map(async (url, index) => {
      const { audioBuffer, length, name } = await fetchAudioBuffer(url)
      audioBufferNames[index] = name
      totalLength += length
      return audioBuffer
    })
  )
  return { audioBuffers, totalLength, audioBufferNames }
}
