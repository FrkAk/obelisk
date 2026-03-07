package com.obelisk.app.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.theme.ObeliskTheme

private const val GLASS_ALPHA_BOOST = 0.08f
private const val BORDER_ALPHA_STRONG = 0.18f
private const val BORDER_ALPHA_DEFAULT = 0.10f
private const val BORDER_TOP_MULTIPLIER = 1.5f
private const val BORDER_MID_MULTIPLIER = 0.4f
private val GLASS_BORDER_WIDTH = 0.5.dp

/**
 * Reusable frosted glass container using gradient-based glassmorphism.
 * Semi-transparent gradient fill + gradient border for a glass edge effect.
 *
 * @param modifier Modifier to apply.
 * @param strong Whether to use the strong border variant.
 * @param cornerRadius Override corner radius. Defaults to [ObeliskShapes.full].
 * @param content Composable content inside the glass surface.
 */
@Composable
fun GlassSurface(
    modifier: Modifier = Modifier,
    strong: Boolean = false,
    cornerRadius: Dp = Dp.Unspecified,
    content: @Composable () -> Unit,
) {
    val colors = ObeliskTheme.colors
    val shape: Shape = if (cornerRadius == Dp.Unspecified) {
        ObeliskTheme.shapes.full
    } else {
        remember(cornerRadius) { RoundedCornerShape(cornerRadius) }
    }

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

    Box(
        modifier = modifier
            .clip(shape)
            .background(glassFill, shape)
            .border(width = GLASS_BORDER_WIDTH, brush = glassBorder, shape = shape),
        contentAlignment = Alignment.Center,
    ) {
        content()
    }
}
