# Obelisk Android — Kotlin Jetpack Compose

> **Goal:** Native Android client cloning Apple Maps iOS 26 design language.
> **Stack:** Kotlin, Jetpack Compose, Material 3, Mapbox SDK, Retrofit/OkHttp, Hilt, Coroutines/Flow.
> **Backend:** Existing Next.js API (unchanged). Default `http://10.0.2.2:3000` for emulator.
> **Design ref:** Apple Maps iOS 26 dark mode — liquid glass sheet, photo pins, spring physics.

---

## Visual Reference (Apple Maps iOS 26, Munich)

### Mini State (Idle)
```
┌─────────────────────────────────────────────────┐
│ [moon 9°]                              status bar│  <- weather pill top-left
│                                                   │
│    (orange) H'ugos    (orange) Les Deux           │  <- small circle pins with
│  (pink) Bossy                                     │     white category icons
│                                                   │
│  ┌─────────┐                                      │
│  │  PHOTO  │ THE MUNICH                           │  <- landmark: large circle
│  │  circle │ CATHEDRAL                            │     photo pin with ring
│  └─────────┘                                      │
│                    (orange) Kilians Irish Pub      │
│                                                   │
│          (orange) Nurnberger Bratwurst             │
│  (green) Marienplatz                              │
│                                           [3D]    │  <- stacked controls
│                                           [layers]│     bottom-right
│ [binoculars]                              [locate]│  <- binoculars bottom-left
│                                                   │
│   ┌───────────────────────────────────────────┐   │
│   │ Q  Apple Maps                    mic  (av)│   │  <- floating dark glass
│   └───────────────────────────────────────────┘   │     search pill at bottom
└─────────────────────────────────────────────────┘
```

### Medium State (POI Selected)
```
┌─────────────────────────────────────────────────┐
│                       MAP                        │
│         ┌──────────┐                             │
│         │  PHOTO   │                     [3D]    │  <- enlarged photo pin
│         │  circle  │                     [layers]│
│         └──────────┘                     [locate]│
│    THE MUNICH CATHEDRAL                          │
│                                                  │
│ ┌────────────────────────────────────────────────┤
│ │              ─── (drag handle) ───             │  <- glass sheet medium
│ │  [share]    The Munich Cathedral       [X]    │
│ │             Cathedral                          │
│ │                                                │
│ │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │  <- action pills
│ │  │ 32 min   │ │  Call    │ │ Website  │      │
│ │  └──────────┘ └──────────┘ └──────────┘      │
│ │                                                │
│ │  Tripadvisor    Accepts      Distance          │  <- info row
│ │  star 4.1       [icons]      10 km             │
│ │                                                │
│ │  ┌──────────┐ ┌──────────┐                    │  <- photo carousel
│ │  │  photo1  │ │  photo2  │  ...               │
│ │  └──────────┘ └──────────┘                    │
│ │                                                │
│ │      [+]        [star]        [...]           │  <- bottom actions
│ └────────────────────────────────────────────────┘
```

---

## Architecture

```
android/
├── app/src/main/java/com/obelisk/app/
│   ├── ObeliskApp.kt                    # Hilt application
│   ├── MainActivity.kt                  # Single activity, edge-to-edge
│   ├── data/
│   │   ├── api/
│   │   │   ├── ObeliskApi.kt            # Retrofit interface
│   │   │   ├── ApiModule.kt             # Hilt DI
│   │   │   └── models/                  # Data classes
│   │   │       ├── Poi.kt
│   │   │       ├── Remark.kt
│   │   │       └── Search.kt
│   │   ├── location/
│   │   │   └── LocationRepository.kt    # Fused location provider
│   │   └── repository/
│   │       ├── PoiRepository.kt
│   │       └── SearchRepository.kt
│   ├── ui/
│   │   ├── theme/
│   │   │   ├── Theme.kt                 # ObeliskTheme composable
│   │   │   ├── Color.kt                 # Palette + category colors
│   │   │   ├── Type.kt                  # 3 font families, full scale
│   │   │   ├── Shape.kt                 # Corner radius tokens
│   │   │   ├── Spring.kt               # Named spring specs
│   │   │   └── Glass.kt                # Frosted glass modifier
│   │   ├── map/
│   │   │   ├── MapScreen.kt             # Root: map + sheet + controls + overlays
│   │   │   ├── ObeliskMap.kt           # Mapbox compose wrapper
│   │   │   ├── MapControls.kt          # 3D, layers, locate (bottom-right stack)
│   │   │   ├── WeatherPill.kt          # Top-left weather indicator
│   │   │   ├── LookAroundButton.kt     # Bottom-left binoculars
│   │   │   ├── PoiPin.kt              # Small circle pin (icon + color)
│   │   │   ├── SelectedPoiPin.kt      # Large circle photo pin with ring
│   │   │   └── UserLocationMarker.kt   # Blue dot + ring + pulse
│   │   ├── sheet/
│   │   │   ├── ObeliskSheet.kt          # 3-detent floating glass sheet
│   │   │   ├── SheetMode.kt            # Sealed class: Idle, Search, Results, Poi
│   │   │   └── SheetContent.kt          # Mode-driven content
│   │   ├── search/
│   │   │   ├── SearchPill.kt            # Search bar (also prompt field, grows)
│   │   │   ├── RotatingPlaceholder.kt
│   │   │   ├── AutocompleteOverlay.kt   # Floats ABOVE sheet
│   │   │   ├── SearchResults.kt
│   │   │   └── CategoryChips.kt
│   │   ├── poi/
│   │   │   ├── PoiCard.kt              # Full POI card (medium + large content)
│   │   │   ├── PoiHeader.kt            # Share, title, category, close
│   │   │   ├── ActionPills.kt          # Transit/Call/Website row
│   │   │   ├── InfoRow.kt             # Rating, payment, distance
│   │   │   ├── PhotoCarousel.kt
│   │   │   ├── PoiTabs.kt             # Remark / Capsules / Details
│   │   │   └── BottomActions.kt        # +, star, more
│   │   ├── remark/
│   │   │   ├── RemarkTab.kt            # Compact (title) + full (body + local tip)
│   │   │   ├── RemarkNotification.kt    # Geofence toast
│   │   │   └── RegenerateButton.kt
│   │   └── common/
│   │       ├── GlassSurface.kt          # Reusable frosted glass
│   │       ├── ShimmerBox.kt
│   │       └── CategoryDot.kt
│   └── viewmodel/
│       ├── MapViewModel.kt
│       ├── SearchViewModel.kt
│       ├── PoiViewModel.kt
│       └── LocationViewModel.kt
├── app/src/main/res/
│   ├── values/themes.xml
│   └── font/                            # Instrument Serif, Sora, Source Serif 4
└── build.gradle.kts
```

---

## API Surface (existing Next.js backend, unchanged)

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/pois?lat=&lon=&radius=` | GET | Load POIs for map pins |
| `/api/poi/lookup` | POST | Resolve POI by name + location |
| `/api/poi/enrich-media` | POST | Lazy-load photos for carousel |
| `/api/remarks?lat=&lon=&radius=` | GET | Preload nearby remarks for geofence |
| `/api/remarks/generate-for-poi` | POST | On-demand remark for selected POI |
| `/api/remarks/regenerate` | POST | Re-roll remark (20s cooldown) |
| `/api/search` | POST | Full hybrid search |
| `/api/search/autocomplete?q=` | GET | Prefix autocomplete |

---

## Design Tokens

### Colors (Light + Dark, both from V0.1)

```
                     LIGHT           DARK
Foreground:          #1D1D1F         #F5F5F7
Secondary:           #6E6E73         #A1A1A6
Tertiary:            #86868B         #6E6E73
Background:          #FFFFFF         #000000
Surface:             #F5F5F7         #141414
Elevated:            #FFFFFF         #1C1C1E

Accent:              #C49A6C         #D4AA7C         (warm amber — brand)
AccentSubtle:        #C49A6C @ 12%   #D4AA7C @ 12%
CtaBlue:             #007AFF         #0A84FF         (primary action)
CtaBlueSubtle:       #007AFF @ 12%   #0A84FF @ 15%
Location:            #3478F6         #5E9EFF         (user dot)
Error:               #E5484D         #E54D4D

Glass BG:            white @ 75%    #141414 @ 78%    + blur 24dp
Glass Border:        black @ 6%     white @ 6%
Glass Border Strong: black @ 12%    white @ 12%
```

### Category Pin Colors (from Apple Maps screenshot)
```
Food/Gastronomy:     #E88545  (orange)      — fork/knife icon
Shopping:            #E85D9F  (pink)        — bag icon
Heritage/Culture:    #A87DFF  (purple)      — monument icon
Nature/Parks:        #34C759  (green)       — leaf icon
Transit:             #5E9EFF  (blue)        — train icon
Discovery/Hidden:    #D4AA7C  (amber/gold)  — star icon
Utility/Services:    #8E8E93  (gray)        — generic icon
```

### Pin Specs
- **Normal pin:** 28dp circle, colored fill, white icon (16dp), 2dp shadow
- **With label:** Pin + POI name text below (Sora 11sp, white, shadow for readability)
- **Selected pin:** Expands to 64dp circle with **POI photo** inside, 3dp white border ring, name label below in caps (Sora 12sp semibold). If no photo, show enlarged icon version.

### Typography (3 families, matching Next.js)
```
Display:   Instrument Serif  — POI names, titles
           largeTitle 34sp, title1 28sp, title2 22sp, title3 20sp

UI:        Sora              — buttons, labels, metadata, search
           body 17sp, subhead 15sp, footnote 13sp, caption1 12sp, caption2 11sp

Reading:   Source Serif 4    — remark body, local tips
           body 17sp (1.7 line height), subhead 15sp
```

### Spring Specs (Compose `spring()`)
| Name | Stiffness | Damping | Use |
|------|-----------|---------|-----|
| snappy | 400 | 0.85 | Buttons, tap feedback |
| smooth | 200 | 0.85 | Content transitions |
| gentle | 150 | 0.80 | List entries, reveals |
| liquid | 180 | 0.78 | Sheet morphing |
| quick | 500 | 0.90 | Micro-interactions |
| pinDrop | 300 | 0.65 | Pin selection bounce |

### Corner Radii
`sm` 8dp, `md` 12dp, `lg` 16dp, `xl` 20dp, `2xl` 24dp, `3xl` 32dp, `full` 9999dp

---

## Sheet Behavior (Three Detents)

### Detent Sizes
- **Mini (12%):** Floating — gap from bottom and sides, all corners rounded (3xl = 32dp). Shows search pill only. Sheet is a dark glass island.
- **Medium (50%):** Attached to sides — no side gap, bottom gap gone, top corners rounded (xl = 20dp). Shows search pill + content (POI card compact or search results). Map visible above.
- **Large (85%):** Near-full — top corners rounded (md = 12dp). Full scrollable content. Map still visible as strip above (~15%).

### Progressive Morphing (as sheet drags)
- Corner radius: 32dp (mini) -> 20dp (medium) -> 12dp (large)
- Side margin: 12dp (mini) -> 0dp (medium+)
- Bottom margin: 12dp (mini) -> 0dp (medium+)
- Shadow: sm (mini) -> md (medium) -> lg (large)
- Glass opacity: 78% throughout, blur 24dp

### Drag Handle
- 36 x 5dp pill, centered, `#FFFFFF @ 20%`, `radiusFull`
- Always visible at top of sheet

### Search Pill (Always Present)
The search pill sits at the top of every sheet state. It doubles as a **prompt text field** that grows vertically as the user types longer queries (like a chat input expanding).

```
Mini:   [search-icon]  Rotating placeholder...  [mic]  (avatar-photo 36dp)
Typing: [search-icon]  user text that can       [X]    (avatar-photo 36dp)
                        wrap to multiple lines
```

- Pill: Elevated bg (#1C1C1E), 50dp min height, radius 2xl (24dp), glass border
- Left: search icon 18dp (tertiary)
- Center: TextField with rotating placeholder (4s cycle, cross-fade) when idle
- Right: mic icon when idle/focused-empty, X clear button when has text
- Far right: user avatar photo 36dp circle (outside pill, on sheet surface)
- Grows vertically: `minHeight = 50dp`, no maxHeight cap, soft wrap enabled

---

## Sheet Modes + Transitions

```
                    tap search pill
[Idle/Mini] ─────────────────────────> [Search/Medium]
     │                                       │
     │ tap pin                               │ type -> autocomplete overlay
     v                                       │ submit -> results in medium
[POI/Medium]                                 │ tap result
     │                                       v
     │ swipe up                        [POI/Medium] (fly-to + pin select)
     v                                       │
[POI/Large]                                  │ swipe up
  (full tabs,                                v
   scrollable)                         [POI/Large]
```

### Idle (Mini)
- Search pill with rotating placeholder
- Category chips row below (horizontal scroll): Food, Culture, Nature, Shopping, etc.

### Search Active
- Tap search pill -> sheet animates to **medium**, keyboard opens
- As user types: **autocomplete overlay** floats ABOVE the sheet (max 5 rows, glass surface, shadow)
- User submits (keyboard search or tap suggestion): autocomplete dismisses, **search results** appear in sheet body (medium), scrollable
- Results: category dot (6dp) + name (subhead) + "category dot distance" (footnote)
- Tap result: fly-to POI on map, sheet transitions to POI mode

### POI Selected (Medium — Compact)
- Pin on map enlarges to 64dp photo circle with white ring
- Sheet at medium shows:
  1. **Header:** share icon (left), POI name (display title2), category subtitle, close X (right)
  2. **Action pills row:** Transit time (blue CTA), Call, Website — rounded rect pills
  3. **Info row:** Rating + stars, payment icons, distance
  4. **Tabs:** Remark | Capsules | Details (underline indicator, accent color)
     - **Remark (default):** Title only in compact mode
     - **Capsules:** One comment preview if exists, otherwise "No capsules yet"
     - **Details:** Business hours + open/closed badge
  5. **Photo carousel:** Horizontal scroll, rounded-lg images
  6. **Bottom actions:** + (add), star (favorite), ... (more)

### POI Selected (Large — Full)
- Swipe sheet up to large
- Same layout but tabs now show **full content**, scrollable:
  - **Remark:** Full story body (reading font, markdown), local tip section with accent border, regenerate button
  - **Capsules:** All comments, create form
  - **Details:** Full address, phone, website, hours, amenity pills

### Close / Back
- Tap X on POI card -> deselect pin (shrink back), sheet returns to mini
- Swipe sheet down past medium -> same behavior

---

## Versioned Build Plan

### V0.1 — Scaffold + Map + Theme
**Goal:** Edge-to-edge map with dark mode, location dot, controls.

| # | Task | Files |
|---|------|-------|
| 1 | Android project: Compose + Hilt + Mapbox SDK | `build.gradle.kts`, `ObeliskApp.kt`, `MainActivity.kt` |
| 2 | Color palette (light + dark), typography (3 fonts), shapes, springs | `Color.kt`, `Type.kt`, `Shape.kt`, `Spring.kt`, `Theme.kt` |
| 3 | GlassSurface composable (blur + alpha + border) | `GlassSurface.kt`, `Glass.kt` |
| 4 | Mapbox dark style, centered on Munich | `ObeliskMap.kt`, `MapScreen.kt` |
| 5 | Location permissions + fused provider | `LocationRepository.kt`, `LocationViewModel.kt` |
| 6 | UserLocationMarker (blue dot + accuracy ring + pulse anim) | `UserLocationMarker.kt` |
| 7 | Map controls: 3D button, layers button, locate button (stacked bottom-right, glass-floating) | `MapControls.kt` |
| 8 | Weather pill (top-left, hardcoded for now) | `WeatherPill.kt` |
| 9 | LookAround button (bottom-left, binoculars icon, glass-floating) | `LookAroundButton.kt` |
| 10 | Edge-to-edge, transparent system bars | `themes.xml`, `MainActivity.kt` |

**Verify:** App launches, map renders in both light and dark mode (follows system), blue dot visible, controls work, glass surfaces blur correctly.

---

### V0.2 — POI Pins

**Goal:** Load POIs from API, render as category-colored circle pins.

| # | Task | Files |
|---|------|-------|
| 1 | Retrofit interface + Hilt module + OkHttp logging | `ObeliskApi.kt`, `ApiModule.kt` |
| 2 | POI data classes matching API JSON | `models/Poi.kt` |
| 3 | PoiRepository: fetch nearby POIs | `PoiRepository.kt` |
| 4 | MapViewModel: load POIs on viewport change (300ms debounce) | `MapViewModel.kt` |
| 5 | PoiPin: 28dp filled circle, white category icon, colored by group, 2dp shadow | `PoiPin.kt` |
| 6 | Category color mapping (slug -> group -> color) | `Color.kt` extend |
| 7 | POI name labels beside pins (Sora 11sp, white, text shadow) | `PoiPin.kt` |
| 8 | Pin tap: select POI in ViewModel, pin gets highlight ring | `MapViewModel.kt`, `PoiPin.kt` |

**Verify:** ~400 colored pins visible on map, labels readable, tap selects.

---

### V0.3 — Floating Sheet (Three Detent)

**Goal:** Persistent dark glass sheet with mini/medium/large, progressive morphing.

| # | Task | Files |
|---|------|-------|
| 1 | SheetMode sealed class: Idle, Search, Results, Poi | `SheetMode.kt` |
| 2 | AnchoredDraggable with 3 anchors (12%, 50%, 85%) | `ObeliskSheet.kt` |
| 3 | GlassSurface shell: dark glass bg, blur 24dp, strong border | `ObeliskSheet.kt` |
| 4 | Progressive corner radius (32 -> 20 -> 12dp based on offset) | `ObeliskSheet.kt` |
| 5 | Floating margins at mini (12dp sides + bottom), 0 at medium+ | `ObeliskSheet.kt` |
| 6 | Shadow progression (sm -> md -> lg) | `ObeliskSheet.kt` |
| 7 | Drag handle (36x5dp pill) | `ObeliskSheet.kt` |
| 8 | SheetContent placeholder per mode | `SheetContent.kt` |
| 9 | Mode changes animate to target detent (liquid spring) | `ObeliskSheet.kt` |

**Verify:** Sheet drags between 3 snaps, floats at mini, attaches at medium, glass renders. Map visible above at all sizes.

**Key:** Use `AnchoredDraggable` with `DraggableAnchors`, NOT `BottomSheetScaffold` (only supports 2 detents).

---

### V0.4 — Search Pill + Placeholder

**Goal:** Search bar in sheet, rotating hints, grows on typing.

| # | Task | Files |
|---|------|-------|
| 1 | RotatingPlaceholder: 5 strings, 4s Timer, 200ms cross-fade | `RotatingPlaceholder.kt` |
| 2 | SearchPill: elevated bg, search icon, text field, mic/clear, avatar | `SearchPill.kt` |
| 3 | Growing text field: minHeight 50dp, soft wrap, no max height | `SearchPill.kt` |
| 4 | Focus: sheet animates to medium, keyboard opens | `SearchPill.kt`, `ObeliskSheet.kt` |
| 5 | Clear: text clears, unfocus, sheet returns to mini | `SearchPill.kt` |
| 6 | CategoryChips: horizontal scroll row below pill (idle only) | `CategoryChips.kt` |
| 7 | Wire into SheetContent for Idle mode | `SheetContent.kt` |

**Verify:** Rotating placeholder cycles, typing grows pill height, focus expands sheet, clear returns to mini.

---

### V0.5 — Search (Autocomplete + Results)

**Goal:** Full search flow with floating autocomplete and result list.

| # | Task | Files |
|---|------|-------|
| 1 | Search data classes | `models/Search.kt` |
| 2 | SearchRepository: autocomplete (300ms debounce) + search | `SearchRepository.kt` |
| 3 | SearchViewModel: query flow, suggestions, results | `SearchViewModel.kt` |
| 4 | AutocompleteOverlay: floats ABOVE sheet, max 5 rows, glass surface, shadow-float | `AutocompleteOverlay.kt` |
| 5 | Suggestion row: category dot + name + category label, staggered entry (40ms gentle spring) | `AutocompleteOverlay.kt` |
| 6 | Tap suggestion: fill search, trigger full search | `SearchViewModel.kt` |
| 7 | SearchResults in sheet body (medium mode), scrollable | `SearchResults.kt` |
| 8 | Result row: dot + name (subhead) + "category . distance" (footnote) | `SearchResults.kt` |
| 9 | Loading: 5 shimmer skeleton rows | `ShimmerBox.kt`, `SearchResults.kt` |
| 10 | Empty state: icon + "No results" | `SearchResults.kt` |
| 11 | Tap result: fly-to POI, switch to POI mode | `MapScreen.kt` |

**Verify:** Type 2+ chars -> suggestions float above sheet. Submit -> results in medium. Tap result -> fly-to + POI card.

---

### V0.6 — Selected Pin (Photo Circle)

**Goal:** Tapped POI pin enlarges to circular photo with white ring.

| # | Task | Files |
|---|------|-------|
| 1 | SelectedPoiPin: 64dp circle, POI photo (Coil), 3dp white border ring | `SelectedPoiPin.kt` |
| 2 | Fallback: if no photo, enlarged icon version (48dp circle, same color) | `SelectedPoiPin.kt` |
| 3 | Name label below in caps (Sora 12sp semibold, white, text shadow) | `SelectedPoiPin.kt` |
| 4 | Selection animation: scale 0 -> 1 with pinDrop spring (bouncy) | `SelectedPoiPin.kt` |
| 5 | Deselection: scale 1 -> 0, normal pin fades back in | `SelectedPoiPin.kt` |
| 6 | Map fly-to selected POI with easing | `MapViewModel.kt` |

**Verify:** Tap pin -> bounces to photo circle. Deselect -> shrinks back. Photos load from enrich-media API.

---

### V0.7 — POI Card (Medium — Compact)

**Goal:** POI detail card in medium sheet with compact tab previews.

| # | Task | Files |
|---|------|-------|
| 1 | Remark data classes | `models/Remark.kt` |
| 2 | PoiRepository: lookup, enrich-media, generate-for-poi, regenerate | `PoiRepository.kt` |
| 3 | PoiViewModel: selected POI, remark loading, media, tab state | `PoiViewModel.kt` |
| 4 | PoiHeader: share icon (left), name (title2 display), category subtitle, X close (right) | `PoiHeader.kt` |
| 5 | ActionPills: transit time (blue CTA), Call (tel intent), Website (browser intent) | `ActionPills.kt` |
| 6 | InfoRow: rating + stars, payment icons, distance from user | `InfoRow.kt` |
| 7 | PoiTabs with underline indicator (accent): Remark / Capsules / Details | `PoiTabs.kt` |
| 8 | RemarkTab compact: title only | `RemarkTab.kt` |
| 9 | Capsules compact: one comment if exists | `PoiTabs.kt` |
| 10 | Details compact: hours + open/closed badge | `PoiTabs.kt` |
| 11 | PhotoCarousel: horizontal lazy row, rounded-lg, Coil | `PhotoCarousel.kt` |
| 12 | BottomActions: + (add), star (favorite), ... (more) | `BottomActions.kt` |
| 13 | Wire: pin tap or search result tap -> sheet medium with POI card | `SheetContent.kt`, `MapScreen.kt` |
| 14 | Close: X -> deselect pin, sheet to mini | `PoiViewModel.kt` |

**Verify:** Tap pin -> sheet goes medium with full compact card. Action buttons launch intents. Tabs switch. Close works.

---

### V0.8 — POI Card (Large — Full Tabs)

**Goal:** Swipe sheet to large for full scrollable tab content.

| # | Task | Files |
|---|------|-------|
| 1 | RemarkTab full: story body (Source Serif 4, markdown), local tip (accent border), regenerate button | `RemarkTab.kt` |
| 2 | RegenerateButton: 20s cooldown countdown, re-rolls via API | `RegenerateButton.kt` |
| 3 | Capsules full: all comments list, create form placeholder | `PoiTabs.kt` |
| 4 | Details full: address, phone (tel), website (link), full hours, amenity pills | `PoiTabs.kt` |
| 5 | Tab content scrollable within large sheet | `PoiCard.kt` |
| 6 | Swipe between tabs (horizontal pager with spring) | `PoiTabs.kt` |

**Verify:** Swipe sheet to large -> full remark body visible, scrollable. Regenerate works with cooldown. All 3 tabs have full content.

---

### V0.9 — Geofence + Notifications

**Goal:** Ambient remark toasts when walking near POIs.

| # | Task | Files |
|---|------|-------|
| 1 | Continuous location updates (foreground, lifecycle-aware) | `LocationRepository.kt` |
| 2 | Preload nearby remarks (500m) | `PoiRepository.kt` |
| 3 | Geofence logic: 50m trigger, 100m queue, 500m preload | `MapViewModel.kt` |
| 4 | Cooldown: 2min between, max 5 per 30min | `MapViewModel.kt` |
| 5 | RemarkNotification: glass toast, amber accent border, POI name + teaser | `RemarkNotification.kt` |
| 6 | Slide-up entry (gentle spring), slide-down dismiss, auto-dismiss 8s | `RemarkNotification.kt` |
| 7 | Tap toast -> open POI card, dismiss -> 5min local cooldown | `RemarkNotification.kt` |

**Verify:** Walk near POI -> toast appears. Respects cooldowns. Tap opens card.

---

### V1.0 — Polish + Release

**Goal:** 60fps, battery-friendly, error handling, release-ready.

| # | Task | Files |
|---|------|-------|
| 1 | Compose stability: `@Immutable`/`@Stable` on data classes | All models |
| 3 | LazyColumn keys for lists | `SearchResults.kt`, `AutocompleteOverlay.kt` |
| 4 | Image caching (Coil memory + disk) | `PhotoCarousel.kt` |
| 5 | Location battery: balanced accuracy when backgrounded | `LocationRepository.kt` |
| 6 | Keyboard IME padding, no layout jumps | `ObeliskSheet.kt`, `SearchPill.kt` |
| 7 | Error states: no network, timeout, empty data | All ViewModels |
| 8 | ProGuard rules for Retrofit, Moshi, Mapbox | `proguard-rules.pro` |
| 9 | App icon, splash screen | `res/` |
| 10 | Release build test | `build.gradle.kts` |

**Verify:** Both themes work. No jank in profiler. Release APK installs and runs.

---

## Dependencies

```kotlin
dependencies {
    // Compose
    implementation(platform("androidx.compose:compose-bom:2025.01.01"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.0")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.53")
    kapt("com.google.dagger:hilt-compiler:2.53")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.2")
    kapt("com.squareup.moshi:moshi-kotlin-codegen:1.15.2")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Mapbox
    implementation("com.mapbox.maps:android:11.11.1")
    implementation("com.mapbox.extension:maps-compose:11.11.1")

    // Location
    implementation("com.google.android.gms:play-services-location:21.3.0")

    // Image
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.1")
}
```

---

## Conventions

- Kotlin strict null safety, no `!!`.
- Single-activity Compose-only. No Fragments, no XML layouts.
- `StateFlow` in ViewModels, `collectAsStateWithLifecycle()` in composables.
- All visual values from `ObeliskTheme` — never hardcode colors/fonts/radii.
- All motion uses `spring()` from `ObeliskSprings` — no `tween()` or `animateXAsState` with duration.
- Suspend functions in repositories, `Flow` for streams.
- Import from source directly, no barrel files.
- API base URL via `BuildConfig.API_BASE_URL` (default `http://10.0.2.2:3000`).

## Claude Coding Notes

1. Read this file before each version.
2. Tasks within a version are ordered — later ones depend on earlier ones.
3. `./gradlew assembleDebug` after each task.
4. `./gradlew lint` before marking version complete.
5. One commit per version.
6. Do NOT add features from later versions.
7. The 3-detent sheet (V0.3) is the hardest piece — use `AnchoredDraggable` with `DraggableAnchors`.
8. For glass: `Modifier.graphicsLayer { renderEffect = RenderEffect.createBlurEffect(...) }` on semi-transparent surface. No API check needed (minSdk 31). Wrap in `RepaintBoundary`.
9. Use Mapbox Compose extension, not raw `AndroidView`.
10. `AutocompleteOverlay` is a **separate layer** floating above the sheet (use `Box` in `MapScreen` Z-ordering), not inside the sheet's scrollable content.
