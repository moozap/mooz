;(async () => {
  const sleep = (duration) =>
    new Promise((resolve) => setTimeout(resolve, duration))

  osmd.cursor.show()

  while (!osmd.cursor.iterator.EndReached) {
    await sleep(300)
    osmd.cursor.next()
  }
  await sleep(1000)
  osmd.cursor.reset()
})().catch(console.error)

// /mooz/osmd/OpenSheetMusicDisplay/Cursor.ts
