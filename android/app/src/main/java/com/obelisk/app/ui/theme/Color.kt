package com.obelisk.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

/** Light palette. */
val ObeliskLightColors = ObeliskColors(
    isDark = false,
    foreground = Color(0xFF1D1D1F),
    secondary = Color(0xFF6E6E73),
    tertiary = Color(0xFF86868B),
    background = Color(0xFFFFFFFF),
    surface = Color(0xFFF5F5F7),
    elevated = Color(0xFFFFFFFF),
    accent = Color(0xFFC49A6C),
    accentSubtle = Color(0x1FC49A6C),
    ctaBlue = Color(0xFF007AFF),
    ctaBlueSubtle = Color(0x1F007AFF),
    location = Color(0xFF3478F6),
    error = Color(0xFFE5484D),
    glassBg = Color(0xBFFFFFFF),
    glassBorder = Color(0x0F000000),
    glassBorderStrong = Color(0x1F000000),
)

/** Dark palette. */
val ObeliskDarkColors = ObeliskColors(
    isDark = true,
    foreground = Color(0xFFF5F5F7),
    secondary = Color(0xFFA1A1A6),
    tertiary = Color(0xFF6E6E73),
    background = Color(0xFF000000),
    surface = Color(0xFF141414),
    elevated = Color(0xFF1C1C1E),
    accent = Color(0xFFD4AA7C),
    accentSubtle = Color(0x1FD4AA7C),
    ctaBlue = Color(0xFF0A84FF),
    ctaBlueSubtle = Color(0x260A84FF),
    location = Color(0xFF5E9EFF),
    error = Color(0xFFE54D4D),
    glassBg = Color(0xC7141414),
    glassBorder = Color(0x0FFFFFFF),
    glassBorderStrong = Color(0x1FFFFFFF),
)

/** Category pin colors. */
val CategoryPinOrange = Color(0xFFE88545)
val CategoryPinPink = Color(0xFFE85D9F)
val CategoryPinPurple = Color(0xFFA87DFF)
val CategoryPinGreen = Color(0xFF34C759)
val CategoryPinBlue = Color(0xFF5E9EFF)
val CategoryPinAmber = Color(0xFFD4AA7C)
val CategoryPinGray = Color(0xFF8E8E93)

/**
 * Full Obelisk color palette.
 *
 * @param isDark Whether this palette is the dark variant.
 * @param foreground Primary text color.
 * @param secondary Secondary text color.
 * @param tertiary Tertiary/hint text color.
 * @param background Root background.
 * @param surface Card/section surface.
 * @param elevated Elevated surface (sheets, modals).
 * @param accent Brand warm amber.
 * @param accentSubtle Accent at reduced opacity.
 * @param ctaBlue Primary action blue.
 * @param ctaBlueSubtle CTA blue at reduced opacity.
 * @param location User location dot color.
 * @param error Error/destructive color.
 * @param glassBg Glass surface background (semi-transparent + blur).
 * @param glassBorder Glass surface border (subtle).
 * @param glassBorderStrong Glass surface border (strong).
 */
@Immutable
data class ObeliskColors(
    val isDark: Boolean,
    val foreground: Color,
    val secondary: Color,
    val tertiary: Color,
    val background: Color,
    val surface: Color,
    val elevated: Color,
    val accent: Color,
    val accentSubtle: Color,
    val ctaBlue: Color,
    val ctaBlueSubtle: Color,
    val location: Color,
    val error: Color,
    val glassBg: Color,
    val glassBorder: Color,
    val glassBorderStrong: Color,
)
