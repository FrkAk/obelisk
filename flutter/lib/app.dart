import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/theme/obelisk_theme.dart';
import 'features/map/map_screen.dart';

/// Root application widget with theme and routing.
///
/// Uses [GoRouter] for declarative navigation and [ObeliskTheme]
/// for light/dark mode with auto-detection from platform brightness.
class ObeliskApp extends StatelessWidget {
  /// Creates the root app widget.
  const ObeliskApp({super.key});

  static final _router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (context, state) => const MapScreen()),
    ],
  );

  @override
  Widget build(BuildContext context) {
    final lightTheme = ObeliskTheme.light();
    final darkTheme = ObeliskTheme.dark();

    return MaterialApp.router(
      title: 'Obelisk',
      debugShowCheckedModeBanner: false,
      routerConfig: _router,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: lightTheme.background,
        colorScheme: ColorScheme.light(
          primary: lightTheme.accent,
          surface: lightTheme.surface,
          error: lightTheme.errorColor,
        ),
        extensions: [lightTheme],
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: darkTheme.background,
        colorScheme: ColorScheme.dark(
          primary: darkTheme.accent,
          surface: darkTheme.surface,
          error: darkTheme.errorColor,
        ),
        extensions: [darkTheme],
      ),
      themeMode: ThemeMode.system,
    );
  }
}
