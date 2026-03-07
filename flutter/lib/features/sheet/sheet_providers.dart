import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'sheet_providers.g.dart';

/// Controls which content the bottom sheet displays.
enum SheetMode {
  /// Default: search bar with rotating placeholder.
  search,

  /// Search results list after query completes.
  results,

  /// POI detail card with header, actions, tabs.
  poi,
}

/// Tracks the current bottom sheet mode.
@Riverpod(keepAlive: true)
class SheetModeNotifier extends _$SheetModeNotifier {
  @override
  SheetMode build() => SheetMode.search;

  /// Sets the sheet mode.
  void set(SheetMode mode) => state = mode;
}
