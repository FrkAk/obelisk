package com.obelisk.app.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private const val GLASS_ALPHA_BOOST = 0.08f
private const val BORDER_ALPHA_STRONG = 0.18f
private const val BORDER_ALPHA_DEFAULT = 0.10f
private const val BORDER_TOP_MULTIPLIER = 1.5f
private const val BORDER_MID_MULTIPLIER = 0.4f
private val GLASS_BORDER_WIDTH = 0.5.dp

/**
 * Applies gradient-based glassmorphism styling: semi-transparent gradient fill
 * with a gradient border for the glass edge effect.
 *
 * @param strong Whether to use the strong border variant.
 * @return Modified [Modifier] with glass styling.
 */
@Composable
fun Modifier.glassBackground(strong: Boolean = false): Modifier {
    val colors = ObeliskTheme.colors
    val shape = ObeliskTheme.shapes.xl2

    val glassFill = remember(colors) {
        Brush.linearGradient(
            colors = listOf(
                colors.glassBg.copy(alpha = colors.glassBg.alpha + GLASS_ALPHA_BOOST),
                colors.glassBg,
            ),
        )
    }

    val borderAlpha = if (strong) BORDER_ALPHA_STRONG else BORDER_ALPHA_DEFAULT
    val borderHighlight = if (colors.isDark) Color.White else Color.Black
    val glassBorder = remember(colors, strong) {
        Brush.linearGradient(
            colors = listOf(
                borderHighlight.copy(alpha = borderAlpha * BORDER_TOP_MULTIPLIER),
                borderHighlight.copy(alpha = borderAlpha * BORDER_MID_MULTIPLIER),
                borderHighlight.copy(alpha = borderAlpha),
            ),
        )
    }

    return this
        .clip(shape)
        .background(glassFill, shape)
        .border(width = GLASS_BORDER_WIDTH, brush = glassBorder, shape = shape)
}
