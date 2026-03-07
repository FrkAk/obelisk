import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/glass.dart';
import '../../core/theme/obelisk_theme.dart';
import 'drag_handle.dart';
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

  @override
  ConsumerState<ObeliskSheet> createState() => _ObeliskSheetState();
}

class _ObeliskSheetState extends ConsumerState<ObeliskSheet> {
  final _sheetController = DraggableScrollableController();
  final _handleKey = GlobalKey<DragHandleState>();

  double _extent = 0.12;

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
    if (extent != _extent) {
      setState(() => _extent = extent);
      widget.onExtentChanged?.call(extent);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mode = ref.watch(sheetModeNotifierProvider);

    ref.listen(sheetModeNotifierProvider, (prev, next) {
      if (prev == next) return;
      _animateToDefaultSnap(next);
      _handleKey.currentState?.playChevronHint();
    });

    final snaps = _snapsForMode(mode);
    final initialSnap = _initialSnapForMode(mode);

    final t = ((_extent - 0.12) / (0.85 - 0.12)).clamp(0.0, 1.0);
    final cornerRadius = lerpDouble(
      ObeliskTheme.radius3xl,
      ObeliskTheme.radiusMd,
      t,
    )!;
    final bottomGap = lerpDouble(12, 0, t)!;
    final shadow = _shadowForExtent(context, _extent);

    return DraggableScrollableSheet(
      controller: _sheetController,
      initialChildSize: initialSnap,
      minChildSize: snaps.first,
      maxChildSize: snaps.last,
      snap: true,
      snapSizes: snaps,
      builder: (context, scrollController) {
        return Padding(
          padding: EdgeInsets.only(bottom: bottomGap),
          child: DecoratedBox(
            decoration: BoxDecoration(
              boxShadow: shadow,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(cornerRadius),
              ),
            ),
            child: GlassMaterial(
              variant: GlassVariant.liquid,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(cornerRadius),
              ),
              child: CustomScrollView(
                controller: scrollController,
                slivers: [
                  SliverToBoxAdapter(
                    child: DragHandle(key: _handleKey, onTap: _cycleSnap),
                  ),
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

  List<double> _snapsForMode(SheetMode mode) {
    return switch (mode) {
      SheetMode.search => const [0.12, 0.55, 0.85],
      SheetMode.results => const [0.55, 0.85],
      SheetMode.poi => const [0.35, 0.55, 0.85],
    };
  }

  double _initialSnapForMode(SheetMode mode) {
    return switch (mode) {
      SheetMode.search => 0.12,
      SheetMode.results => 0.55,
      SheetMode.poi => 0.35,
    };
  }

  void _animateToDefaultSnap(SheetMode mode) {
    if (!_sheetController.isAttached) return;
    final target = _initialSnapForMode(mode);
    _sheetController.animateTo(
      target,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    );
  }

  void _cycleSnap() {
    if (!_sheetController.isAttached) return;
    final mode = ref.read(sheetModeNotifierProvider);
    final snaps = _snapsForMode(mode);
    final current = _sheetController.size;

    double? nextSnap;
    for (final snap in snaps) {
      if (snap > current + 0.02) {
        nextSnap = snap;
        break;
      }
    }
    nextSnap ??= snaps.first;

    _sheetController.animateTo(
      nextSnap,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
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
