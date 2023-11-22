export default function extractScoreData(osmd) {
  const cursor = osmd.cursor || osmd.cursors[0]

  // console.log('osmd', osmd)

  if (!cursor) return

  // https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Tutorial:-Extracting-note-timing-for-playing
  // /mooz/osmd/MusicalScore/MusicParts/MusicPartManagerIterator.ts
  const allNotes = []

  cursor.reset()
  const iterator = cursor.Iterator

  let cursorIndex = 0
  while (!iterator.EndReached) {
    //
    const voices = iterator.CurrentVoiceEntries

    // const measure = osmd.sheet.sourceMeasures[iterator.CurrentMeasureIndex]
    // const bpm = measure ? measure.TempoInBPM : 60
    // iterator.CurrentBpm === undefined
    // console.log(cursorIndex, voices)

    cursorIndex++

    for (let i = 0; i < voices.length; i++) {
      const v = voices[i]
      const notes = v.Notes

      for (let j = 0; j < notes.length; j++) {
        const note = notes[j]

        // make sure our note is not silent
        if (note == null || note.halfTone == 0 || note.isRest()) continue

        // Graphical element
        const gNote = osmd.rules.GNote(note)
        const el = gNote ? gNote.getSVGGElement() : null
        if (el) {
          // Input events - https://github.com/0xfe/vexflow/issues/371
        }

        allNotes.push({
          note: note.halfTone + 12, // see issue #224

          // Time in standard 60 BPM
          time: iterator.currentTimeStamp.RealValue * 4, // * 60/bpm // Convert to current tempo

          // Convert from measure = 1 to quarter note = 1
          duration: note.Length.realValue * 4,

          el,
        })
      }
    }

    iterator.moveToNext()
  }

  const scoreData = {
    allNotes,
  }

  if (!osmd.sheet) {
    console.log('No osmd.sheet?', osmd)
  } else {
    // console.log('sheet', osmd.sheet)
    // /osmd/MusicalScore/VoiceData/SourceMeasure.ts
    console.log(
      'measure',
      osmd.sheet.sourceMeasures[0].FirstInstructionsStaffEntries
    )
  }

  console.log('extractScoreData', scoreData)

  return scoreData
}
