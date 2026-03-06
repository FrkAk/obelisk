import 'package:flutter/physics.dart';

/// Spring physics configurations matching design.md section 6.1.
///
/// All motion uses spring physics (no duration-based easing).
/// Use with [AnimationController.animateWith] via [createSimulation].
abstract final class ObeliskSprings {
  /// Buttons, quick feedback.
  static final snappy = SpringDescription(mass: 1, stiffness: 400, damping: 38);

  /// Content transitions, general movement.
  static final smooth = SpringDescription(mass: 1, stiffness: 200, damping: 30);

  /// Entries, reveals, fade-ins.
  static final gentle = SpringDescription(mass: 1, stiffness: 150, damping: 28);

  /// Sheet transitions, glass morphing.
  static final liquid = SpringDescription(
    mass: 1.1,
    stiffness: 180,
    damping: 28,
  );

  /// Micro-interactions, immediate response.
  static final quick = SpringDescription(mass: 1, stiffness: 500, damping: 40);

  /// Floating buttons entering view.
  static final floatingEntry = SpringDescription(
    mass: 0.8,
    stiffness: 250,
    damping: 32,
  );

  /// Tab content horizontal transitions.
  static final tabSwipe = SpringDescription(
    mass: 1,
    stiffness: 300,
    damping: 34,
  );

  /// Map pin drop (low damping = bounce).
  static final pinDrop = SpringDescription(
    mass: 1,
    stiffness: 300,
    damping: 20,
  );

  /// Creates a [SpringSimulation] from [spring] animating from [start] to [end].
  static SpringSimulation createSimulation(
    SpringDescription spring, {
    double start = 0,
    double end = 1,
    double velocity = 0,
  }) {
    return SpringSimulation(spring, start, end, velocity);
  }
}
