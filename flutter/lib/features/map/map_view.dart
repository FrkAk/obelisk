import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import '../../core/map/map_camera_controller.dart';
import 'map_providers.dart';

/// Mapbox implementation of [MapCameraController].
///
/// Wraps [MapboxMap] and provides camera control through the
/// renderer-agnostic interface.
class _MapboxCameraController implements MapCameraController {
  /// Creates a controller bound to the given [MapboxMap] instance.
  _MapboxCameraController(this._map);

  final MapboxMap _map;

  @override
  Future<void> flyTo({
    double? lng,
    double? lat,
    double? zoom,
    double? bearing,
    double? pitch,
    int durationMs = 500,
  }) async {
    final center = (lng != null && lat != null)
        ? Point(coordinates: Position(lng, lat))
        : null;
    await _map.flyTo(
      CameraOptions(center: center, zoom: zoom, bearing: bearing, pitch: pitch),
      MapAnimationOptions(duration: durationMs),
    );
  }

  @override
  Future<void> setBearing(double bearing, {int durationMs = 500}) async {
    await _map.flyTo(
      CameraOptions(bearing: bearing),
      MapAnimationOptions(duration: durationMs),
    );
  }

  @override
  Future<void> setPitch(double pitch, {int durationMs = 500}) async {
    await _map.flyTo(
      CameraOptions(pitch: pitch),
      MapAnimationOptions(duration: durationMs),
    );
  }

  @override
  Future<double> getCameraBearing() async {
    final state = await _map.getCameraState();
    return state.bearing;
  }

  /// Returns `true` when a user touch gesture is in progress.
  Future<bool> isGestureInProgress() => _map.isGestureInProgress();

  /// Updates location puck display settings.
  Future<void> updateLocationSettings(LocationComponentSettings settings) =>
      _map.location.updateSettings(settings);
}

/// Full-screen Mapbox map widget centered on Munich.
///
/// Registers a [MapCameraController] in [mapControllerProvider] on creation
/// and enables the built-in location puck for user position display.
/// Uses the Mapbox viewport API for tracking/compass modes.
class MapView extends ConsumerStatefulWidget {
  /// Creates the map view.
  const MapView({super.key});

  @override
  ConsumerState<MapView> createState() => _MapViewState();
}

class _MapViewState extends ConsumerState<MapView> {
  static const _styleUri = 'mapbox://styles/amldftr/cmdk9k6to008401r2d61l4cck';
  static const _munichLng = 11.5820;
  static const _munichLat = 48.1351;
  static const _defaultZoom = 14.0;

  _MapboxCameraController? _controller;
  bool _cameraUpdatePending = false;
  ViewportState _viewport = const IdleViewportState();

  @override
  Widget build(BuildContext context) {
    ref.listen(
      locateModeNotifierProvider,
      (_, mode) => _onLocateModeChanged(mode),
    );
    ref.listen(is3DModeProvider, (_, is3D) => _onIs3DChanged(is3D));

    return MapWidget(
      cameraOptions: CameraOptions(
        center: Point(coordinates: Position(_munichLng, _munichLat)),
        zoom: _defaultZoom,
      ),
      styleUri: _styleUri,
      viewport: _viewport,
      onMapCreated: _onMapCreated,
      onCameraChangeListener: _onCameraChanged,
    );
  }

  void _onMapCreated(MapboxMap map) {
    final controller = _MapboxCameraController(map);
    _controller = controller;
    ref.read(mapControllerProvider.notifier).set(controller);
    map.location.updateSettings(
      LocationComponentSettings(
        enabled: true,
        pulsingEnabled: true,
        puckBearingEnabled: true,
        showAccuracyRing: true,
        accuracyRingColor: 0x295AC8FA,
        accuracyRingBorderColor: 0x555AC8FA,
      ),
    );
    map.compass.updateSettings(CompassSettings(enabled: false));
    map.scaleBar.updateSettings(ScaleBarSettings(enabled: false));
  }

  void _onCameraChanged(CameraChangedEventData data) {
    if (_cameraUpdatePending) return;
    _cameraUpdatePending = true;

    Future.delayed(const Duration(milliseconds: 100), () async {
      _cameraUpdatePending = false;
      final controller = _controller;
      if (controller == null || !mounted) return;
      try {
        final bearing = await controller.getCameraBearing();
        if (!mounted) return;
        ref.read(mapBearingProvider.notifier).update(bearing);

        // Break tracking/compass when user pans or rotates the map.
        final locateMode = ref.read(locateModeNotifierProvider);
        if (locateMode != LocateMode.idle) {
          final isGesture = await controller.isGestureInProgress();
          if (isGesture && mounted) {
            ref.read(locateModeNotifierProvider.notifier).set(LocateMode.idle);
          }
        }
      } on Exception {
        // Map may be disposed during the async gap — safe to ignore.
      }
    });
  }

  void _onLocateModeChanged(LocateMode mode) {
    final is3D = ref.read(is3DModeProvider);
    _applyViewport(mode, is3D);
    _updatePuckBearing(mode);
  }

  void _onIs3DChanged(bool is3D) {
    final mode = ref.read(locateModeNotifierProvider);
    if (mode == LocateMode.idle) {
      // Pitch change handled by controls via setPitch.
      return;
    }
    // Update the viewport with new pitch while keeping the follow mode.
    _applyViewport(mode, is3D);
  }

  void _applyViewport(LocateMode mode, bool is3D) {
    final pitch = is3D ? 45.0 : 0.0;

    setState(() {
      switch (mode) {
        case LocateMode.idle:
          _viewport = const IdleViewportState();
        case LocateMode.tracking:
          _viewport = FollowPuckViewportState(
            zoom: 16.0,
            bearing: const FollowPuckViewportStateBearingConstant(0),
            pitch: pitch,
          );
        case LocateMode.compass:
          _viewport = FollowPuckViewportState(
            zoom: 16.0,
            bearing: const FollowPuckViewportStateBearingHeading(),
            pitch: pitch,
          );
      }
    });
  }

  Future<void> _updatePuckBearing(LocateMode mode) async {
    final controller = _controller;
    if (controller == null) return;

    if (mode == LocateMode.compass) {
      await controller.updateLocationSettings(
        LocationComponentSettings(
          puckBearingEnabled: true,
          puckBearing: PuckBearing.HEADING,
        ),
      );
    } else {
      await controller.updateLocationSettings(
        LocationComponentSettings(puckBearing: PuckBearing.COURSE),
      );
    }
  }
}
