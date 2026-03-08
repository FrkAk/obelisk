package com.obelisk.app.ui.search

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.spring
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme
import kotlinx.coroutines.delay

private val PROMPTS = listOf(
    "A quiet cafe near the river\u2026",
    "Something hidden nearby\u2026",
    "Where locals eat lunch\u2026",
    "Best view of the old town\u2026",
    "A place with history\u2026",
    "Somewhere peaceful to read\u2026",
    "A courtyard off the beaten path\u2026",
)

private const val ROTATE_DELAY_MS = 4000L

/**
 * Animated placeholder that cycles through discovery prompts.
 * Text cross-fades with a slight vertical slide every 4 seconds.
 *
 * @param modifier Modifier applied to the animated container.
 */
@Composable
fun RotatingPlaceholder(modifier: Modifier = Modifier) {
    var index by remember { mutableIntStateOf(0) }
    val density = LocalDensity.current
    val slideOffsetPx = with(density) { 4.dp.roundToPx() }

    LaunchedEffect(Unit) {
        while (true) {
            delay(ROTATE_DELAY_MS)
            index = (index + 1) % PROMPTS.size
        }
    }

    AnimatedContent(
        targetState = index,
        transitionSpec = {
            (fadeIn(spring(stiffness = 200f, dampingRatio = 0.85f)) +
                slideInVertically(spring(stiffness = 200f, dampingRatio = 0.85f)) { slideOffsetPx })
                .togetherWith(
                    fadeOut(spring(stiffness = 200f, dampingRatio = 0.85f)) +
                        slideOutVertically(spring(stiffness = 200f, dampingRatio = 0.85f)) { -slideOffsetPx },
                )
        },
        label = "rotating-placeholder",
        modifier = modifier,
    ) { idx ->
        Text(
            text = PROMPTS[idx],
            style = ObeliskTheme.typography.body,
            color = ObeliskTheme.colors.tertiary,
            maxLines = 1,
        )
    }
}
