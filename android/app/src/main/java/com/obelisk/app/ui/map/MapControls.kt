package com.obelisk.app.ui.map

import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.ViewInAr
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.unit.dp
import com.obelisk.app.ui.common.GlassSurface
import com.obelisk.app.ui.theme.ObeliskTheme
import kotlin.math.abs
import kotlinx.coroutines.launch

private const val BEARING_THRESHOLD = 1.0

/**
 * Stacked bottom-right map controls: 3D toggle, layers, and locate/compass.
 *
 * The bottom button dynamically switches between a locate icon (when map faces
 * north) and a rotating compass icon (when the map bearing is off-north).
 * Tapping compass resets bearing to north; tapping locate flies to user.
 *
 * @param is3D Whether the map is currently in 3D perspective mode.
 * @param bearing Current map bearing in degrees (0 = north).
 * @param on3DClick Callback for 3D toggle.
 * @param onLayersClick Callback for layers toggle.
 * @param onLocateClick Callback for locate/re-center.
 * @param onCompassClick Callback to reset bearing to north.
 * @param modifier Modifier to apply.
 */
@Composable
fun MapControls(
    is3D: Boolean,
    bearing: Double,
    on3DClick: () -> Unit,
    onLayersClick: () -> Unit,
    onLocateClick: () -> Unit,
    onCompassClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ObeliskTheme.colors
    val springs = ObeliskTheme.springs
    val isRotated = abs(bearing) > BEARING_THRESHOLD
    val locateScale = remember { Animatable(1f) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        GlassSurface(modifier = Modifier.size(48.dp)) {
            IconButton(onClick = on3DClick, modifier = Modifier.size(48.dp)) {
                Icon(
                    imageVector = Icons.Default.ViewInAr,
                    contentDescription = "3D",
                    tint = if (is3D) colors.ctaBlue else colors.foreground,
                    modifier = Modifier.size(20.dp),
                )
            }
        }

        GlassSurface(modifier = Modifier.size(48.dp)) {
            IconButton(onClick = onLayersClick, modifier = Modifier.size(48.dp)) {
                Icon(
                    imageVector = Icons.Default.Layers,
                    contentDescription = "Layers",
                    tint = colors.foreground,
                    modifier = Modifier.size(20.dp),
                )
            }
        }

        GlassSurface(modifier = Modifier.size(48.dp)) {
            if (isRotated) {
                IconButton(onClick = onCompassClick, modifier = Modifier.size(48.dp)) {
                    Icon(
                        imageVector = Icons.Default.Explore,
                        contentDescription = "Reset north",
                        tint = colors.ctaBlue,
                        modifier = Modifier
                            .size(20.dp)
                            .rotate(-bearing.toFloat()),
                    )
                }
            } else {
                IconButton(
                    onClick = {
                        scope.launch {
                            locateScale.animateTo(0.7f, springs.quick)
                            locateScale.animateTo(1f, springs.snappy)
                        }
                        onLocateClick()
                    },
                    modifier = Modifier.size(48.dp).scale(locateScale.value),
                ) {
                    Icon(
                        imageVector = Icons.Default.MyLocation,
                        contentDescription = "Locate",
                        tint = colors.foreground,
                        modifier = Modifier.size(20.dp),
                    )
                }
            }
        }
    }
}
