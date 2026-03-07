package com.obelisk.app.ui.theme

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.SpringSpec
import androidx.compose.runtime.Immutable

/**
 * Named spring specs for all motion in the app.
 *
 * @param snappy Buttons, tap feedback.
 * @param smooth Content transitions.
 * @param gentle List entries, reveals.
 * @param liquid Sheet morphing.
 * @param quick Micro-interactions.
 * @param pinDrop Pin selection bounce.
 */
@Immutable
data class ObeliskSprings(
    val snappy: SpringSpec<Float> = spring(stiffness = 400f, dampingRatio = 0.85f),
    val smooth: SpringSpec<Float> = spring(stiffness = 200f, dampingRatio = 0.85f),
    val gentle: SpringSpec<Float> = spring(stiffness = 150f, dampingRatio = 0.80f),
    val liquid: SpringSpec<Float> = spring(stiffness = 180f, dampingRatio = 0.78f),
    val quick: SpringSpec<Float> = spring(stiffness = 500f, dampingRatio = 0.90f),
    val pinDrop: SpringSpec<Float> = spring(stiffness = 300f, dampingRatio = 0.65f),
)

/**
 * Creates a SpringSpec with the given stiffness and damping ratio.
 *
 * @param stiffness Spring stiffness constant.
 * @param dampingRatio Damping ratio (0 = undamped, 1 = critically damped).
 * @return A configured SpringSpec.
 */
private fun spring(stiffness: Float, dampingRatio: Float): SpringSpec<Float> =
    SpringSpec(dampingRatio = dampingRatio, stiffness = stiffness)
