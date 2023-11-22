/**
 * Based on OpenSheetMusicDisplay
 * @module Notation
 */
import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'

export type { OpenSheetMusicDisplay }

export class Notation {
  notation: OpenSheetMusicDisplay

  constructor(
    el: HTMLElement,
    osmd: {
      OpenSheetMusicDisplay: OpenSheetMusicDisplay
    } = (window.mooz as any).osmd
  ) {
    // @ts-ignore
    this.notation = new osmd.OpenSheetMusicDisplay(el)
  }
}
