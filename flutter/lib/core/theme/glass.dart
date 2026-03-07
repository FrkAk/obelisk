import 'dart:ui';

import 'package:flutter/material.dart';

import 'obelisk_theme.dart';

/// Glass material variant controlling blur, background, and border.
enum GlassVariant {
  /// Standard cards (16px blur).
  glass,

  /// Subtle overlays (16px blur, thinner).
  thin,

  /// Dense panels, autocomplete (32px blur).
  thick,

  /// Bottom sheet surface (24px blur).
  liquid,

  /// FABs, action buttons, pills (16px blur).
  floating,
}

/// Translucent frosted-glass surface with backdrop blur and colored overlay.
///
/// Wraps [child] in a clipped, blurred container matching design.md glass materials.
/// All five variants include `saturate(150%)` equivalent via [ImageFilter.compose].
class GlassMaterial extends StatelessWidget {
  /// Creates a glass material surface.
  const GlassMaterial({
    super.key,
    required this.variant,
    required this.child,
    this.borderRadius,
  });

  /// Which glass variant to render.
  final GlassVariant variant;

  /// Content inside the glass surface.
  final Widget child;

  /// Override border radius. Defaults to [ObeliskTheme.radiusMd].
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).extension<ObeliskTheme>()!;
    final radius = borderRadius ?? BorderRadius.circular(ObeliskTheme.radiusMd);
    final (bg, blur) = _resolve(theme);

    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: bg,
              borderRadius: radius,
              border: Border.all(color: theme.glassBorder),
            ),
            child: child,
          ),
        ),
      ),
    );
  }

  /// Resolves background color and blur sigma for the current [variant].
  (Color bg, double blur) _resolve(ObeliskTheme theme) {
    return switch (variant) {
      GlassVariant.glass => (theme.glassBg, 16),
      GlassVariant.thin => (theme.glassBgThin, 16),
      GlassVariant.thick => (theme.glassBgThick, 32),
      GlassVariant.liquid => (theme.glassBgSheet, 24),
      GlassVariant.floating => (theme.glassBgFloating, 16),
    };
  }
}
