import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/obelisk_theme.dart';

/// Animated placeholder that cycles through suggestion strings with a cross-fade.
///
/// Pauses cycling when [active] is false (search bar focused or has text).
class RotatingPlaceholder extends StatefulWidget {
  /// Creates a [RotatingPlaceholder].
  const RotatingPlaceholder({super.key, this.active = true});

  /// Whether the placeholder is actively rotating.
  final bool active;

  @override
  State<RotatingPlaceholder> createState() => _RotatingPlaceholderState();
}

class _RotatingPlaceholderState extends State<RotatingPlaceholder> {
  static const _hints = [
    'Best coffee near me',
    'Hidden courtyards',
    'Beer gardens with a view',
    'Art Nouveau buildings',
    'Local bakeries',
  ];

  int _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (widget.active) _startTimer();
  }

  @override
  void didUpdateWidget(RotatingPlaceholder oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.active && !oldWidget.active) {
      _startTimer();
    } else if (!widget.active && oldWidget.active) {
      _timer?.cancel();
      _timer = null;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % _hints.length);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).extension<ObeliskTheme>()!;
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: Text(
        _hints[_index],
        key: ValueKey(_index),
        style: theme.uiBody.copyWith(color: theme.foregroundTertiary),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}
