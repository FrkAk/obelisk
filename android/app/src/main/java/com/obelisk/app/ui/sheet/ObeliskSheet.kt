@file:OptIn(ExperimentalFoundationApi::class)

package com.obelisk.app.ui.sheet

import androidx.compose.animation.core.SpringSpec
import androidx.compose.animation.core.exponentialDecay
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.AnchoredDraggableState
import androidx.compose.foundation.gestures.DraggableAnchors
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.anchoredDraggable
import androidx.compose.foundation.gestures.animateTo
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme

/** Snap positions for the bottom sheet. */
enum class SheetDetent { Mini, Medium, Large }

/**
 * Sheet geometry — all values are fractions of screen height.
 * Heights define how tall the sheet is at each detent.
 */
object SheetGeometry {
    /** Height each detent occupies as a fraction of screen height. */
    const val MINI_HEIGHT = 0.09f
    const val MEDIUM_HEIGHT = 0.42f
    const val LARGE_HEIGHT = 0.68f

    /** Bottom inset — lifts the entire sheet off the screen bottom. */
    const val BOTTOM_INSET = 0.05f

    /** Side margin as a fraction of screen width. */
    const val SIDE_MARGIN = 0.04f
}

/**
 * Returns the target detent for a given sheet mode.
 *
 * @param mode The current sheet mode.
 * @return Target detent to animate to.
 */
private fun targetDetent(mode: SheetMode): SheetDetent = when (mode) {
    is SheetMode.Idle -> SheetDetent.Mini
    is SheetMode.Searching -> SheetDetent.Mini
    is SheetMode.Results -> SheetDetent.Medium
    is SheetMode.Poi -> SheetDetent.Mini
    is SheetMode.Remark -> SheetDetent.Medium
    is SheetMode.Profile -> SheetDetent.Medium
}

/**
 * Returns the set of detents the user can drag between for a given mode.
 *
 * @param mode The current sheet mode.
 * @param imeVisible Whether the keyboard is currently visible.
 * @return Set of allowed detents.
 */
private fun allowedDetents(mode: SheetMode, imeVisible: Boolean): Set<SheetDetent> {
    if (imeVisible) return setOf(SheetDetent.Mini)
    return when (mode) {
        is SheetMode.Idle -> setOf(SheetDetent.Mini, SheetDetent.Medium)
        is SheetMode.Searching -> setOf(SheetDetent.Mini)
        is SheetMode.Results -> setOf(SheetDetent.Medium)
        is SheetMode.Poi -> setOf(SheetDetent.Mini, SheetDetent.Medium, SheetDetent.Large)
        is SheetMode.Profile -> setOf(SheetDetent.Medium)
        is SheetMode.Remark -> setOf(SheetDetent.Medium, SheetDetent.Large)
    }
}

/**
 * Computes the sheet height in px for each detent.
 *
 * @param screenHeight Total screen height in px.
 * @return Triple of (mini, medium, large) heights in px.
 */
fun sheetHeights(screenHeight: Float): Triple<Float, Float, Float> {
    val mini = screenHeight * SheetGeometry.MINI_HEIGHT
    val medium = screenHeight * SheetGeometry.MEDIUM_HEIGHT
    val large = screenHeight * SheetGeometry.LARGE_HEIGHT
    return Triple(mini, medium, large)
}

/**
 * Creates and remembers an [AnchoredDraggableState] for the sheet.
 * Anchor values represent sheet heights — dragging up increases height.
 *
 * @param initialDetent Initial snap position.
 * @return Configured anchored draggable state.
 */
@Composable
fun rememberSheetState(
    initialDetent: SheetDetent = SheetDetent.Mini,
): AnchoredDraggableState<SheetDetent> {
    val density = LocalDensity.current
    return remember {
        AnchoredDraggableState(
            initialValue = initialDetent,
            positionalThreshold = { distance -> distance * 0.4f },
            velocityThreshold = { with(density) { 400.dp.toPx() } },
            snapAnimationSpec = SpringSpec(dampingRatio = 0.86f, stiffness = 160f),
            decayAnimationSpec = exponentialDecay(frictionMultiplier = 3f),
        )
    }
}

/**
 * Persistent floating bottom sheet with bottom-anchored, height-driven positioning.
 * The bottom edge stays fixed above the keyboard/screen bottom while the top edge
 * animates up/down as the sheet height changes between detents.
 *
 * @param state Hoisted anchored draggable state.
 * @param mode Current sheet content mode.
 * @param query Current search query text.
 * @param onQueryChange Called when search text changes.
 * @param onSearchFocused Called when the search pill gains focus.
 * @param onSearchCleared Called when back is tapped in search — clears query + exits.
 * @param onSearchDismissed Called when keyboard is dismissed — exits search, keeps query.
 * @param onResultsCloseClick Called when results close is tapped.
 * @param onPoiShareClick Called when share is tapped in POI mode.
 * @param onPoiCloseClick Called when close is tapped in POI mode.
 * @param onPoiBackToResultsClick Called when back-to-results is tapped in POI mode.
 * @param onAvatarClick Called when the user avatar is tapped.
 * @param onProfileCloseClick Called when profile close is tapped.
 * @param modifier Modifier applied to the outer container.
 */
@Composable
fun ObeliskSheet(
    state: AnchoredDraggableState<SheetDetent>,
    mode: SheetMode,
    query: String,
    onQueryChange: (String) -> Unit,
    onSearchFocused: () -> Unit,
    onSearchCleared: () -> Unit,
    onSearchDismissed: () -> Unit,
    onResultsCloseClick: () -> Unit,
    onPoiShareClick: () -> Unit,
    onPoiCloseClick: () -> Unit,
    onPoiBackToResultsClick: () -> Unit,
    onAvatarClick: () -> Unit,
    onProfileCloseClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ObeliskTheme.colors

    BoxWithConstraints(modifier = modifier) {
        val screenH = constraints.maxHeight.toFloat()
        val screenW = constraints.maxWidth.toFloat()
        val density = LocalDensity.current

        val imeBottomPx = WindowInsets.ime.getBottom(density).toFloat()
        val imeVisible = imeBottomPx > 0f
        val imeGapPx = if (imeVisible) with(density) { 12.dp.toPx() } else 0f

        // When keyboard is dismissed while searching, exit search mode but keep query.
        LaunchedEffect(imeVisible) {
            if (!imeVisible && mode is SheetMode.Searching) {
                onSearchDismissed()
            }
        }

        val (miniH, mediumH, largeH) = sheetHeights(screenH)

        // Track keyboard position directly — WindowInsets.ime already reports
        // frame-by-frame position with adjustNothing. No extra spring needed.
        val bottomInsetPx = maxOf(screenH * SheetGeometry.BOTTOM_INSET, imeBottomPx + imeGapPx)
        val bottomInsetDp = with(density) { bottomInsetPx.toDp() }

        val allowed = allowedDetents(mode, imeVisible)
        val anchors = remember(screenH, allowed) {
            DraggableAnchors {
                if (SheetDetent.Mini in allowed) SheetDetent.Mini at miniH
                if (SheetDetent.Medium in allowed) SheetDetent.Medium at mediumH
                if (SheetDetent.Large in allowed) SheetDetent.Large at largeH
            }
        }

        LaunchedEffect(anchors) {
            state.updateAnchors(anchors, state.targetValue)
        }

        val target = targetDetent(mode)
        LaunchedEffect(mode) {
            state.animateTo(target)
        }

        val currentHeight by remember {
            derivedStateOf { state.offset.takeIf { !it.isNaN() } ?: miniH }
        }

        val sheetHeightDp = with(density) { currentHeight.toDp() }
        val sideMarginDp = with(density) { (screenW * SheetGeometry.SIDE_MARGIN).toDp() }
        val shape = ObeliskTheme.shapes.sheet

        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.BottomCenter,
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = sideMarginDp)
                    .padding(bottom = bottomInsetDp)
                    .height(sheetHeightDp)
                    .anchoredDraggable(
                        state = state,
                        orientation = Orientation.Vertical,
                        reverseDirection = true,
                    )
                    .clip(shape)
                    .background(colors.glassBg),
                contentAlignment = Alignment.TopCenter,
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    SheetTopBar(
                        mode = mode,
                        query = query,
                        onQueryChange = onQueryChange,
                        onSearchFocused = onSearchFocused,
                        onSearchCleared = onSearchCleared,
                        onResultsCloseClick = onResultsCloseClick,
                        onPoiShareClick = onPoiShareClick,
                        onPoiCloseClick = onPoiCloseClick,
                        onPoiBackToResultsClick = onPoiBackToResultsClick,
                        onAvatarClick = onAvatarClick,
                        onProfileCloseClick = onProfileCloseClick,
                    )
                    SheetBody(
                        mode = mode,
                        query = query,
                    )
                }
            }
        }
    }
}
