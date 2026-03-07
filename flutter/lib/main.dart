import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import 'app.dart';

/// Mapbox access token injected at build time via `--dart-define=MAPBOX_TOKEN=xxx`.
const _mapboxToken = String.fromEnvironment('MAPBOX_TOKEN');

/// Application entry point.
void main() {
  if (_mapboxToken.isEmpty) {
    throw StateError(
      'MAPBOX_TOKEN is not set. '
      'Pass it at build time: flutter run --dart-define=MAPBOX_TOKEN=<your_token>',
    );
  }
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  MapboxOptions.setAccessToken(_mapboxToken);
  runApp(const ProviderScope(child: ObeliskApp()));
}
