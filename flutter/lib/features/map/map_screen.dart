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
  double _sheetExtent = ObeliskSheet.snapMini;

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final screenH = mq.size.height;
    final safe = mq.padding;
    final sheetMiniHeight =
        screenH * ObeliskSheet.snapMini + safe.bottom + screenH * 0.035;
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
            Positioned(
              right: ObeliskTheme.spaceLg + safe.right,
              bottom: sheetMiniHeight + ObeliskTheme.spaceLg,
              child: const MapControls(),
            ),
            ObeliskSheet(
              onExtentChanged: (extent) {
                final oldOpacity = _overlayOpacityForExtent(_sheetExtent);
                final newOpacity = _overlayOpacityForExtent(extent);
                _sheetExtent = extent;
                if ((oldOpacity - newOpacity).abs() > 0.005) {
                  setState(() {});
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  /// Returns overlay opacity based on sheet extent.
  double _overlayOpacityForExtent(double extent) {
    if (extent <= ObeliskSheet.snapHalf) return 0;
    final t =
        ((extent - ObeliskSheet.snapHalf) /
                (ObeliskSheet.snapFull - ObeliskSheet.snapHalf))
            .clamp(0.0, 1.0);
    return 0.04 + t * 0.04;
  }
}
