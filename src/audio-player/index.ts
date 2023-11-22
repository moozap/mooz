/**
 * See class {@link AudioPlayer} 
 * @module AudioPlayer
 */
import { AudioPlayer, AudioPlayerProps } from './AudioPlayer'

export * from './AudioPlayer'

export function createAudioPlayer(props: AudioPlayerProps): AudioPlayer {
  return new AudioPlayer(props)
}
