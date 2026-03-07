import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/obelisk_theme.dart';
import '../sheet/obelisk_sheet.dart';
import 'map_controls.dart';
import 'map_view.dart';

/// Main screen with full-screen map, bottom sheet overlay, and controls.
///
/// Renders [MapView] behind a [Stack] of [ObeliskSheet] and [MapControls].
class MapScreen extends ConsumerStatefulWidget {
  /// Creates the map screen.
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  double _sheetExtent = 0.12;

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final screenHeight = MediaQuery.of(context).size.height;
    final sheetMiniHeight = screenHeight * 0.12;
    final overlayOpacity = _overlayOpacityForExtent(_sheetExtent);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        extendBody: true,
        extendBodyBehindAppBar: true,
        body: Stack(
          children: [
            const MapView(),
            if (overlayOpacity > 0)
              Positioned.fill(
                child: IgnorePointer(
                  child: ColoredBox(
                    color: Colors.black.withValues(alpha: overlayOpacity),
                  ),
                ),
              ),
            ObeliskSheet(
              onExtentChanged: (extent) {
                setState(() => _sheetExtent = extent);
              },
            ),
            Positioned(
              right: ObeliskTheme.spaceLg,
              bottom: bottomPadding + sheetMiniHeight + ObeliskTheme.spaceLg,
              child: const MapControls(),
            ),
          ],
        ),
      ),
    );
  }

  /// Overlay opacity: 0 below 35%, then lerp to 0.08 at 85%.
  double _overlayOpacityForExtent(double extent) {
    if (extent <= 0.35) return 0;
    final t = ((extent - 0.35) / (0.85 - 0.35)).clamp(0.0, 1.0);
    return t * 0.08;
  }
}
