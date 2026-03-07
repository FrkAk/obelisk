# Obelisk Flutter Implementation Plan

## Overview

Replace the Next.js React frontend with Flutter (iOS + Android + Web). The Next.js backend stays as an API-only server. This document breaks the work into versioned milestones with granular tasks.

**Reference docs**:
- `design.md` — Visual design tokens and component specs
- `ui-ux.md` — Detailed UI/UX behavior, interactions, animations, state architecture

---

## Tech Stack

| Layer | Package | Version | Purpose |
|-------|---------|---------|---------|
| Framework | Flutter | 3.x stable | Cross-platform UI |
| State | flutter_riverpod + riverpod_annotation | ^2.0 | Reactive state, code generation |
| HTTP | dio | ^5.0 | API client with interceptors |
| Serialization | freezed + json_serializable | latest | Immutable models, JSON mapping |
| Map | mapbox_maps_flutter | ^2.0 | Mapbox GL Native |
| Routing | go_router | ^14.0 | Declarative URL-based routing |
| URL launching | url_launcher | ^6.0 | tel:, https:, maps: links |
| Sharing | share_plus | ^9.0 | Native share sheet |
| Location | geolocator | ^12.0 | GPS with permission handling |
| Markdown | flutter_markdown | ^0.7 | Safe markdown rendering |
| Storage | shared_preferences | ^2.0 | Persisted settings |
| Animations | (built-in) | — | SpringSimulation, AnimationController |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| build_runner | Code generation (freezed, riverpod) |
| freezed_annotation | Model annotations |
| json_annotation | JSON serialization annotations |
| riverpod_generator | Provider code generation |
| flutter_lints | Lint rules |

---

## Project Structure

```
lib/
├── main.dart                    # App entry, ProviderScope, MaterialApp
├── app.dart                     # MaterialApp.router + theme setup
├── core/
│   ├── api/
│   │   ├── api_client.dart      # Dio instance, base config, interceptors
│   │   ├── api_errors.dart      # Typed error classes (sealed class)
│   │   ├── endpoints.dart       # All endpoint methods
│   │   └── models/              # Freezed API response models
│   │       ├── poi.dart         # ExternalPOI, PoiImage, PoiProfile
│   │       ├── remark.dart      # Remark, RemarkWithPoi
│   │       ├── search.dart      # SearchResult, ParsedIntent
│   │       └── category.dart    # Category, CategorySlug
│   ├── theme/
│   │   ├── obelisk_theme.dart   # ThemeExtension with all tokens
│   │   ├── colors.dart          # Color constants (light/dark)
│   │   ├── typography.dart      # TextStyle definitions
│   │   └── glass.dart           # Glass material widget + styles
│   ├── location/
│   │   ├── location_provider.dart  # Riverpod geolocation provider
│   │   └── geofence.dart           # Geofence trigger logic
│   └── utils/
│       ├── distance.dart        # Haversine, formatDistance
│       └── url_validator.dart   # isValidHttpUrl
├── ui/
│   ├── animations.dart          # Spring configs, ObeliskSprings
│   ├── glass_card.dart          # GlassCard widget (ClipRRect + BackdropFilter)
│   ├── glass_button.dart        # GlassButton widget
│   ├── glass_pill.dart          # GlassPill widget
│   └── icons.dart               # Custom icon data (obelisk silhouette, etc.)
├── features/
│   ├── map/
│   │   ├── map_screen.dart      # Main screen: Stack(map, controls, sheet)
│   │   ├── map_view.dart        # MapboxMap widget wrapper
│   │   ├── map_controls.dart    # Right-side FAB stack
│   │   ├── map_providers.dart   # Viewport, pitch providers
│   │   └── markers/
│   │       ├── poi_pin.dart
│   │       ├── user_location_marker.dart
│   │       └── search_pin.dart
│   ├── sheet/
│   │   ├── obelisk_sheet.dart   # Always-visible DraggableScrollableSheet
│   │   ├── sheet_providers.dart # SheetMode, snap state providers
│   │   └── drag_handle.dart     # Animated drag handle with chevron hint
│   ├── search/
│   │   ├── search_bar.dart      # Search input with rotating placeholder
│   │   ├── search_results.dart  # Results list widget
│   │   ├── autocomplete_list.dart
│   │   ├── search_providers.dart # Query, results, autocomplete providers
│   │   └── rotating_placeholder.dart
│   ├── poi/
│   │   ├── poi_card.dart        # Main POI card (orchestrates all sections)
│   │   ├── poi_header.dart      # Centered name/category header
│   │   ├── action_buttons.dart  # Navigate/Call/Website row
│   │   ├── info_metrics.dart    # Distance/Category/Amenity row
│   │   ├── media_carousel.dart  # Photo carousel + street view
│   │   ├── tab_bar.dart         # Remark/Capsules/Details tabs
│   │   ├── remark_tab.dart      # About section with markdown
│   │   ├── capsules_tab.dart    # Community capsules
│   │   ├── details_tab.dart     # Contact info, amenities
│   │   ├── bottom_toolbar.dart  # Add/Favorite/More buttons
│   │   └── poi_providers.dart   # Selected POI, remark generation state
│   ├── remark/
│   │   ├── remark_notification.dart  # Geofence toast
│   │   └── loading_state.dart        # Branded loading animation
│   └── error/
│       └── error_toast.dart     # Auto-dismissing error toast
├── assets/
│   └── fonts/                   # Instrument Serif, Sora, Source Serif 4
└── test/                        # Widget and unit tests
```

---

## Conventions

- **File naming**: snake_case for all files
- **Widget naming**: PascalCase (e.g., `PoiCard`, `SearchBar`)
- **State**: Riverpod `@riverpod` annotation for generated providers where possible
- **Models**: Freezed unions/classes for all API data
- **No `any`/`dynamic`**: Strict types everywhere
- **No barrel exports**: Import from source file directly
- **Linting**: `flutter analyze` must pass with zero issues
- **Formatting**: `dart format .` before every commit

### Documentation Style

Dart has its own native documentation convention (`///` doc comments with `[]` references). **Use Dart's native style**, not Google-style or Javadoc.

**Rules**:
- ALL public classes, methods, properties, and top-level functions MUST have `///` doc comments
- Private members (`_foo`) get `///` doc comments if the logic is non-obvious
- Keep descriptions short and direct — no filler words
- First sentence is a single-line summary ending with a period
- Use `[ClassName]`, `[methodName]`, `[paramName]` to cross-reference

**Class example**:
```dart
/// Centered header showing POI name, secondary name, and category.
///
/// Adapts font size based on [sheetSnap] — title2 at peek, title1 when expanded.
class PoiHeader extends ConsumerWidget {
```

**Method example**:
```dart
/// Fetches the nearest POIs within [radius] meters of [lat], [lon].
///
/// Returns an empty list if the API is unreachable.
/// Throws [ApiError.rateLimit] if the rate limit is exceeded.
Future<List<ExternalPOI>> getNearbyPois(
  double lat,
  double lon, {
  int radius = 1000,
}) async {
```

**Property/field example**:
```dart
/// Current snap extent of the bottom sheet (0.0–1.0).
final double sheetExtent;
```

**Enum example**:
```dart
/// Controls which content the bottom sheet displays.
enum SheetMode {
  /// Default: search bar with rotating placeholder.
  search,

  /// Search results list after query completes.
  results,

  /// POI detail card with header, actions, tabs.
  poi,
}
```

**What NOT to do**:

- No `@param`, `@returns`, `@throws` tags — Dart doesn't use these
- No `/** */` block comments — use `///` only
- No restating the obvious (`/// The name. final String name;`)
- No Google-style `Args:` / `Returns:` / `Raises:` sections

### Coding Principles

These apply to ALL code written in this project. Non-negotiable.

**1. Think Before Coding**

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

**2. Simplicity First**

- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**3. Surgical Changes**

- Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete without asking.
- Remove imports/variables/functions that YOUR changes made unused.
- Every changed line should trace directly to the task at hand.

**4. Goal-Driven Execution**

- Define success criteria before writing code.
- Transform tasks into verifiable goals:
  - "Add validation" → "Write tests for invalid inputs, then make them pass"
  - "Fix the bug" → "Write a test that reproduces it, then make it pass"
- For multi-step tasks, state a brief plan with verification checkpoints.

**5. Clean Code (Dart-specific)**

- Meaningful, descriptive names — `fetchNearbyPois()` not `getData()`
- Small, focused functions — prefer under 20 lines
- Use Dart's strict type system — no `dynamic`, no `Object` casts
- Custom error types via sealed classes (`ApiError`)
- Early returns to reduce nesting
- Follow Dart/Flutter idiomatic conventions:
  - `camelCase` for variables, functions, parameters
  - `PascalCase` for classes, enums, typedefs, extensions
  - `snake_case` for file names and library names
  - `_privateMembers` with underscore prefix
  - Named parameters for booleans and optional args
  - `const` constructors wherever possible

**6. Comments Policy**

- **NO inline comments** unless explaining a genuinely complex algorithm
- Code must be self-documenting through clear naming
- If you need a comment to explain what code does, refactor the code instead

**7. Security**

- Never hardcode secrets, credentials, or API keys — use environment variables or `--dart-define`
- Never commit `.env` files or secrets to git
- Sanitize and validate all external inputs (API responses, user input)
- Don't expose stack traces or internal details in error UI
- Don't add new dependencies without asking — each dependency is an attack surface

**8. Linting & Formatting**

Run before every commit. Don't manually fix auto-fixable issues:

```bash
flutter analyze          # must be zero issues
dart format .            # auto-format all files
```

**9. Testing**

```bash
flutter test             # unit + widget tests
flutter test --coverage  # with coverage report
```

**10. Git Commit Rules**

- Format: `<type>: <short description>` (e.g., `feat: add poi card header`)
- Imperative mood, lowercase, under 72 chars
- No header, no footer, no optional fields
- Always sign commits with `-S`

**11. Package Management**

- Package manager: `flutter pub`
- Lock file: `pubspec.lock` — always commit
- Don't add dependencies without asking. Each one is an attack surface.
- Prefer packages with Dart 3 null-safety and good maintenance scores

---

## Milestones

### V0.1 — Project Scaffold + Theme

**Goal**: Flutter project compiles and runs with correct theme, fonts, and empty map screen.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create Flutter project (`flutter create --org com.obeliskark obelisk_app`) | Root | `[DONE]` |
| 2 | Add all dependencies to `pubspec.yaml` | `pubspec.yaml` | `[DONE]` |
| 3 | Download and add font files (Instrument Serif, Sora, Source Serif 4) | `assets/fonts/` | `[DONE]` |
| 4 | Configure `pubspec.yaml` font declarations | `pubspec.yaml` | `[DONE]` |
| 5 | Create `ObeliskTheme` ThemeExtension with all tokens from `design.md` | `core/theme/obelisk_theme.dart` | `[DONE]` |
| 6 | Create color constants (light + dark) | `core/theme/colors.dart` | `[DONE]` |
| 7 | Create typography definitions (all TextStyles) | `core/theme/typography.dart` | `[DONE]` |
| 8 | Create GlassMaterial widget (ClipRRect + BackdropFilter) | `core/theme/glass.dart` | `[DONE]` |
| 9 | Create spring animation configs | `ui/animations.dart` | `[DONE]` |
| 10 | Create `main.dart` with ProviderScope + MaterialApp.router | `main.dart`, `app.dart` | `[DONE]` |
| 11 | Create empty `MapScreen` scaffold (Stack with placeholder) | `features/map/map_screen.dart` | `[DONE]` |
| 12 | Verify: `flutter run` shows themed empty screen on iOS/Android/Web | — | `[DONE]` |

**Verification**: App launches with correct dark/light theme, fonts load, no errors.

---

### V0.2 — API Client + Models

**Goal**: All API models defined, client configured, can fetch data from Next.js backend.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create Freezed model: `ExternalPOI` | `core/api/models/poi.dart` | `[DONE]` |
| 2 | Create Freezed model: `PoiImage` | `core/api/models/poi.dart` | `[DONE]` |
| 3 | Create Freezed model: `RemarkWithPoi`, `Remark`, `Poi` | `core/api/models/remark.dart` | `[DONE]` |
| 4 | Create Freezed model: `SearchResult`, `Suggestion` | `core/api/models/search.dart` | `[DONE]` |
| 5 | Create Freezed model: `Category`, `CategorySlug` enum | `core/api/models/category.dart` | `[DONE]` |
| 6 | Create Freezed models: All API response wrappers (`NearbyPoisResponse`, `PoiLookupResponse`, `EnrichMediaResponse`, `SearchResponse`, `AutocompleteResponse`, `GenerateRemarkResponse`, `RegenerateRemarkResponse`) | `core/api/models/*.dart` | `[DONE]` |
| 7 | Create sealed `ApiError` class (validation, rateLimit, notFound, serverError, network) | `core/api/api_errors.dart` | `[DONE]` |
| 8 | Create Dio instance with base config (timeouts, JSON, error interceptor) | `core/api/api_client.dart` | `[DONE]` |
| 9 | Implement all endpoint methods in `ObeliskApi` class | `core/api/endpoints.dart` | `[DONE]` |
| 10 | Run `build_runner` to generate Freezed/JSON code | — | `[DONE]` |
| 11 | Create utility: `formatDistance()` (haversine + display) | `core/utils/distance.dart` | `[DONE]` |
| 12 | Create utility: `isValidHttpUrl()` | `core/utils/url_validator.dart` | `[DONE]` |
| 13 | Verify: Write a simple test that fetches `/api/pois` and deserializes | `test/api_test.dart` | `[DONE]` |

**Verification**: `flutter test` passes, models serialize/deserialize correctly.

---

### V0.3 — Map + Location

**Goal**: Mapbox map renders with user location marker and basic controls.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Configure Mapbox: Add token to platform configs (iOS Info.plist, Android gradle, Web index.html) | Platform files | `[DONE]` |
| 2 | Create `MapView` widget wrapping `MapboxMap` | `features/map/map_view.dart` | `[DONE]` |
| 3 | Implement dark/light map style switching | `features/map/map_view.dart` | `[DONE]` |
| 4 | Create `mapViewportProvider` (tracks center, zoom, bounds on camera change) | `features/map/map_providers.dart` | `[DONE]` |
| 5 | Create `geolocationProvider` (geolocator package, permission handling, fallback to Munich) | `core/location/location_provider.dart` | `[DONE]` |
| 6 | Create `UserLocationMarker` widget (3-layer: pulse + ring + dot) | `features/map/markers/user_location_marker.dart` | `[DONE]` |
| 7 | Add user location marker to map as annotation | `features/map/map_view.dart` | `[DONE]` |
| 8 | Create `MapControls` FAB stack (3D toggle, layers, locate) | `features/map/map_controls.dart` | `[DONE]` |
| 9 | Implement 3D toggle (pitch 0↔45°) | `features/map/map_controls.dart` | `[DONE]` |
| 10 | Implement locate button (fly to user location) | `features/map/map_controls.dart` | `[DONE]` |
| 11 | ~~Create `LookAroundButton`~~ — removed, look-around is automatic via geofence | — | `[REMOVED]` |
| 12 | Wire `MapScreen` to render map + controls + user location | `features/map/map_screen.dart` | `[DONE]` |
| 13 | Verify: Map renders, location works, controls respond | — | `[DONE]` |

**Verification**: Map shows Munich, user dot appears, 3D toggle works, locate animates to user.

---

### V0.4 — Bottom Sheet (Always Visible)

**Goal**: Glass bottom sheet sits on map, supports 3 modes with drag, snap points, and mode transitions.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create `SheetMode` enum and `sheetModeProvider` | `features/sheet/sheet_providers.dart` | `[DONE]` |
| 2 | Create `DragHandle` widget with chevron hint animation | `features/sheet/drag_handle.dart` | `[DONE]` |
| 3 | Create `ObeliskSheet` using `DraggableScrollableSheet` with glass material | `features/sheet/obelisk_sheet.dart` | `[DONE]` |
| 4 | Implement snap points per mode (Mini/Peek/Half/Full) | `features/sheet/obelisk_sheet.dart` | `[DONE]` |
| 5 | Implement progressive corner radius morphing based on extent | `features/sheet/obelisk_sheet.dart` | `[DONE]` |
| 6 | Implement progressive bottom gap based on extent | `features/sheet/obelisk_sheet.dart` | `[DONE]` |
| 7 | Implement overlay opacity based on extent | `features/map/map_screen.dart` | `[DONE]` |
| 8 | Implement mode transition cross-fade (content swap) | `features/sheet/obelisk_sheet.dart` | `[DONE]` |
| 9 | Implement scroll↔drag handoff (content at top = drag, scrolled = scroll) | `features/sheet/obelisk_sheet.dart` | `[DONE]` |
| 10 | Wire sheet into MapScreen Stack | `features/map/map_screen.dart` | `[DONE]` |
| 11 | Verify: Sheet renders at mini, drag up/down works, snaps correctly | — | `[DONE]` |

**Verification**: Glass sheet visible at bottom, drag handle works, snap points feel native.

---

### V0.5 — Search

**Goal**: Search bar inside sheet, autocomplete, results list, viewport-based search.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create `RotatingPlaceholder` widget (cross-fade text every 4s) | `features/search/rotating_placeholder.dart` | `[TODO]` |
| 2 | Create `ObeliskSearchBar` widget (icon + input + mic + avatar) | `features/search/search_bar.dart` | `[TODO]` |
| 3 | Create `searchQueryProvider` + debounced `autocompleteSuggestionsProvider` | `features/search/search_providers.dart` | `[TODO]` |
| 4 | Create `AutocompleteList` widget (category dot + name + label per row) | `features/search/autocomplete_list.dart` | `[TODO]` |
| 5 | Create `searchResultsProvider` (calls POST /api/search) | `features/search/search_providers.dart` | `[TODO]` |
| 6 | Create `SearchResults` list widget (staggered fade-in, loading skeleton) | `features/search/search_results.dart` | `[TODO]` |
| 7 | Wire search bar as default sheet content (Search mode at Mini) | `features/sheet/obelisk_sheet.dart` | `[TODO]` |
| 8 | Implement: Focus search → expand sheet to Half | `features/search/search_bar.dart` | `[TODO]` |
| 9 | Implement: Search complete → show results, sheet stays at Half | `features/sheet/obelisk_sheet.dart` | `[TODO]` |
| 10 | Implement: Clear search → return to Mini | `features/search/search_bar.dart` | `[TODO]` |
| 11 | Implement: "Searching this area" badge for viewport search | `features/search/search_results.dart` | `[TODO]` |
| 12 | Implement: Result tap → trigger POI selection (next milestone) | `features/search/search_results.dart` | `[TODO]` |
| 13 | Verify: Type → autocomplete appears → search → results list → clear works | — | `[TODO]` |

**Verification**: Full search flow works end-to-end with API calls.

---

### V0.6 — POI Card (Header + Actions)

**Goal**: POI card renders in sheet with centered header, action buttons, and info metrics.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create `selectedPoiProvider` + `selectedRemarkProvider` | `features/poi/poi_providers.dart` | `[TODO]` |
| 2 | Create `PoiHeader` widget (centered name, secondary name, subcategories, category dot) | `features/poi/poi_header.dart` | `[TODO]` |
| 3 | Create `ActionButton` widget (icon + label, primary/secondary variants) | `features/poi/action_buttons.dart` | `[TODO]` |
| 4 | Create `ActionButtonsRow` (Navigate + Call + Website in 3-col) | `features/poi/action_buttons.dart` | `[TODO]` |
| 5 | Implement Navigate button (url_launcher to maps app) | `features/poi/action_buttons.dart` | `[TODO]` |
| 6 | Implement Call button (tel: link) | `features/poi/action_buttons.dart` | `[TODO]` |
| 7 | Implement Website button (external URL) | `features/poi/action_buttons.dart` | `[TODO]` |
| 8 | Create `InfoMetricsRow` (Distance + Category + Amenity) | `features/poi/info_metrics.dart` | `[TODO]` |
| 9 | Create `PoiCard` widget (orchestrates header + actions + metrics) | `features/poi/poi_card.dart` | `[TODO]` |
| 10 | Wire POI card as sheet content in POI mode | `features/sheet/obelisk_sheet.dart` | `[TODO]` |
| 11 | Implement: Search result tap → POST /api/poi/lookup → show POI card at Peek | `features/poi/poi_providers.dart` | `[TODO]` |
| 12 | Implement: Map pin tap → POST /api/poi/lookup → show POI card at Peek | `features/map/map_view.dart` | `[TODO]` |
| 13 | Implement: Close button → return to Search mode | `features/poi/poi_card.dart` | `[TODO]` |
| 14 | Implement peek-vs-expanded visibility (header scaling, section show/hide) | `features/poi/poi_card.dart` | `[TODO]` |
| 15 | Verify: Tap result → POI card with header, actions, metrics, close | — | `[TODO]` |

**Verification**: POI card shows correct data, actions work (navigate, call, website), peek/expand transitions.

---

### V0.7 — Media Carousel

**Goal**: Photo carousel with attribution, dot indicators, fullscreen, and on-demand enrichment.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create `MediaCarousel` widget (PageView with photos) | `features/poi/media_carousel.dart` | `[TODO]` |
| 2 | Implement photo tiles with rounded corners + attribution watermark | `features/poi/media_carousel.dart` | `[TODO]` |
| 3 | Implement dot indicators (active/inactive, tap to jump) | `features/poi/media_carousel.dart` | `[TODO]` |
| 4 | Implement fullscreen photo viewer (Navigator.push, dark bg, swipe, pinch-zoom) | `features/poi/media_carousel.dart` | `[TODO]` |
| 5 | Implement swipe-down-to-dismiss in fullscreen | `features/poi/media_carousel.dart` | `[TODO]` |
| 6 | Implement on-demand enrichment (POST /api/poi/enrich-media if no images) | `features/poi/media_carousel.dart` | `[TODO]` |
| 7 | Implement shimmer placeholder for loading/empty state | `features/poi/media_carousel.dart` | `[TODO]` |
| 8 | Wire carousel into PoiCard between metrics and tab bar | `features/poi/poi_card.dart` | `[TODO]` |
| 9 | Verify: Photos display, swipe, fullscreen, enrichment loads new images | — | `[TODO]` |

**Verification**: Carousel works with real POI images, fullscreen works, enrichment fetches missing media.

---

### V0.8 — Tab System + Remark Tab

**Goal**: Tab bar with Remark/Capsules/Details, remark generation and display.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create `PoiTabBar` widget (3 tabs with animated underline) | `features/poi/tab_bar.dart` | `[TODO]` |
| 2 | Create tab content container (TabBarView with swipe) | `features/poi/poi_card.dart` | `[TODO]` |
| 3 | Create `remarkGenerationProvider` (tracks generating/regenerating/cooldown) | `features/poi/poi_providers.dart` | `[TODO]` |
| 4 | Create `LoadingState` widget (obelisk pulse + rotating phrases) | `features/remark/loading_state.dart` | `[TODO]` |
| 5 | Create `RemarkTab` widget ("About" section header, title with accent bar, markdown body) | `features/poi/remark_tab.dart` | `[TODO]` |
| 6 | Implement "...MORE" text truncation with expand animation | `features/poi/remark_tab.dart` | `[TODO]` |
| 7 | Implement "More on Wikipedia" link | `features/poi/remark_tab.dart` | `[TODO]` |
| 8 | Implement local tip callout (accent border, obelisk icon) | `features/poi/remark_tab.dart` | `[TODO]` |
| 9 | Implement regenerate button with cooldown timer | `features/poi/remark_tab.dart` | `[TODO]` |
| 10 | Implement auto-generate on POI select (POST /api/remarks/generate-for-poi) | `features/poi/poi_providers.dart` | `[TODO]` |
| 11 | Implement regenerate (POST /api/remarks/regenerate) | `features/poi/poi_providers.dart` | `[TODO]` |
| 12 | Create `CapsulesTab` widget (empty state + create form) | `features/poi/capsules_tab.dart` | `[TODO]` |
| 13 | Create `DetailsTab` widget (contact rows, amenities, report) | `features/poi/details_tab.dart` | `[TODO]` |
| 14 | Verify: Tabs switch, remark generates and displays, markdown renders | — | `[TODO]` |

**Verification**: Full tab flow works — remark generates, shows with markdown, capsules/details show correct data.

---

### V0.9 — Bottom Toolbar + Notifications

**Goal**: Bottom toolbar on POI card, geofence notification, error toast.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create `BottomToolbar` widget (Add, Favorite, More buttons) | `features/poi/bottom_toolbar.dart` | `[TODO]` |
| 2 | Wire toolbar into PoiCard at bottom | `features/poi/poi_card.dart` | `[TODO]` |
| 3 | Create `geofenceProvider` (distance rings, cooldown, session cap) | `core/location/geofence.dart` | `[TODO]` |
| 4 | Create `nearbyRemarksProvider` (GET /api/remarks with user location) | `features/remark/remark_providers.dart` | `[TODO]` |
| 5 | Create `RemarkNotification` widget (glass toast with amber border) | `features/remark/remark_notification.dart` | `[TODO]` |
| 6 | Implement notification slide-in/out animations | `features/remark/remark_notification.dart` | `[TODO]` |
| 7 | Implement: Notification tap → open POI in sheet | `features/remark/remark_notification.dart` | `[TODO]` |
| 8 | Create `ErrorToast` widget (glass, red border, auto-dismiss 6s) | `features/error/error_toast.dart` | `[TODO]` |
| 9 | Wire error toast for API failures | `features/map/map_screen.dart` | `[TODO]` |
| 10 | Wire geofence + notification into MapScreen | `features/map/map_screen.dart` | `[TODO]` |
| 11 | Verify: Walk near a POI → notification appears → tap opens it | — | `[TODO]` |

**Verification**: Full geofence flow works, error toast shows on API failure.

---

### V0.10 — Map Markers + POI Pins

**Goal**: POI pins on map, search pin, map click detection.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create `PoiPin` (colored circle, size by selection state) | `features/map/markers/poi_pin.dart` | `[TODO]` |
| 2 | Create `SearchPin` (teardrop with pin-drop animation) | `features/map/markers/search_pin.dart` | `[TODO]` |
| 3 | Render nearby POI pins on map from `nearbyRemarksProvider` | `features/map/map_view.dart` | `[TODO]` |
| 4 | Render search pin at selected POI location | `features/map/map_view.dart` | `[TODO]` |
| 5 | Implement map tap → query features → POI lookup | `features/map/map_view.dart` | `[TODO]` |
| 6 | Implement camera fly-to on POI select (1800ms, zoom 16) | `features/map/map_view.dart` | `[TODO]` |
| 7 | Implement map center offset to account for sheet height | `features/map/map_view.dart` | `[TODO]` |
| 8 | Verify: Pins show on map, tap pin → POI card, camera animates | — | `[TODO]` |

**Verification**: Map shows POI pins, tapping them opens POI card, search pin appears.

---

### V0.11 — Polish + Platform Cleanup

**Goal**: Final polish, platform-specific fixes, performance optimization.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Implement dark/light mode switching (auto-detect + manual toggle) | `app.dart` | `[TODO]` |
| 2 | Add reduced-motion support (check `MediaQuery.disableAnimations`) | `ui/animations.dart` | `[TODO]` |
| 3 | iOS: Configure Info.plist (location descriptions, Mapbox token) | `ios/` | `[TODO]` |
| 4 | Android: Configure permissions, Mapbox token in gradle | `android/` | `[TODO]` |
| 5 | Web: Configure index.html with Mapbox GL JS fallback | `web/` | `[TODO]` |
| 6 | Safe areas: Verify top/bottom insets on all platforms | All screens | `[TODO]` |
| 7 | Performance: Profile with DevTools, fix jank | — | `[TODO]` |
| 8 | `flutter analyze` — zero issues | — | `[TODO]` |
| 9 | `dart format .` — all files formatted | — | `[TODO]` |
| 10 | Test on: iOS simulator, Android emulator, Chrome | — | `[TODO]` |

**Verification**: App runs smoothly on all 3 platforms with no lint errors.

---

## Agent Instructions

### Map Abstraction Layer

**IMPORTANT**: Mapbox is used for map tile rendering ONLY. It will be replaced with a custom map solution. All app logic (controls, providers, location) MUST use the abstract `MapCameraController` interface from `lib/core/map/map_camera_controller.dart`.

- `mapbox_maps_flutter` imports are ONLY allowed in `map_view.dart` and `main.dart`
- `map_controls.dart`, `map_providers.dart`, and all other files must use `MapCameraController`
- Camera operations (`flyTo`, `setBearing`, `setPitch`) go through the abstract interface
- The Mapbox implementation (`_MapboxCameraController`) lives in `map_view.dart` — the only file that touches the SDK
- When adding new camera/map features, add the method to `MapCameraController` first, then implement in `map_view.dart`

### Starting a New Session

1. Read `flutter.md` (this file) — find the next `[TODO]` task
2. Read `ui-ux.md` — find the matching component spec
3. Read `design.md` — reference visual tokens
4. Implement the task
5. Run `flutter analyze` and `dart format .`
6. Update the task status to `[DONE]` in this file
7. If blocked, add a `[BLOCKED: reason]` note

### Running the App

```bash
cd lib/  # or wherever the Flutter project root is
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs  # after model changes
flutter run -d chrome  # or -d ios / -d android
flutter analyze
dart format .
```

### Environment

- API base URL: `http://localhost:3000` (Next.js backend must be running)
- Mapbox token: Same as `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env`
- Ollama: Must be running on host for remark generation

### Code Generation

After changing any `@freezed` or `@riverpod` annotated files:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Commit Messages

Same as project conventions:
- Format: `<type>: <short description>`
- Imperative mood, lowercase, under 72 chars
- Sign commits with `-S`
