import 'dart:math';

/// Earth's mean radius in meters.
const _earthRadius = 6371000.0;

/// Calculates the great-circle distance in meters between two points.
///
/// Coordinates [lat1], [lon1], [lat2], [lon2] are in decimal degrees.
double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
  final dLat = _toRadians(lat2 - lat1);
  final dLon = _toRadians(lon2 - lon1);

  final a =
      sin(dLat / 2) * sin(dLat / 2) +
      cos(_toRadians(lat1)) *
          cos(_toRadians(lat2)) *
          sin(dLon / 2) *
          sin(dLon / 2);

  return _earthRadius * 2 * atan2(sqrt(a), sqrt(1 - a));
}

/// Formats [meters] as a human-readable string ("< 50 m", "350 m", or "1.2 km").
String formatDistance(double meters) {
  if (meters < 50) return '< 50 m';
  if (meters < 1000) return '${meters.round()} m';
  return '${(meters / 1000).toStringAsFixed(1)} km';
}

double _toRadians(double degrees) => degrees * pi / 180;
