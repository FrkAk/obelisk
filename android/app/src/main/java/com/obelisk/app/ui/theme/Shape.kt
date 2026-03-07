package com.obelisk.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Immutable
import androidx.compose.ui.unit.dp

/**
 * Corner radius tokens.
 *
 * @param sm 8dp — small chips, pills.
 * @param md 12dp — cards, inputs.
 * @param lg 16dp — sheets at large detent.
 * @param xl 20dp — sheets at medium detent.
 * @param xl2 24dp — search pill.
 * @param xl3 32dp — sheets at mini detent.
 * @param sheet 28dp — bottom sheet.
 * @param full 9999dp — fully round (circles, capsules).
 */
@Immutable
data class ObeliskShapes(
    val sm: RoundedCornerShape = RoundedCornerShape(8.dp),
    val md: RoundedCornerShape = RoundedCornerShape(12.dp),
    val lg: RoundedCornerShape = RoundedCornerShape(16.dp),
    val xl: RoundedCornerShape = RoundedCornerShape(20.dp),
    val xl2: RoundedCornerShape = RoundedCornerShape(24.dp),
    val xl3: RoundedCornerShape = RoundedCornerShape(32.dp),
    val sheet: RoundedCornerShape = RoundedCornerShape(28.dp),
    val full: RoundedCornerShape = RoundedCornerShape(9999.dp),
)
