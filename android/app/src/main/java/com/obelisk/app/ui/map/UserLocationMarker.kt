package com.obelisk.app.ui.map

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme

private const val PULSE_TARGET_SCALE = 1.8f
private const val PULSE_DURATION_MS = 2000
private const val PULSE_INITIAL_ALPHA = 0.20f
private const val ACCURACY_RING_ALPHA = 0.15f
private const val ACCURACY_RING_SCALE = 2f
private val DOT_RADIUS = 6.dp
private val BORDER_WIDTH = 2.dp
private val MARKER_SIZE = 48.dp

/**
 * Blue dot with accuracy ring and pulse animation for user location.
 * Uses tween for pulse because infiniteRepeatable requires DurationBasedAnimationSpec.
 *
 * @param modifier Modifier to apply.
 */
@Composable
fun UserLocationMarker(modifier: Modifier = Modifier) {
    val locationColor = ObeliskTheme.colors.location
    val borderColor = ObeliskTheme.colors.background
    val infiniteTransition = rememberInfiniteTransition(label = "locationPulse")

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = PULSE_TARGET_SCALE,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = PULSE_DURATION_MS),
            repeatMode = RepeatMode.Restart,
        ),
        label = "pulseScale",
    )

    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = PULSE_INITIAL_ALPHA,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = PULSE_DURATION_MS),
            repeatMode = RepeatMode.Restart,
        ),
        label = "pulseAlpha",
    )

    Canvas(modifier = modifier.size(MARKER_SIZE)) {
        val center = this.center
        val dotRadius = DOT_RADIUS.toPx()

        // Pulse ring
        drawCircle(
            color = locationColor.copy(alpha = pulseAlpha),
            radius = dotRadius * pulseScale,
            center = center,
        )

        // Accuracy ring
        drawCircle(
            color = locationColor.copy(alpha = ACCURACY_RING_ALPHA),
            radius = dotRadius * ACCURACY_RING_SCALE,
            center = center,
        )

        // Border
        drawCircle(
            color = borderColor,
            radius = dotRadius + BORDER_WIDTH.toPx(),
            center = center,
        )

        // Blue dot
        drawCircle(
            color = locationColor,
            radius = dotRadius,
            center = center,
        )
    }
}
