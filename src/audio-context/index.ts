/**
 * ```ts
 * import { getAudioContext } from 'mooz/audio-context'
 * 
 * const audioContext = await getAudioContext()
 * ```
 * @module AudioContext
 */
let sharedAudioContext: AudioContext | undefined

/**
 * Get a single shared instance of AudioContext
 */
export function getAudioContext(): AudioContext | undefined {
  if (sharedAudioContext) return sharedAudioContext
  if (typeof window !== 'undefined') {
    sharedAudioContext = new AudioContext()
  }
  return sharedAudioContext
}

/**
 * Activate audio context
 *
 * Call this from an event triggered by user gesture, such as on click
 */
export async function activateAudioContext(): Promise<void> {

  if (this.state.audioContextReady) return

  const audioContext = getAudioContext()

  // Create empty buffer and play it - iOS specific requirement

  const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate)
  const source = audioContext.createBufferSource()

  source.buffer = buffer
  source.connect(audioContext.destination)
  source.start(0)

  // Start/resume
  if (audioContext.resume) return audioContext.resume()
}
