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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme
import kotlin.math.roundToInt

/** Snap positions for the bottom sheet. */
enum class SheetDetent { Mini, Medium, Large }

/**
 * Sheet geometry — all values are fractions of screen dimensions.
 * Mini is a compact pill (search bar height). Medium and large leave
 * generous breathing room from the screen edges.
 */
object SheetGeometry {
    /** Height each detent occupies as a fraction of screen height. */
    const val MINI_HEIGHT = 0.07f
    const val MEDIUM_HEIGHT = 0.42f
    const val LARGE_HEIGHT = 0.68f

    /** Bottom inset — lifts the entire sheet off the screen bottom. */
    const val BOTTOM_INSET = 0.05f

    /** Side margin as a fraction of screen width (constant across detents). */
    const val SIDE_MARGIN = 0.04f

    /** Corner radius as a fraction of screen width (constant across detents). */
    const val CORNER_RADIUS = 0.045f
}


/** Drag handle pill dimensions as screen-width fractions. */
private const val HANDLE_WIDTH_FRACTION = 0.10f
private const val HANDLE_HEIGHT_FRACTION = 0.012f
private const val HANDLE_PADDING_FRACTION = 0.01f

/**
 * Returns the target detent for a given sheet mode.
 *
 * @param mode The current sheet mode.
 * @return Target detent to animate to.
 */
private fun targetDetent(mode: SheetMode): SheetDetent = when (mode) {
    is SheetMode.Idle -> SheetDetent.Mini
    is SheetMode.Search -> SheetDetent.Medium
    is SheetMode.Poi -> SheetDetent.Medium
    is SheetMode.Remark -> SheetDetent.Medium
}

/**
 * Computes the Y offset (from screen top) for each detent.
 * The sheet's top edge = screenHeight - bottomInset - detentHeight.
 *
 * @param screenHeight Total screen height in px.
 * @return Triple of (mini, medium, large) offsets in px.
 */
fun sheetOffsets(screenHeight: Float): Triple<Float, Float, Float> {
    val bottomInset = screenHeight * SheetGeometry.BOTTOM_INSET
    val mini = screenHeight - bottomInset - screenHeight * SheetGeometry.MINI_HEIGHT
    val medium = screenHeight - bottomInset - screenHeight * SheetGeometry.MEDIUM_HEIGHT
    val large = screenHeight - bottomInset - screenHeight * SheetGeometry.LARGE_HEIGHT
    return Triple(mini, medium, large)
}

/**
 * Creates and remembers an [AnchoredDraggableState] for the sheet.
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
 * Persistent floating bottom sheet with three detents (mini, medium, large).
 * Glassmorphism styling with spring-based snap animation.
 *
 * @param state Hoisted anchored draggable state.
 * @param mode Current sheet content mode.
 * @param modifier Modifier applied to the outer container.
 */
@Composable
fun ObeliskSheet(
    state: AnchoredDraggableState<SheetDetent>,
    mode: SheetMode,
    modifier: Modifier = Modifier,
) {
    val colors = ObeliskTheme.colors

    BoxWithConstraints(modifier = modifier) {
        val screenH = constraints.maxHeight.toFloat()
        val screenW = constraints.maxWidth.toFloat()
        val density = LocalDensity.current

        val (miniOffset, mediumOffset, largeOffset) = sheetOffsets(screenH)

        val anchors = remember(screenH) {
            DraggableAnchors {
                SheetDetent.Mini at miniOffset
                SheetDetent.Medium at mediumOffset
                SheetDetent.Large at largeOffset
            }
        }

        LaunchedEffect(anchors) {
            state.updateAnchors(anchors, state.targetValue)
        }

        val currentOffset by remember {
            derivedStateOf { state.offset.takeIf { !it.isNaN() } ?: miniOffset }
        }

        val sideMarginDp = with(density) { (screenW * SheetGeometry.SIDE_MARGIN).toDp() }
        val cornerRadiusDp = with(density) { (screenW * SheetGeometry.CORNER_RADIUS).toDp() }

        val shape = RoundedCornerShape(cornerRadiusDp)


        // Animate to target detent when mode changes
        val target = targetDetent(mode)
        LaunchedEffect(target) {
            state.animateTo(target)
        }

        // Sheet fills from its top edge down to the bottom inset
        val bottomInsetPx = screenH * SheetGeometry.BOTTOM_INSET
        val sheetHeightPx by remember {
            derivedStateOf { (screenH - currentOffset - bottomInsetPx).coerceAtLeast(0f) }
        }
        val sheetHeightDp = with(density) { sheetHeightPx.toDp() }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = sideMarginDp)
                .offset { IntOffset(0, currentOffset.roundToInt()) }
                .height(sheetHeightDp)
                .anchoredDraggable(
                    state = state,
                    orientation = Orientation.Vertical,
                )
                .clip(shape)
                .background(colors.glassBg),
        ) {
            Column {
                DragHandle(screenWidthPx = screenW)
                SheetContent(mode = mode)
            }
        }
    }
}

/**
 * Centered drag handle pill.
 *
 * @param screenWidthPx Screen width in pixels for proportional sizing.
 */
@Composable
private fun DragHandle(screenWidthPx: Float) {
    val density = LocalDensity.current
    val handleWidth = with(density) { (screenWidthPx * HANDLE_WIDTH_FRACTION).toDp() }
    val handleHeight = with(density) { (screenWidthPx * HANDLE_HEIGHT_FRACTION).toDp() }
    val verticalPadding = with(density) { (screenWidthPx * HANDLE_PADDING_FRACTION).toDp() }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = verticalPadding),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .width(handleWidth)
                .height(handleHeight)
                .clip(RoundedCornerShape(50))
                .background(ObeliskTheme.colors.secondary.copy(alpha = 0.3f)),
        )
    }
}

