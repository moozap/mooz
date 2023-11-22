import { getAudioContext } from '../audio-context'

export default async function fetchAudioBuffer(url: string): Promise<{
  name: string
  audioBuffer: AudioBuffer
  length: number
}> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error, status = ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  const length = buffer.byteLength

  const name = (url.split('/').pop() || '') // File name
    .split('.')
    .slice(0, -1)
    .join('.') // Remove extension

  // Wait for audio context resume?

  const audioContext = getAudioContext()
  const audioBuffer = await audioContext.decodeAudioData(buffer)

  return { name, audioBuffer, length }
}
