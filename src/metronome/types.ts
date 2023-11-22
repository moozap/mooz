
/**
 * Time signature
 */
export type MetronomeTimeSignature = {
  numberOfBeats: number
  beatUnit: number
}

/**
 * Position of the metronome by various units of measurement
 */
export type MetronomePosition = {
  /**
   * Absolute beat based on quarter notes, independent of time signature
   * - `0` = first beat
   */
  beatIndex: number

  /**
   * Metronome beat based on time signature's beat unit
   * - `0` = stopped
   * - `1` = first beat
   *
  metronomeBeat: number
  */

  /**
   * Current measure based on time signature
   * - `1` = first measure
   */
  currentMeasure: number
  /**
   * Current measure's beat count based on time signature
   * - `1` = first beat
   */
  currentBeat: number
}
