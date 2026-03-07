package com.obelisk.app.ui.sheet

/**
 * Represents the current content mode of the bottom sheet.
 * Each mode targets a specific detent when activated.
 */
sealed interface SheetMode {

    /** Default state — sheet at mini detent. */
    data object Idle : SheetMode

    /** Search results — targets medium detent. */
    data object Search : SheetMode

    /** POI detail card — targets medium detent. */
    data object Poi : SheetMode

    /** Remark content — targets medium detent. */
    data object Remark : SheetMode
}
