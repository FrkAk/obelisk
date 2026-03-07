import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/location/location_provider.dart';
import '../../core/theme/glass.dart';
import '../../core/theme/obelisk_theme.dart';
import 'map_providers.dart';

/// Right-side FAB stack with 3D toggle, layers, and locate/compass buttons.
class MapControls extends ConsumerStatefulWidget {
  /// Creates the map controls column.
  const MapControls({super.key});

  @override
  ConsumerState<MapControls> createState() => _MapControlsState();
}

class _MapControlsState extends ConsumerState<MapControls> {
  bool _isLocating = false;

  @override
  Widget build(BuildContext context) {
    final is3D = ref.watch(is3DModeProvider);
    final locateMode = ref.watch(locateModeNotifierProvider);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _ControlButton(
          icon: is3D ? Icons.view_in_ar : Icons.view_in_ar_outlined,
          onTap: () => _toggle3D(),
        ),
        const SizedBox(height: ObeliskTheme.spaceSm),
        _ControlButton(icon: Icons.layers_outlined, onTap: () {}),
        const SizedBox(height: ObeliskTheme.spaceSm),
        _LocateButton(
          locateMode: locateMode,
          isLocating: _isLocating,
          onTap: () => _onLocateTap(locateMode),
        ),
      ],
    );
  }

  void _toggle3D() {
    final notifier = ref.read(is3DModeProvider.notifier);
    notifier.toggle();

    // When a viewport is active, it controls pitch — skip manual setPitch.
    final locateMode = ref.read(locateModeNotifierProvider);
    if (locateMode != LocateMode.idle) return;

    final controller = ref.read(mapControllerProvider);
    if (controller == null) return;
    final newPitch = ref.read(is3DModeProvider) ? 45.0 : 0.0;
    controller.setPitch(newPitch, durationMs: 600);
  }

  Future<void> _onLocateTap(LocateMode current) async {
    switch (current) {
      case LocateMode.idle:
        await _locateUser();
      case LocateMode.tracking:
        ref.read(locateModeNotifierProvider.notifier).set(LocateMode.compass);
      case LocateMode.compass:
        // Set idle first so viewport releases camera control,
        // then reset bearing to north.
        ref.read(locateModeNotifierProvider.notifier).set(LocateMode.idle);
        await Future<void>.delayed(const Duration(milliseconds: 50));
        final controller = ref.read(mapControllerProvider);
        await controller?.setBearing(0, durationMs: 500);
    }
  }

  /// Fetches GPS, flies to user location, then transitions to tracking mode.
  ///
  /// The viewport change is handled by [MapView] listening to
  /// [locateModeNotifierProvider].
  Future<void> _locateUser() async {
    final controller = ref.read(mapControllerProvider);
    if (controller == null) return;

    setState(() => _isLocating = true);
    try {
      ref.invalidate(geolocationProvider);
      final position = await ref.read(geolocationProvider.future);
      if (position == null || !mounted) return;

      await controller.flyTo(
        lng: position.longitude,
        lat: position.latitude,
        zoom: 16,
        bearing: 0,
        durationMs: 1000,
      );
      if (!mounted) return;

      ref.read(locateModeNotifierProvider.notifier).set(LocateMode.tracking);
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }
}

/// Three-state locate button: idle, tracking, compass.
///
/// Extracted as [ConsumerWidget] so only this widget rebuilds on bearing
/// changes — not the entire [MapControls] column.
class _LocateButton extends ConsumerWidget {
  const _LocateButton({
    required this.locateMode,
    required this.isLocating,
    required this.onTap,
  });

  final LocateMode locateMode;
  final bool isLocating;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context).extension<ObeliskTheme>()!;

    final Widget child;
    if (isLocating) {
      child = _PulseIcon(key: const ValueKey('pulse'), color: theme.foreground);
    } else {
      switch (locateMode) {
        case LocateMode.idle:
          child = Icon(
            Icons.my_location,
            key: const ValueKey('idle'),
            size: 20,
            color: theme.foreground,
          );
        case LocateMode.tracking:
          child = Icon(
            Icons.my_location,
            key: const ValueKey('tracking'),
            size: 20,
            color: theme.ctaBlue,
          );
        case LocateMode.compass:
          final bearing = ref.watch(mapBearingProvider);
          child = Transform.rotate(
            key: const ValueKey('compass'),
            angle: -bearing * math.pi / 180,
            child: Icon(Icons.explore, size: 20, color: theme.ctaBlue),
          );
      }
    }

    return Material(
      type: MaterialType.transparency,
      child: InkWell(
        onTap: isLocating ? null : onTap,
        customBorder: const CircleBorder(),
        child: GlassMaterial(
          variant: GlassVariant.floating,
          borderRadius: BorderRadius.circular(ObeliskTheme.radiusFull),
          child: SizedBox(
            width: 44,
            height: 44,
            child: Center(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Pulsing location icon shown while GPS position is being fetched.
class _PulseIcon extends StatefulWidget {
  /// Creates a pulsing icon with the given [color].
  const _PulseIcon({super.key, required this.color});

  final Color color;

  @override
  State<_PulseIcon> createState() => _PulseIconState();
}

class _PulseIconState extends State<_PulseIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final scale = 1.0 + _controller.value * 0.25;
        final opacity = 0.4 + _controller.value * 0.6;
        return Opacity(
          opacity: opacity,
          child: Transform.scale(scale: scale, child: child),
        );
      },
      child: Icon(Icons.my_location, size: 20, color: widget.color),
    );
  }
}

/// Glass-style circular icon button used for map control actions.
class _ControlButton extends StatelessWidget {
  /// Creates a control button with the given [icon] and [onTap] callback.
  const _ControlButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).extension<ObeliskTheme>()!;
    return Material(
      type: MaterialType.transparency,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: GlassMaterial(
          variant: GlassVariant.floating,
          borderRadius: BorderRadius.circular(ObeliskTheme.radiusFull),
          child: SizedBox(
            width: 44,
            height: 44,
            child: Icon(icon, size: 20, color: theme.foreground),
          ),
        ),
      ),
    );
  }
}
