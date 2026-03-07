package com.obelisk.app.ui.map

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import com.mapbox.maps.Style
import com.mapbox.maps.extension.compose.MapEffect
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.MapViewportState
import com.mapbox.maps.extension.compose.style.MapStyle
import com.mapbox.maps.plugin.PuckBearing
import com.mapbox.maps.plugin.locationcomponent.createDefault2DPuck
import com.mapbox.maps.plugin.locationcomponent.location
import com.obelisk.app.BuildConfig
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Mapbox map wrapper with native location puck (pulsing, bearing, 3D-aware).
 * Uses custom styles from .env if available, falls back to Mapbox defaults.
 * All default ornaments (compass, scale, logo, attribution) are hidden.
 *
 * @param mapViewportState Camera viewport state for external control.
 * @param showLocationPuck Whether to show the location puck (requires permission).
 * @param modifier Modifier to apply.
 */
@Composable
fun ObeliskMap(
    mapViewportState: MapViewportState,
    showLocationPuck: Boolean,
    modifier: Modifier = Modifier,
) {
    val isDark = isSystemInDarkTheme()
    val styleUri = if (isDark) {
        BuildConfig.MAPBOX_STYLE_DARK.ifEmpty { Style.DARK }
    } else {
        BuildConfig.MAPBOX_STYLE_LIGHT.ifEmpty { Style.LIGHT }
    }
    val locationColor = ObeliskTheme.colors.location

    key(styleUri) {
        MapboxMap(
            modifier = modifier.fillMaxSize(),
            mapViewportState = mapViewportState,
            style = { MapStyle(style = styleUri) },
            compass = {},
            scaleBar = {},
            logo = {},
            attribution = {},
        ) {
            MapEffect(showLocationPuck) { mapView ->
                mapView.location.apply {
                    enabled = showLocationPuck
                    if (showLocationPuck) {
                        locationPuck = createDefault2DPuck(withBearing = true)
                        puckBearingEnabled = true
                        puckBearing = PuckBearing.HEADING
                        pulsingEnabled = true
                        pulsingColor = locationColor.toArgb()
                        pulsingMaxRadius = 40f
                        showAccuracyRing = true
                        accuracyRingColor = locationColor.copy(alpha = 0.10f).toArgb()
                        accuracyRingBorderColor = locationColor.copy(alpha = 0.25f).toArgb()
                    }
                }
            }
        }
    }
}
