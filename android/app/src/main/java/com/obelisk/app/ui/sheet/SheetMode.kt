package com.obelisk.app.ui.sheet

/**
 * Represents the current content mode of the bottom sheet.
 * Each mode targets a specific detent when activated.
 */
sealed interface SheetMode {

    /** Default state — sheet at mini detent. */
    data object Idle : SheetMode

    /** Active search with keyboard open — targets mini detent. */
    data object Searching : SheetMode

    /** Search results displayed — targets medium detent (locked). */
    data object Results : SheetMode

    /** POI detail card — targets mini detent initially. */
    data class Poi(
        val name: String,
        val category: String?,
        val fromSearch: Boolean = false,
    ) : SheetMode

    /** Remark content — targets medium detent. */
    data object Remark : SheetMode

    /** User profile — targets medium detent. */
    data object Profile : SheetMode
}
