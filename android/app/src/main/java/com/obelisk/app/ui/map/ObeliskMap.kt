package com.obelisk.app.ui.map

import android.util.Log
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import com.mapbox.maps.MapboxExperimental
import com.mapbox.maps.extension.compose.MapEffect
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.MapViewportState
import com.mapbox.maps.extension.compose.style.standard.LightPresetValue
import com.mapbox.maps.extension.compose.style.standard.MapboxStandardStyle
import com.mapbox.maps.extension.compose.style.standard.rememberStandardStyleState
import com.mapbox.maps.plugin.PuckBearing
import com.mapbox.maps.plugin.locationcomponent.createDefault2DPuck
import com.mapbox.maps.plugin.locationcomponent.location
import com.obelisk.app.ui.theme.ObeliskTheme

/**
 * Data extracted from a tapped native Mapbox POI feature.
 *
 * @property name Display name of the POI.
 * @property latitude POI latitude.
 * @property longitude POI longitude.
 * @property category Optional Mapbox category (group or maki).
 */
data class MapPoiClickData(
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val category: String? = null,
)

private const val TAG = "ObeliskMap"

/**
 * Mapbox map wrapper with native location puck and POI click detection.
 * Uses Mapbox Standard style with onPoiClicked interaction for native POI taps.
 *
 * @param mapViewportState Camera viewport state for external control.
 * @param showLocationPuck Whether to show the location puck (requires permission).
 * @param onPoiClick Callback when a native POI feature is tapped.
 * @param modifier Modifier to apply.
 */
@OptIn(MapboxExperimental::class)
@Composable
fun ObeliskMap(
    mapViewportState: MapViewportState,
    showLocationPuck: Boolean,
    onPoiClick: ((MapPoiClickData) -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val isDark = isSystemInDarkTheme()
    val locationColor = ObeliskTheme.colors.location
    val currentOnPoiClick = rememberUpdatedState(onPoiClick)

    val standardStyleState = rememberStandardStyleState {
        configurationsState.lightPreset = if (isDark) LightPresetValue.DUSK else LightPresetValue.DAY

        interactionsState.onPoiClicked { poiFeature, _ ->
            val callback = currentOnPoiClick.value ?: return@onPoiClicked false
            val name = poiFeature.name ?: return@onPoiClicked false
            val geometry = poiFeature.geometry
            val category = poiFeature.group ?: poiFeature.maki

            Log.d(TAG, "POI tapped: \"$name\" at (${geometry.latitude()}, ${geometry.longitude()}) group=${poiFeature.group} maki=${poiFeature.maki}")

            callback(
                MapPoiClickData(
                    name = name,
                    latitude = geometry.latitude(),
                    longitude = geometry.longitude(),
                    category = category,
                )
            )
            true
        }

        interactionsState.onPlaceLabelsClicked { placeFeature, _ ->
            val callback = currentOnPoiClick.value ?: return@onPlaceLabelsClicked false
            val name = placeFeature.name ?: return@onPlaceLabelsClicked false
            val geometry = placeFeature.geometry

            Log.d(TAG, "Place tapped: \"$name\" at (${geometry.latitude()}, ${geometry.longitude()})")

            callback(
                MapPoiClickData(
                    name = name,
                    latitude = geometry.latitude(),
                    longitude = geometry.longitude(),
                )
            )
            true
        }
    }

    MapboxMap(
        modifier = modifier.fillMaxSize(),
        mapViewportState = mapViewportState,
        compass = {},
        scaleBar = {},
        logo = {},
        attribution = {},
        style = {
            MapboxStandardStyle(
                standardStyleState = standardStyleState,
            )
        },
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
