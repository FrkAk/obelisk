import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/glass.dart';
import '../../core/theme/obelisk_theme.dart';
import 'sheet_providers.dart';

/// Always-visible bottom sheet with snap points, progressive visuals, and mode transitions.
///
/// Uses [DraggableScrollableSheet] with snap physics. Visual properties
/// (corner radius, bottom gap, shadow) morph progressively based on extent.
class ObeliskSheet extends ConsumerStatefulWidget {
  /// Creates the bottom sheet.
  const ObeliskSheet({super.key, this.onExtentChanged});

  /// Called when the sheet extent changes (0.0–1.0).
  final ValueChanged<double>? onExtentChanged;

  /// Mini snap — search default, tall enough for a search bar.
  static const snapMini = 0.12;

  /// Peek snap — POI detail default.
  static const snapPeek = 0.35;

  /// Half snap — results default, mid position.
  static const snapHalf = 0.55;

  /// Full snap — highest position.
  static const snapFull = 0.85;

  @override
  ConsumerState<ObeliskSheet> createState() => _ObeliskSheetState();
}

/// Manages drag state, snap transitions, and progressive visual morphing.
///
/// All margins are derived from screen dimensions and safe area insets so the
/// sheet floats clear of every edge on any device. The radius is uniform on
/// all four corners and shrinks together as the sheet expands.
class _ObeliskSheetState extends ConsumerState<ObeliskSheet> {
  /// Horizontal margin as fraction of screen width (mini → full).
  static const _marginFractionMax = 0.035;
  static const _marginFractionMin = 0.015;

  final _sheetController = DraggableScrollableController();

  double _extent = ObeliskSheet.snapMini;

  @override
  void initState() {
    super.initState();
    _sheetController.addListener(_onSheetDrag);
  }

  @override
  void dispose() {
    _sheetController.removeListener(_onSheetDrag);
    _sheetController.dispose();
    super.dispose();
  }

  void _onSheetDrag() {
    if (!_sheetController.isAttached) return;
    final extent = _sheetController.size;
    if (extent == _extent) return;
    _extent = extent;
    widget.onExtentChanged?.call(extent);
  }

  @override
  Widget build(BuildContext context) {
    final mode = ref.watch(sheetModeNotifierProvider);
    final mq = MediaQuery.of(context);
    final screenW = mq.size.width;
    final screenH = mq.size.height;
    final safe = mq.padding;

    ref.listen(sheetModeNotifierProvider, (prev, next) {
      if (prev == next) return;
      _onModeChanged(next);
    });

    final snaps = _snapsForMode(mode);

    return DraggableScrollableSheet(
      controller: _sheetController,
      initialChildSize: _initialSnapForMode(mode),
      minChildSize: snaps.first,
      maxChildSize: snaps.last,
      snap: true,
      snapSizes: snaps,
      builder: (context, scrollController) {
        final extent = _extent;
        final t =
            ((extent - ObeliskSheet.snapMini) /
                    (ObeliskSheet.snapFull - ObeliskSheet.snapMini))
                .clamp(0.0, 1.0);

        final radius = (lerpDouble(
          ObeliskTheme.radius3xl,
          ObeliskTheme.radiusMd,
          t,
        )!).roundToDouble();

        final marginT = Curves.easeInCubic.transform(t);
        final hMargin =
            lerpDouble(
              screenW * _marginFractionMax,
              screenW * _marginFractionMin,
              marginT,
            )! +
            safe.left;
        final bMargin =
            lerpDouble(
              screenH * _marginFractionMax,
              screenH * _marginFractionMin,
              marginT,
            )! +
            safe.bottom;

        final shadow = _shadowForExtent(context, extent);
        final br = BorderRadius.circular(radius);

        return Padding(
          padding: EdgeInsets.only(
            left: hMargin,
            right: hMargin,
            bottom: bMargin,
          ),
          child: DecoratedBox(
            decoration: BoxDecoration(boxShadow: shadow, borderRadius: br),
            child: GlassMaterial(
              variant: GlassVariant.liquid,
              borderRadius: br,
              child: CustomScrollView(
                controller: scrollController,
                slivers: [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 150),
                      child: _placeholderForMode(mode),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Animates to the new mode's default snap after the widget tree rebuilds
  /// with updated snap sizes — avoids animating below the old [minChildSize].
  void _onModeChanged(SheetMode mode) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_sheetController.isAttached) return;
      _sheetController.animateTo(
        _initialSnapForMode(mode),
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    });
  }

  List<double> _snapsForMode(SheetMode mode) {
    return switch (mode) {
      SheetMode.search => const [
        ObeliskSheet.snapMini,
        ObeliskSheet.snapHalf,
        ObeliskSheet.snapFull,
      ],
      SheetMode.results => const [ObeliskSheet.snapHalf, ObeliskSheet.snapFull],
      SheetMode.poi => const [
        ObeliskSheet.snapPeek,
        ObeliskSheet.snapHalf,
        ObeliskSheet.snapFull,
      ],
    };
  }

  double _initialSnapForMode(SheetMode mode) {
    return switch (mode) {
      SheetMode.search => ObeliskSheet.snapMini,
      SheetMode.results => ObeliskSheet.snapHalf,
      SheetMode.poi => ObeliskSheet.snapPeek,
    };
  }

  List<BoxShadow> _shadowForExtent(BuildContext context, double extent) {
    final theme = Theme.of(context).extension<ObeliskTheme>()!;
    if (extent >= 0.70) return theme.shadowLg;
    if (extent >= 0.45) return theme.shadowMd;
    return theme.shadowSm;
  }

  Widget _placeholderForMode(SheetMode mode) {
    return Padding(
      key: ValueKey(mode),
      padding: const EdgeInsets.symmetric(
        horizontal: ObeliskTheme.space2xl,
        vertical: ObeliskTheme.spaceLg,
      ),
      child: Text(switch (mode) {
        SheetMode.search => 'Search placeholder',
        SheetMode.results => 'Results placeholder',
        SheetMode.poi => 'POI detail placeholder',
      }, style: Theme.of(context).extension<ObeliskTheme>()!.uiBody),
    );
  }
}
