import { getAudioContext } from '../audio-context'

export default function playAudioBuffer(
  audioBuffer: AudioBuffer,
  volume = 100
) {
  const audioContext = getAudioContext()

  /**
   * An AudioBufferSourceNode can only be played once; after each call to start(), you have to create a new node if you want to play the same sound again. Fortunately, these nodes are very inexpensive to create, and the actual AudioBuffers can be reused for multiple plays of the sound.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
   */

  const source = new AudioBufferSourceNode(audioContext)
  source.buffer = audioBuffer

  const gainNode = new GainNode(audioContext)

  gainNode.gain.setValueAtTime(volume / 100, audioContext.currentTime)

  source.connect(gainNode).connect(audioContext.destination)
  source.start()
}
