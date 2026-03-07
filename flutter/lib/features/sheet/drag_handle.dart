import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/theme/obelisk_theme.dart';
import '../../ui/animations.dart';

/// Animated drag handle with two gradient bars and a chevron hint.
///
/// The chevron hint rotates bars ±12° for 800ms on [playChevronHint],
/// then springs back to rest. Call via [DragHandleState] using a [GlobalKey].
class DragHandle extends StatefulWidget {
  /// Creates a drag handle.
  const DragHandle({super.key, this.onTap});

  /// Called when the handle area is tapped.
  final VoidCallback? onTap;

  @override
  State<DragHandle> createState() => DragHandleState();
}

/// State for [DragHandle], exposing [playChevronHint].
class DragHandleState extends State<DragHandle>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  static const _chevronAngle = 12.0 * math.pi / 180;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController.unbounded(vsync: this);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Plays the chevron hint animation: bars rotate ±12° then spring back.
  void playChevronHint() {
    _controller.value = 0;
    _controller.animateWith(
      ObeliskSprings.createSimulation(ObeliskSprings.gentle, start: 0, end: 1),
    );
    Future.delayed(const Duration(milliseconds: 400), () {
      if (!mounted) return;
      _controller.animateWith(
        ObeliskSprings.createSimulation(
          ObeliskSprings.gentle,
          start: _controller.value,
          end: 0,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: widget.onTap,
      child: SizedBox(
        height: ObeliskTheme.space3xl,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.only(top: 10),
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                final angle = _controller.value * _chevronAngle;
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Transform.rotate(angle: angle, child: _bar(0.4)),
                    const SizedBox(height: 1),
                    Transform.rotate(angle: -angle, child: _bar(0.3)),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _bar(double opacity) {
    return Container(
      width: 16,
      height: 3,
      decoration: BoxDecoration(
        color: Color.fromRGBO(120, 120, 128, opacity),
        borderRadius: BorderRadius.circular(1.5),
      ),
    );
  }
}
