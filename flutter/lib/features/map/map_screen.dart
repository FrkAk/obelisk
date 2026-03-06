import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/obelisk_theme.dart';

/// Main screen with full-screen map and overlays.
///
/// Currently renders a placeholder [Container] for the map.
/// Future milestones will add MapboxMap, controls, and the bottom sheet.
class MapScreen extends StatelessWidget {
  /// Creates the map screen.
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).extension<ObeliskTheme>()!;
    final brightness = Theme.of(context).brightness;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: brightness == Brightness.dark
          ? SystemUiOverlayStyle.light
          : SystemUiOverlayStyle.dark,
      child: Scaffold(
        extendBody: true,
        extendBodyBehindAppBar: true,
        body: Stack(children: [Container(color: theme.surface)]),
      ),
    );
  }
}
