package com.obelisk.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf

val LocalObeliskColors = staticCompositionLocalOf { ObeliskLightColors }
val LocalObeliskTypography = staticCompositionLocalOf { ObeliskTypography() }
val LocalObeliskShapes = staticCompositionLocalOf { ObeliskShapes() }
val LocalObeliskSprings = staticCompositionLocalOf { ObeliskSprings() }

/**
 * Root theme composable. Wraps MaterialTheme for interop but app code
 * reads from [ObeliskTheme] accessors.
 *
 * @param darkTheme Whether to use dark palette. Defaults to system setting.
 * @param content Composable content.
 */
@Composable
fun ObeliskTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) ObeliskDarkColors else ObeliskLightColors

    CompositionLocalProvider(
        LocalObeliskColors provides colors,
        LocalObeliskTypography provides ObeliskTypography(),
        LocalObeliskShapes provides ObeliskShapes(),
        LocalObeliskSprings provides ObeliskSprings(),
    ) {
        MaterialTheme(content = content)
    }
}

/** Accessor for Obelisk design tokens via CompositionLocal. */
object ObeliskTheme {
    val colors: ObeliskColors
        @Composable @ReadOnlyComposable
        get() = LocalObeliskColors.current

    val typography: ObeliskTypography
        @Composable @ReadOnlyComposable
        get() = LocalObeliskTypography.current

    val shapes: ObeliskShapes
        @Composable @ReadOnlyComposable
        get() = LocalObeliskShapes.current

    val springs: ObeliskSprings
        @Composable @ReadOnlyComposable
        get() = LocalObeliskSprings.current
}
