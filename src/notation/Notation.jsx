import { useEffect, useRef } from 'react'
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'

export function Notation(props) {
  const ref = useRef()

  useEffect(
    function () {
      const el = ref.current

      let osmd

      createNotation({
        el,
        ...props,
      }).then(function (instance) {
        osmd = instance
      })

      return function () {
        if (osmd && osmd.drawer) {
          osmd.clear()
        }
        el.innerHTML = ''
      }
    },
    [props.url, props.xml]
  )

  return <div className={props.className} ref={ref}></div>
}

async function createNotation({
  el,
  url,
  xml,
  onBeforeLoad,
  onLoad,
  onRender,
  ...options
}) {
  if (url) {
    onBeforeLoad && onBeforeLoad()
    try {
      url = url
        .split('/')
        .map((r) => encodeURIComponent(r))
        .join('/')
      const response = await fetch(url)
      if (!response.ok)
        throw new Error(`Error getting file, ${url}: Status ${response.status}`)
      xml = await response.text()
    } catch (e) {
      console.error(e.message)
    }
  }

  if (!xml) return

  const partCount = xml.split('</score-part>').length - 1

  if (options.darkMode) {
    Object.assign(options, {
      pageBackgroundColor: 'transparent',
      defaultColorMusic: '#f4f4f4',
      defaultColorLabel: '#cacaca',
    })
  }

  if (options.drawMode) {
    if (options.drawMode === 'score') {
      Object.assign(options, {
        drawingParameters: 'default',
        drawTitle: true,
        drawMetronomeMarks: true,

        pageTopMargin: 1,
        pageBottomMargin: 0,
        pageLeftMargin: 1,
        pageRightMargin: 1,
      })
    } else {
      // Compact mode by default
      Object.assign(options, {
        pageTopMargin: 0,
        pageBottomMargin: 0,
        pageLeftMargin: 0,
        pageRightMargin: 0.1,
      })
    }
  }

  const {
    darkMode,
    zoom = 1,

    defaultColorMusic = '#000000',
    defaultColorLabel = '#545454',
    pageBackgroundColor = '#ffffff',

    cursorColor = '#ffff01', // #ffff01 (yellow), #33e02f (green), #002bea (blue)
    cursorAlpha = 0.4,

    defaultFontFamily, // = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',

    pageTopMargin = 0, // 1
    pageBottomMargin = 0,
    pageLeftMargin = 0, // 1
    pageRightMargin = 0.1, // 1 // Must be above zero to fit barline

    singleLine: renderSingleHorizontalStaffline = false,
    stretch: stretchLastSystemLine = false,

    drawingParameters = 'compact', // allon, compact, compacttight, default, leadsheet, preview, thumbnail
    drawTitle = false,
    drawMetronomeMarks = false, // Tempo
    drawPartNames = partCount > 1, // Show part names by default if there are more than one
  } = options

  const osmd = new OpenSheetMusicDisplay(el, {
    autoResize: true,
    backend: 'svg',
    /**
     * Canvas backend is deprecated apparently.
     *
     * > ..Dark mode doesn't work with canvas. You shouldn't use canvas anyways, it's kind of deprecated. (at least in Vexflow) It doesn't support transparency or layers.
     * https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues/1125#issuecomment-1197286462
     */
    // darkMode: true,

    defaultColorMusic,
    defaultColorLabel,

    // pageFormat: 'A4_P',

    drawingParameters,
    drawTitle,
    drawMetronomeMarks,

    drawPartNames,
    drawMeasureNumbers: false,

    followCursor: true,

    defaultFontFamily,

    /**
     * Keep entire score in singe row, even when it's longer than available width
     */
    renderSingleHorizontalStaffline,

    /**
     * Stretch to fill available width, even when the score is shorter
     */
    stretchLastSystemLine,

    cursorsOptions: [
      {
        /**
         * Type of cursor:
         * 0: Standard highlighting current notes
         * 1: Thin line left to the current notes
         * 2: Short thin line on top of stave and left to the current notes
         * 3: Current measure
         * 4: Current measure to left of current notes
         */
        type: 0,
        alpha: cursorAlpha,
        color: cursorColor,
        follow: true,
      },
    ],

    onRender() {
      onRender && onRender(osmd)
    },
  })

  osmd.setLogLevel('warn') // trace, debug, ..

  /**
   * @see opensheetmusicdisplay/MusicalScore/Graphical/DrawingParameters.ts, setForCompactMode()
   * @see opensheetmusicdisplay/MusicalScore/Graphical/EngravingRules.ts
   */
  Object.assign(osmd.rules, {
    PageTopMarginNarrow: pageTopMargin, // For compact mode
    PageLeftMargin: pageLeftMargin,
    PageRightMargin: pageRightMargin, // For bar end
    PageBottomMargin: pageBottomMargin,

    PageBackgroundColor: pageBackgroundColor,

    TitleTopDistance: 1, // Default 5.0
    TitleBottomDistance: 1, // Default 1
    SheetTitleHeight: 3.4, // 4

    // RhythmRightMargin: -1.25, // Was 1.25, then 4.5 - Ensure room for minimum measure width

    LyricUnderscoreColorOrStyle: defaultColorLabel,
    // LyricsHeight: 1.8,
    // ChordSymbolTextHeight: 1.8,

    // StaffLineWidth: 0.2, // default 0.1
    // LedgerLineWidth: 2.0, // default 1.0

    // compacttight - /mooz/osmd/MusicalScore/Graphical/DrawingParameters.ts, setForCompactTightMode

    // VoiceSpacingMultiplierVexflow: 0.65,
    VoiceSpacingAddendVexflow: 2.0,

    // tight rendering mode, lower margins and safety distances between systems, staffs etc. may cause overlap.
    // these options can afterwards be finetuned by setting osmd.rules.BetweenStaffDistance for example
    MinSkyBottomDistBetweenStaves: 1.0, // default 1.0. this can cause collisions with slurs and dynamics sometimes
    MinSkyBottomDistBetweenSystems: 3.0, // default 5.0
    // note that this.rules === osmd.rules, since it's passed as a reference

    BetweenStaffDistance: 2.5,
    StaffDistance: 3.5,
    MinimumDistanceBetweenSystems: 1,
  })

  // zoom

  try {
    await osmd.load(xml)
    osmd.zoom = zoom
    onLoad && setTimeout(() => onLoad(osmd), 0) // After cursor ready
  } catch (e) {
    console.error(e.message)
  }
  return osmd
}
