import 'package:geolocator/geolocator.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'location_provider.g.dart';

/// Provides the user's current GPS position.
///
/// Checks location services and permissions, requesting when-in-use access
/// if not yet granted. Returns `null` if location is unavailable or denied.
@Riverpod(keepAlive: true)
Future<Position?> geolocation(GeolocationRef ref) async {
  final serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) return null;

  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return null;
    }
  }
  if (permission == LocationPermission.deniedForever) return null;

  return Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
}
