/// Renderer-agnostic camera controller interface.
///
/// App logic (controls, providers) depends on this abstraction.
/// Only the concrete renderer implementation (e.g. Mapbox) imports
/// the underlying SDK.
abstract class MapCameraController {
  /// Flies the camera to a geographic position.
  Future<void> flyTo({
    double? lng,
    double? lat,
    double? zoom,
    double? bearing,
    double? pitch,
    int durationMs = 500,
  });

  /// Sets the camera bearing (rotation) in degrees.
  Future<void> setBearing(double bearing, {int durationMs = 500});

  /// Sets the camera pitch (tilt) in degrees.
  Future<void> setPitch(double pitch, {int durationMs = 500});

  /// Returns the current camera state bearing in degrees.
  Future<double> getCameraBearing();
}
