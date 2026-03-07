import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../core/map/map_camera_controller.dart';

part 'map_providers.g.dart';

/// Location button state: idle → tracking → compass → idle.
enum LocateMode { idle, tracking, compass }

/// Holds the renderer-agnostic camera controller instance.
@Riverpod(keepAlive: true)
class MapController extends _$MapController {
  @override
  MapCameraController? build() => null;

  /// Stores the controller provided by the map renderer on creation.
  void set(MapCameraController controller) => state = controller;
}

/// Tracks whether the map is in 3D (pitched) mode.
@Riverpod(keepAlive: true)
class Is3DMode extends _$Is3DMode {
  @override
  bool build() => false;

  /// Toggles between flat (0°) and 3D (45°) pitch.
  void toggle() => state = !state;
}

/// Tracks the current map camera bearing in degrees.
@Riverpod(keepAlive: true)
class MapBearing extends _$MapBearing {
  @override
  double build() => 0.0;

  /// Updates the bearing from the camera change listener.
  void update(double bearing) => state = bearing;
}

/// Tracks the locate button state machine.
@Riverpod(keepAlive: true)
class LocateModeNotifier extends _$LocateModeNotifier {
  @override
  LocateMode build() => LocateMode.idle;

  /// Sets the locate mode.
  void set(LocateMode mode) => state = mode;
}
