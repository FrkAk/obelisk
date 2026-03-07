@file:OptIn(ExperimentalFoundationApi::class)

package com.obelisk.app.ui.map

import android.Manifest
import android.content.pm.PackageManager
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.extension.compose.animation.viewport.rememberMapViewportState
import com.mapbox.maps.plugin.animation.MapAnimationOptions
import com.obelisk.app.ui.sheet.ObeliskSheet
import com.obelisk.app.ui.sheet.SheetGeometry
import com.obelisk.app.ui.sheet.SheetMode
import com.obelisk.app.ui.sheet.rememberSheetState
import com.obelisk.app.ui.sheet.sheetOffsets
import com.obelisk.app.viewmodel.LocationViewModel
import com.obelisk.app.viewmodel.MapViewModel

/** Munich center coordinates. */
private val MUNICH_CENTER = Point.fromLngLat(11.576124, 48.137154)
private const val DEFAULT_ZOOM = 14.0
private const val PITCH_3D = 45.0
private const val PITCH_FLAT = 0.0
private const val FLY_TO_USER_DURATION_MS = 1500L
private const val TOGGLE_3D_DURATION_MS = 800L
private const val LOCATE_DURATION_MS = 1200L
private const val COMPASS_RESET_DURATION_MS = 600L

private val LOCATION_PERMISSIONS = arrayOf(
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION,
)

/**
 * Root composable: full-screen map with overlaid controls.
 * Layers: map -> weather pill (top-left) -> controls (bottom-right) -> binoculars (bottom-left).
 * Wires MapViewModel for POI selection via native feature taps.
 */
@Composable
fun MapScreen() {
    val context = LocalContext.current
    val locationViewModel: LocationViewModel = hiltViewModel()
    val mapViewModel: MapViewModel = hiltViewModel()
    val location by locationViewModel.location.collectAsStateWithLifecycle()
    var permissionGranted by remember { mutableStateOf(false) }
    var is3D by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { permissions ->
        permissionGranted = permissions.values.any { it }
    }

    LaunchedEffect(Unit) {
        val alreadyGranted = LOCATION_PERMISSIONS.any { perm ->
            ContextCompat.checkSelfPermission(context, perm) == PackageManager.PERMISSION_GRANTED
        }
        if (alreadyGranted) {
            permissionGranted = true
        } else {
            permissionLauncher.launch(LOCATION_PERMISSIONS)
        }
    }

    val mapViewportState = rememberMapViewportState {
        setCameraOptions {
            center(MUNICH_CENTER)
            zoom(DEFAULT_ZOOM)
        }
    }

    // Fly to user location on first fix
    var hasFlownToUser by remember { mutableStateOf(false) }
    LaunchedEffect(location) {
        val loc = location ?: return@LaunchedEffect
        if (!hasFlownToUser) {
            hasFlownToUser = true
            mapViewportState.flyTo(
                cameraOptions = CameraOptions.Builder()
                    .center(Point.fromLngLat(loc.longitude, loc.latitude))
                    .zoom(DEFAULT_ZOOM)
                    .build(),
                animationOptions = MapAnimationOptions.mapAnimationOptions {
                    duration(FLY_TO_USER_DURATION_MS)
                },
            )
        }
    }

    val currentBearing by remember {
        derivedStateOf { mapViewportState.cameraState?.bearing ?: 0.0 }
    }

    val sheetState = rememberSheetState()
    val sheetMode by remember { mutableStateOf<SheetMode>(SheetMode.Idle) }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val screenHeightPx = constraints.maxHeight.toFloat()
        val screenWidthPx = constraints.maxWidth.toFloat()
        val density = LocalDensity.current

        val (miniOffset, _, largeOffset) = sheetOffsets(screenHeightPx)
        val sideMarginPx = screenWidthPx * SheetGeometry.SIDE_MARGIN

        val sheetOffset by remember {
            derivedStateOf { sheetState.offset.takeIf { !it.isNaN() } ?: miniOffset }
        }
        val sheetProgress by remember {
            derivedStateOf {
                ((miniOffset - sheetOffset) / (miniOffset - largeOffset)).coerceIn(0f, 1f)
            }
        }

        val controlsAlpha by remember {
            derivedStateOf { ((1f - sheetProgress) / 0.3f).coerceIn(0f, 1f) }
        }
        val controlsScale by remember {
            derivedStateOf {
                val t = ((sheetProgress - 0.7f).coerceIn(0f, 1f)) / 0.3f
                1f - 0.1f * t
            }
        }
        val controlsBottomDp by remember {
            derivedStateOf {
                val belowSheet = screenHeightPx - sheetOffset
                with(density) { (belowSheet + sideMarginPx).toDp() }
            }
        }
        val controlsSideMarginDp = with(density) { sideMarginPx.toDp() }

        ObeliskMap(
            mapViewportState = mapViewportState,
            showLocationPuck = permissionGranted,
            onPoiClick = { data ->
                mapViewModel.onPoiClicked(
                    name = data.name,
                    latitude = data.latitude,
                    longitude = data.longitude,
                    category = data.category,
                )
            },
        )

        // Weather pill — top-left
        WeatherPill(
            modifier = Modifier
                .align(Alignment.TopStart)
                .windowInsetsPadding(WindowInsets.statusBars)
                .padding(start = 16.dp, top = 16.dp),
        )

        // Map controls — bottom-right
        MapControls(
            is3D = is3D,
            bearing = currentBearing,
            on3DClick = {
                is3D = !is3D
                val pitch = if (is3D) PITCH_3D else PITCH_FLAT
                mapViewportState.flyTo(
                    cameraOptions = CameraOptions.Builder()
                        .pitch(pitch)
                        .build(),
                    animationOptions = MapAnimationOptions.mapAnimationOptions {
                        duration(TOGGLE_3D_DURATION_MS)
                    },
                )
            },
            onLayersClick = { },
            onLocateClick = {
                val loc = location ?: return@MapControls
                mapViewportState.flyTo(
                    cameraOptions = CameraOptions.Builder()
                        .center(Point.fromLngLat(loc.longitude, loc.latitude))
                        .zoom(DEFAULT_ZOOM)
                        .bearing(0.0)
                        .pitch(if (is3D) PITCH_3D else PITCH_FLAT)
                        .build(),
                    animationOptions = MapAnimationOptions.mapAnimationOptions {
                        duration(LOCATE_DURATION_MS)
                    },
                )
            },
            onCompassClick = {
                mapViewportState.flyTo(
                    cameraOptions = CameraOptions.Builder()
                        .bearing(0.0)
                        .build(),
                    animationOptions = MapAnimationOptions.mapAnimationOptions {
                        duration(COMPASS_RESET_DURATION_MS)
                    },
                )
            },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = controlsSideMarginDp, bottom = controlsBottomDp)
                .graphicsLayer {
                    alpha = controlsAlpha
                    scaleX = controlsScale
                    scaleY = controlsScale
                },
        )

        // Look Around — bottom-left
        LookAroundButton(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = controlsSideMarginDp, bottom = controlsBottomDp)
                .graphicsLayer {
                    alpha = controlsAlpha
                    scaleX = controlsScale
                    scaleY = controlsScale
                },
        )

        // Floating bottom sheet
        ObeliskSheet(
            state = sheetState,
            mode = sheetMode,
            modifier = Modifier.fillMaxSize(),
        )
    }
}
