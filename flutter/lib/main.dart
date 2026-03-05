import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';

/// Application entry point.
void main() {
  runApp(const ProviderScope(child: ObeliskApp()));
}
