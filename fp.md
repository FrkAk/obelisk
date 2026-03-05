I'm building a Flutter app for the Obelisk project — a contextual discovery platform for Munich. The Next.js backend already exists and stays as an API server. The Flutter app replaces the React frontend.

Read these files first (in this order):
1. `CLAUDE.md` — global coding rules
2. `design.md` — visual design tokens (colors, typography, spacing, shadows, glass materials)
3. `flutter.md` — Flutter project plan, conventions, task breakdown
4. `ui-ux.md` — detailed UI/UX specs for every component

Then implement **V0.1 — Project Scaffold + Theme** (all 12 tasks from `flutter.md`):

1. Create Flutter project in the repo root as `flutter/` directory (`flutter create --org com.obeliskark --project-name obelisk_app flutter`)
2. Add all dependencies to pubspec.yaml (riverpod, dio, freezed, mapbox_maps_flutter, go_router, url_launcher, share_plus, geolocator, flutter_markdown, shared_preferences + dev deps)
3. Download font files: Instrument Serif, Sora, Source Serif 4 from Google Fonts — place in `flutter/assets/fonts/`
4. Configure font declarations in pubspec.yaml
5. Create `ObeliskTheme` ThemeExtension with ALL tokens from design.md (colors light+dark, glass materials, shadows, typography TextStyles, spacing, radii, category colors)
6. Create color constants file (light + dark palettes)
7. Create typography definitions (all TextStyles using the 3 font families)
8. Create `GlassMaterial` widget (ClipRRect + BackdropFilter + colored overlay — 5 variants: glass, glass-thin, glass-thick, glass-liquid, glass-floating)
9. Create spring animation configs in `ui/animations.dart` (all 8 springs from design.md)
10. Create `main.dart` with ProviderScope + MaterialApp.router + theme setup (dark/light auto-detect)
11. Create empty `MapScreen` scaffold (just a Stack with a colored Container placeholder for the map)
12. Verify: `flutter analyze` passes with zero issues, `dart format .` clean

Follow the conventions in `flutter.md` strictly — Dart native `///` doc comments, no dynamic types, const constructors, snake_case files, PascalCase widgets. Every public class/method gets a docstring.

After completing all tasks, update each task status in `flutter.md` from `[TODO]` to `[DONE]`.
