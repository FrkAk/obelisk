# Obelisk UI/UX Implementation Guide

This document is the **single source of truth** for implementing every UI element, interaction, and animation in the Flutter app. Agents read this before writing any widget code.

Reference: `design.md` for visual tokens (colors, typography, spacing). This doc covers **behavior, interactions, and implementation details**.

---

## Agent Instructions

### Before You Code

1. Read `design.md` for all visual tokens (colors, fonts, spacing, shadows, radii)
2. Read `flutter.md` for project structure, packages, and conventions
3. Read this file for the specific component you're implementing
4. Check the **Status** field — skip components marked `[DONE]`
5. After implementing, update the Status to `[DONE]` with your agent ID

### Code Conventions

- All widgets in `lib/ui/` (shared) or `lib/features/<feature>/widgets/`
- Use `Theme.of(context).extension<ObeliskTheme>()` for design tokens
- Use Riverpod providers for all state — no raw setState except ephemeral UI state (animation controllers, scroll offsets)
- All API calls go through `lib/core/api/` client classes
- Use `go_router` for navigation — no `Navigator.push`
- Animations: Use Flutter's `SpringSimulation` with configs from `lib/ui/animations.dart`
- Every widget must have a dartdoc comment

### Testing

- `flutter test` for unit/widget tests
- `flutter run` to verify on device/emulator
- Check both light and dark themes
- Check safe areas on iOS simulator (notch + home indicator)

---

## 1. App Shell

**Status**: `[TODO]`

The app is a single screen: full-screen map with an always-visible bottom sheet overlay and floating controls.

### Widget Tree

```
MaterialApp
└── ObeliskTheme (InheritedWidget / ThemeExtension)
    └── Scaffold (no AppBar, extendBody: true)
        └── Stack
            ├── MapView (fills entire screen)
            ├── Positioned: MapControlsFAB (right side)
            ├── Positioned: LookAroundButton (bottom-left)
            ├── Positioned: RemarkNotification (above sheet, conditional)
            ├── Positioned: ErrorToast (above sheet, conditional)
            └── ObeliskBottomSheet (always visible, DraggableScrollableSheet)
```

### Interactions

- Map receives gestures when sheet is at peek/mini (pointer passthrough)
- Sheet captures gestures when content is scrollable
- Keyboard appears → sheet pushes up with `MediaQuery.viewInsets.bottom`
- Status bar: Transparent, light content (white icons) for dark map

---

## 2. Bottom Sheet (Always Visible)

**Status**: `[TODO]`

The sheet **never closes**. It transitions between 3 modes: Search (default), Results, POI Detail.

### Modes & Snap Points

| Mode | Snap positions (% of screen height) | Default snap |
|------|-------------------------------------|-------------|
| Search | Mini (~12%), Half (55%), Full (85%) | Mini |
| Results | Half (55%), Full (85%) | Half |
| POI Detail | Peek (35%), Half (55%), Full (85%) | Peek |

### Mode Transitions

| From → To | Trigger | Animation |
|-----------|---------|-----------|
| Search → Results | Search completes with results | Content cross-fade (150ms), sheet height → Half |
| Search → POI Detail | User taps map pin | Content cross-fade (150ms), sheet height → Peek |
| Results → POI Detail | User taps search result | Content cross-fade (150ms), sheet height → Peek |
| POI Detail → Search | User taps × Close | Content cross-fade (150ms), sheet height → Mini |
| Results → Search | User clears search | Content cross-fade (150ms), sheet height → Mini |

### Visual Properties by Snap

| Property | Mini (12%) | Peek (35%) | Half (55%) | Full (85%) |
|----------|-----------|-----------|-----------|-----------|
| Bottom gap | 12px | 12px | 4px | 0px |
| Corner radius | 32px | 32px | 20px | 12px |
| Shadow | shadow-sm | shadow-sm | shadow-md | shadow-lg |
| Overlay opacity | 0 | 0 | 0.04 | 0.08 |

### Drag Handle

- Two bars: 16px wide × 3px tall, 1px gap
- Color: gradient rgba(120,120,128, 0.4→0.3)
- Centered horizontally, 10px from top
- Tap on handle area: Cycle to next snap point
- **Chevron hint**: When not at max snap, bars rotate ±12° for 800ms then reset. Triggers on mode change or manual snap.

### Drag Physics

- Direction: Vertical only
- Elastic overscroll: 5% dampening at boundaries
- Snap threshold: velocity > 500px/s OR offset > 100px
- Downward past Mini in Search mode: Bounce back (sheet cannot close)
- Downward past Peek in POI mode: Cross-fade to Search → Mini

### Scroll ↔ Drag Handoff

- Sheet drag takes priority when content is at scroll position 0
- Once content scrolls, sheet drag disengages
- Scrolling back to top and continuing to pull down re-engages sheet drag

### Implementation Notes

- Use `DraggableScrollableSheet` with `snap: true` and `snapSizes` list
- Wrap content in `CustomScrollView` with `SliverList` for smooth scroll-drag handoff
- Corner radius and bottom gap: Animate via `AnimatedContainer` driven by `DraggableScrollableNotification`
- Glass material: `ClipRRect` + `BackdropFilter(sigmaX: 24, sigmaY: 24)` + colored overlay

---

## 3. Search Bar (Inside Sheet)

**Status**: `[TODO]`

Lives inside the bottom sheet as the default content. Visible at Mini snap.

### Layout

```
Row(
  children: [
    SearchIcon (18px, tertiary),
    Expanded(TextField(...)),
    MicrophoneIcon (20px, tertiary) OR ClearButton,
    UserAvatar (36px circle),
  ],
)
```

- Height: 50px
- Background: `--surface` with subtle border (`--glass-border`)
- Border radius: radius-2xl (24px) — pill/stadium shape
- Horizontal padding: 16px
- Gap between elements: 12px

### States

| State | Left icon | Right icons | Placeholder |
|-------|-----------|-------------|-------------|
| Idle | 🔍 (tertiary) | 🎤 + 👤 | Rotating suggestions |
| Focused (empty) | 🔍 (tertiary) | 🎤 + 👤 | Static "Search Obelisk..." |
| Typing | 🔍 (tertiary) | ✕ (clear) + 👤 | Hidden |
| Loading | ● (amber pulse) | ✕ + 👤 | Hidden |

### Rotating Placeholder

Cycle through these strings every 4 seconds with cross-fade (200ms):

```
"A quiet cafe near the river..."
"Hidden courtyards in Altstadt..."
"Best beer gardens nearby..."
"Street art in Glockenbachviertel..."
"Historic churches to explore..."
```

- Font: UI font, body (17px), --foreground-tertiary
- Only animates when idle (not focused, no text)

### User Avatar

- 36px circle, `radius-full`
- Shows default person silhouette icon on `--surface` background
- Future: Profile image when auth is added
- Tap: No action for now (future: open profile/settings)

### Microphone Icon

- 20px, `--foreground-tertiary`
- Decorative for now (future: voice search)
- Disappears when text is entered (replaced by clear button)

### Clear Button

- 18px × icon inside 28px touch area
- Animated entry: scale 0→1, quick spring (200ms)
- Animated exit: scale 1→0, quick spring (150ms)
- Tap: Clears text, returns focus to field, shows placeholder

### Loading Indicator

- 8px amber circle replacing search icon position
- Pulse animation: opacity 0.3→1.0→0.3, 2s cycle

### Search Trigger

- Debounce: 300ms after last keystroke
- Minimum query: 2 characters
- On submit (keyboard "Search" button): Immediate search
- On suggestion tap: Immediate search with suggestion text

### Autocomplete Dropdown

- Appears below search bar inside the sheet when user is typing (≥2 chars)
- Max 5 suggestions
- Each row height: 48px (meets 44px touch target)
- Row layout: `[● category dot (6px)] [name (subhead)] [category label (footnote, secondary)]`
- Background: Sheet glass (inherits from sheet)
- Dividers: 1px `--glass-border`, 16px left inset
- Staggered entry: 40ms delay per item
- Tap: Fills search bar with suggestion text, triggers search

### "Searching this area" Badge

- Small pill above results when viewport-based search is active
- Background: `--glass-thin`
- Text: "Searching this area", caption1 (12px), `--foreground-tertiary`
- Centered horizontally

---

## 4. Search Results List

**Status**: `[TODO]`

Replaces autocomplete when search completes. Shown inside the sheet at Half/Full snap.

### Result Row Layout

```
Row(
  children: [
    CategoryDot (6px, colored),
    SizedBox(width: 12),
    Column(
      crossAxisAlignment: start,
      children: [
        Text(name, style: display/subhead),
        Text("$category · $distance", style: footnote/secondary),
        if (teaser) Text(teaser, style: footnote/tertiary, maxLines: 1),
      ],
    ),
  ],
)
```

- Row height: Variable (56-72px depending on teaser)
- Padding: 16px horizontal, 12px vertical
- Dividers: 1px `--glass-border`, 56px left inset (after dot)
- Tap: Transition to POI Detail mode
- Tap feedback: Background color → `--accent-subtle` for 150ms

### Empty State

- Centered in sheet content area
- Icon: Magnifying glass with question mark, 40px, `--foreground-tertiary` at 40%
- Text: "No results found", subhead, `--foreground-secondary`
- Subtext: "Try a different search or explore the map", footnote, `--foreground-tertiary`

### Loading Skeleton

- 5 shimmer rows matching result layout
- Shimmer: Linear gradient sweep left→right, 2s cycle
- Colors: `--surface` → `--glass-bg` → `--surface`

### Entry Animation

- Staggered fade-in: opacity 0→1, 40ms delay per item, max 8 items
- Spring: gentle (stiffness 150, damping 28)

---

## 5. POI Card

**Status**: `[TODO]`

The main content when a POI is selected. Lives inside the bottom sheet.

### Content Sections (top to bottom)

Sections are laid out in a `CustomScrollView` with `SliverList`:

1. **Top Action Bar** — visible at Half + Full
2. **Centered Header** — always visible
3. **Action Buttons Row** — visible at Half + Full
4. **Info Metrics Row** — visible at Half + Full
5. **Media Carousel** — visible at Half + Full (or always if we want peek to show a compact version)
6. **Tab Bar** — visible at Half + Full
7. **Tab Content** — visible at Half + Full
8. **Bottom Toolbar** — visible at Half + Full

### Visibility by Snap

| Section | Peek (35%) | Half (55%) | Full (85%) |
|---------|-----------|-----------|-----------|
| Drag handle | ✓ | ✓ | ✓ |
| Top Action Bar (share/close) | ✓ (compact) | ✓ | ✓ |
| Centered Header | ✓ (title2 size) | ✓ (title1) | ✓ (title1) |
| Action Buttons | ✗ | ✓ | ✓ |
| Info Metrics | ✗ | ✓ | ✓ |
| Media Carousel | ✗ | ✓ | ✓ |
| Tab Bar | ✗ | ✓ | ✓ |
| Tab Content | ✗ | ✗ (partially) | ✓ |
| Bottom Toolbar | ✗ | ✓ | ✓ |

### Section-level visibility animation

- Hidden → Visible: `AnimatedOpacity` (0→1, 200ms) + `AnimatedSize` (height 0→auto, smooth spring)
- Use `SliverAnimatedOpacity` or wrap in `AnimatedCrossFade` for sliver context

---

## 5.1 Top Action Bar

**Status**: `[TODO]`

```
Row(
  mainAxisAlignment: spaceBetween,
  children: [
    ShareButton (icon-only, 44px tap area),
    CloseButton (× in dark circle, 44px tap area),
  ],
)
```

- Share icon: Square-with-arrow, 22px, `--foreground-secondary`
- Close: × icon (16px) inside 30px circle, `glass-floating` background
- Height: 44px
- Horizontal padding: 4px (buttons have internal padding)

### Share Behavior

1. Try `Share.share()` (Flutter share_plus package)
2. Fallback: Copy URL to clipboard, show SnackBar "Link copied"

### Close Behavior

- Transition sheet to Search mode (cross-fade, sheet → Mini)
- Clear selected POI from state

---

## 5.2 Centered Header

**Status**: `[TODO]`

```
Column(
  crossAxisAlignment: center,
  children: [
    Text(poiName, style: title1/title2, textAlign: center),
    if (secondaryName) Text(secondaryName, style: subhead/secondary),
    if (subcategories.isNotEmpty) Text(subcategories.join(" · "), style: footnote/secondary),
    Row(mainAxisAlignment: center, children: [
      CategoryDot(6px, color),
      SizedBox(width: 6),
      Text(category, style: caption1/tertiary),
    ]),
  ],
)
```

### Name Sizing

| Snap | Font size | Font token |
|------|-----------|-----------|
| Peek | 22px | title2 |
| Half/Full | 28px | title1 |

- Animate between sizes: Use `AnimatedDefaultTextStyle` or interpolate font size based on sheet position

### Secondary Name

- Source: `poi.extraTags["name:de"]` or `poi.extraTags["alt_name"]`
- Hidden if: Same as primary name, or null/empty
- Style: UI font, subhead (15px), `--foreground-secondary`

### Subcategories

- Source: `getSubcategories(poi)` — cuisine split + extraTags (shop, amenity, tourism, leisure)
- Max 3, joined by " · "
- Style: UI font, footnote (13px), `--foreground-secondary`

---

## 5.3 Action Buttons Row

**Status**: `[TODO]`

Three equal-width buttons in a row with 8px gap.

```
Row(
  children: [
    Expanded(ActionButton.navigate(distance: poi.distance)),
    SizedBox(width: 8),
    Expanded(ActionButton.call(phone: poi.phone)),
    SizedBox(width: 8),
    Expanded(ActionButton.website(url: poi.website)),
  ],
)
```

### Navigate Button (Primary CTA)

- Background: `--cta-blue`
- Icon: Compass/navigation, 20px, white
- Label: Formatted distance (e.g., "850 m") if available, otherwise "Navigate"
- Label color: White
- Tap: Open native maps app (`url_launcher` with `geo:` or Google Maps URL)

### Call Button

- Background: `glass-floating`
- Icon: Phone, 20px, `--foreground`
- Label: "Call", `--cta-blue`
- Disabled: 40% opacity if `poi.phone` is null
- Tap: Open `tel:${phone}` via `url_launcher`

### Website Button

- Background: `glass-floating`
- Icon: Globe, 20px, `--foreground`
- Label: "Website", `--cta-blue`
- Disabled: 40% opacity if `poi.website` is null
- Tap: Open URL via `url_launcher`

### Button Shared Properties

- Height: 56px
- Border radius: radius-md (12px)
- Layout: Column(icon, SizedBox(4), label)
- Tap animation: Scale 0.95, quick spring (150ms)
- Disabled: `IgnorePointer` + 40% opacity

---

## 5.4 Info Metrics Row

**Status**: `[TODO]`

Three equal columns showing key data points.

```
Row(
  children: [
    Expanded(MetricColumn(label: "Distance", value: "850 m")),
    Expanded(MetricColumn(label: "Category", value: "● Church")),
    Expanded(MetricColumn(label: "Good to know", value: "WiFi")),
  ],
)
```

### MetricColumn Layout

```
Column(
  crossAxisAlignment: center,
  children: [
    Text(label, style: caption1/tertiary/uppercase),
    SizedBox(height: 4),
    value widget (footnote, foreground),
  ],
)
```

- Top margin: 16px from action buttons
- Each column: Center-aligned text
- Label: caption1 (12px), `--foreground-tertiary`, uppercase, letter-spacing 0.05em
- Value: footnote (13px), `--foreground`
- Category value: Row with 6px colored dot + category name
- Missing value: Show "—" in tertiary color

---

## 5.5 Media Carousel

**Status**: `[TODO]`

Horizontal image carousel with optional Mapillary street view.

### Layout

- `PageView.builder` with `PageController(viewportFraction: 0.85)` for peek-next effect, OR full-width `PageView` — match Apple Maps (full-width with gap, showing next photo edge)
- Actually: Two photos side-by-side visible (each ~48% width with 8px gap), horizontally scrollable. This matches the Apple Maps screenshots.
- Height: Fixed by aspect ratio — 3:2 for expanded, 2:1 for compact
- Corner radius: radius-md (12px) on each photo
- Top margin: 16px from info metrics

### Photo Tile

```
Stack(
  children: [
    ClipRRect(borderRadius: 12, child: Image(...)),
    Positioned(bottom: 8, right: 8,
      child: AttributionLabel(source)),
  ],
)
```

### Attribution Watermark

- Position: Bottom-right of each photo
- Text: Source name ("Wikimedia", "Mapillary", "Commons")
- Style: caption2 (11px), white, UI font
- Background: Subtle dark gradient at bottom of image (transparent → rgba(0,0,0,0.4))

### Dot Indicators

- Below carousel, centered
- Dot size: 6px
- Active: `--foreground`
- Inactive: `--foreground-tertiary` at 40%
- Spacing: 8px between dots
- Tap on dot: Animate to that page

### Fullscreen Mode

- Tap photo → Fullscreen overlay (`Navigator.push` with `PageRouteBuilder`, fade transition)
- Dark background (black)
- Top bar: POI name (left), "2 / 5" counter (center), close button (right)
- Photos: Full-width, aspect-fit, swipeable
- Bottom bar: Source label + dot indicators
- Pinch to zoom on individual photos
- Swipe down to dismiss (drag → fade out when velocity > threshold)

### Street View Slide

- Last slide in carousel (if `mapillaryId` available)
- Lazy load: Only initialize Mapillary viewer when this slide comes into view
- "Explore" pill button overlay: Toggles touch interaction on the street view
- Label "Street View" at bottom-left

### On-Demand Enrichment

- If POI has `poiId` (database POI) but no images:
  1. Show shimmer placeholder
  2. POST `/api/poi/enrich-media` with `poiId`
  3. On success: Update images + mapillary data, animate in

### Empty State

- Single placeholder tile matching carousel dimensions
- Background: Category-colored gradient (linear, 15% opacity)
- Shimmer animation overlay

---

## 5.6 Tab Bar

**Status**: `[TODO]`

Three tabs: Remark, Capsules, Details.

### Layout

```
Row(
  children: [
    TabButton("Remark", isActive: activeTab == 0),
    SizedBox(width: 24),
    TabButton("Capsules", isActive: activeTab == 1),
    SizedBox(width: 24),
    TabButton("Details", isActive: activeTab == 2),
  ],
)
```

### Tab Button

```
Column(
  children: [
    Text(label, style: footnote, weight: active ? 500 : 400),
    SizedBox(height: 8),
    if (active) AccentUnderline(width: textWidth, height: 2px),
  ],
)
```

- Active: weight 500, `--foreground`, accent underline
- Inactive: weight 400, `--foreground-secondary`
- Underline: 2px height, radius-full, `--accent` color
- **Underline animation**: Use `AnimatedPositioned` or custom `TabIndicator` that lerps position based on `TabController.animation.value`
- Bottom border: 1px `--glass-border` on the tab bar container
- Top margin: 20px from carousel

### Tab Content

- `TabBarView` with `PageController` for swipe between tabs
- Horizontal swipe threshold: 50px offset OR 200px/s velocity
- Tab-swipe spring: stiffness 300, damping 34
- Content padding: 16px top, 0 horizontal (inherits sheet padding)

---

## 5.7 Remark Tab

**Status**: `[TODO]`

Styled as an "About" section matching Apple Maps.

### Layout (top to bottom)

1. **Section header**: "About" — Display font, title3 (20px)
2. **Remark title**: Accent bar (2px) + Display font, title3 (20px)
3. **Remark body**: Reading font, body (17px), truncated with "...MORE"
4. **Wikipedia link**: "More on Wikipedia" if available
5. **Local tip**: Accent-bordered callout
6. **Regenerate button**: Glass pill

### "...MORE" Text Truncation

- Default: Show first ~4 lines of body text
- Truncated indicator: "...MORE" at end of last visible line
- "MORE": Bold, `--foreground`, tappable
- Tap "MORE": `AnimatedSize` expands to full text (smooth spring, 300ms)
- Once expanded, "MORE" disappears — no collapse

### Wikipedia Link

- Shown if `poi.wikipediaUrl` is not null
- Text: "More on Wikipedia"
- Style: footnote (13px), `--cta-blue`, UI font
- Top margin: 8px from body text
- Tap: Open URL externally via `url_launcher`

### Remark Title with Accent Bar

```
Row(
  children: [
    Container(width: 2, color: accent, height: matches text height),
    SizedBox(width: 12),
    Expanded(Text(title, style: display/title3)),
  ],
)
```

### Local Tip

```
Container(
  decoration: BoxDecoration(
    border: Border(left: BorderSide(width: 3, color: accent)),
  ),
  padding: EdgeInsets.only(left: 16, top: 12, bottom: 12),
  child: Column(
    children: [
      Row([ObeliskIcon(16px, accent), "From a local"]),
      SizedBox(height: 8),
      Text(localTip, style: reading/subhead/secondary),
    ],
  ),
)
```

### Regenerate Button

- Glass-floating pill: `Container(glass-floating, radius-full)`
- Icon: Refresh arrow, 12px
- Label: "Regenerate" or countdown "12s"
- Disabled: During regeneration or cooldown (40% opacity)
- Cooldown: 20 seconds after last generation
- Tap animation: scale 0.95

### Loading State

- Obelisk SVG silhouette, 48px, pulsing (scale 0.9→1.1, opacity 0.4→1.0, 2s)
- Below: Rotating phrase text, italic Reading font, footnote
- Phrases cycle every 4s: "Just a moment…", "Looking into this place…", "Gathering stories…", "Piecing together…", "Crafting your remark…"
- Centered in available space

### Empty State

- "No remark yet for this place"
- Centered, subhead, `--foreground-secondary`

### Markdown Rendering

- Use `flutter_markdown` package
- Allowed elements: p, strong, em, a, ul, ol, li (strip everything else)
- Links: Validate URL, open externally, style in `--accent` color
- Paragraph spacing: 12px (mb-3 equivalent)

---

## 5.8 Capsules Tab

**Status**: `[TODO]`

### Empty State

- Icon: Capsule outline SVG, 40px, `--accent` at 60%
- Text: "No capsules here yet", footnote, `--foreground-secondary`
- Button: "Leave the first one" — pill, `--accent-subtle` bg, `--accent` text
- All centered vertically

### Create Form (tapping "Leave the first one")

- Format pills row: Text, Voice, Photo, Video — only Text is active (highlighted with `--accent-subtle` bg)
- Textarea: 4 rows, `--surface` bg, `--glass-border` border, radius-xl, Reading font
- Submit button: "Leave capsule" pill, `--accent` bg, white text
- Tap submit: Show "Coming soon" tooltip (2s auto-dismiss)

---

## 5.9 Details Tab

**Status**: `[TODO]`

### Detail Rows

List of icon + label rows:

```
Row(
  children: [
    Icon(16px, tertiary),
    SizedBox(width: 12),
    Expanded(Text(value, style: footnote, color: isLink ? accent : secondary)),
  ],
)
```

Rows (in order, each only if data exists):
1. **Address**: Pin icon, plain text
2. **Opening hours**: Clock icon, plain text
3. **Phone**: Phone icon, `--accent` colored, tappable → `tel:` link
4. **Website**: Globe icon, `--accent` colored, tappable → external URL (show truncated domain)

- Row height: Min 44px (touch target)
- Vertical spacing: 4px between rows

### Amenities Section

- Header: "Good to know", caption1, tertiary, uppercase
- Pills: Wrap layout, each pill = `Container(--surface bg, --glass-border border, radius-full)`
- Pill text: caption1 (12px), `--foreground-secondary`
- Content: WiFi / Outdoor seating / cuisine

### Report Button

- Positioned at bottom-right of details tab
- Glass-floating pill, caption1, flag icon, `--foreground-tertiary` text
- Tap: "Coming soon" tooltip (2s)

### Empty State

- "No details available", footnote, `--foreground-secondary`, centered

---

## 5.10 Bottom Toolbar

**Status**: `[TODO]`

Persistent bar at the bottom of POI card content. 3 evenly-spaced icon buttons.

```
Row(
  mainAxisAlignment: spaceEvenly,
  children: [
    ToolbarButton(icon: Icons.add_circle_outline, label: "Add"),
    ToolbarButton(icon: Icons.star_outline, label: "Favorite"),
    ToolbarButton(icon: Icons.more_horiz, label: "More"),
  ],
)
```

- Height: 48px
- Top border: 1px `--glass-border`
- Icon size: 24px, `--foreground`
- Touch target: 44px × 44px each
- All three: "Coming soon" tooltip on tap (2s auto-dismiss)
- Favorite: Future — toggle between outline and filled (with `--accent`)

---

## 6. Map View

**Status**: `[TODO]`

Full-screen Mapbox map as the background layer.

### Configuration

- Style: Dark mode = `mapbox://styles/mapbox/dark-v11`, Light = `mapbox://styles/mapbox/light-v11`
- Auto-detect: `MediaQuery.platformBrightnessOf(context)`
- Initial center: Munich (48.1351, 11.5820)
- Initial zoom: 14
- Token: `NEXT_PUBLIC_MAPBOX_TOKEN` from environment

### Markers

**POI markers**: Simple filled circles (see Map Markers spec below).
**User location**: Custom 3-layer marker (see Map Markers spec below).
**Search pin**: Teardrop marker at selected result location.

### Camera

- On search result tap: Animate to POI location (1800ms ease-in-out, zoom 16)
- On user location first acquired: Animate to user position (1800ms, zoom 15)
- Respect sheet height: Map center offset to account for bottom sheet (shift center upward by sheet peek height / 2)

### POI Click Detection

- Tap on map: Query rendered features for POI layers
- If POI found: POST `/api/poi/lookup` with name + coordinates → transition to POI mode
- If no POI: Deselect current POI if any

### Viewport Tracking

- Debounce: 300ms after map move ends
- Track: center lat/lon, zoom, visible bounds
- Used for: Viewport-based search, nearby POI loading

---

## 7. Map Controls (Right-Side FAB Stack)

**Status**: `[TODO]`

### Layout

Vertical `Column` of 3 circular buttons, 12px gap.

```
Column(
  children: [
    FABButton("3D"),      // or "2D" text
    SizedBox(height: 12),
    FABButton(layersIcon),
    SizedBox(height: 12),
    FABButton(locationArrowIcon),
  ],
)
```

### Position

- Right edge: 20px from right
- Vertically: Centered between safe area top and sheet top edge
- Adjust when sheet expands (animate position up)

### 3D Toggle

- Circle: 44px, glass-floating
- Content: "3D" or "2D" text, UI font, footnote, bold, `--foreground`
- Tap: Toggle map pitch (0° ↔ 45°)
- Animate pitch change: 500ms ease

### Map Layers

- Circle: 44px, glass-floating
- Content: Book/pages icon, 18px, `--foreground`
- Tap: "Coming soon" tooltip (future: layer picker)

### Locate

- Circle: 44px, glass-floating
- Content: Location arrow icon, 18px, `--foreground`
- No GPS: 50% opacity, tap shows "Location unavailable" tooltip
- Has GPS: Tap → animate map to user location (1800ms)
- If map rotated: Show compass needle icon instead of arrow

### Tap Animation

- Scale: 1.0 → 0.95 → 1.0, quick spring

---

## 8. Look Around Button (Bottom-Left)

**Status**: `[TODO]`

### Layout

- Single circular button: 44px, glass-floating
- Icon: Binoculars, 20px, `--foreground`
- Position: Bottom-left, 20px from edges, above sheet peek height

### Behavior

- Tap: Navigate to street view for nearest Mapillary image to current map center
- No street view available: Show "No street view here" tooltip (2s)
- Tap animation: scale 0.95, quick spring

---

## 9. Map Markers

**Status**: `[TODO]`

### POI Pin

- Shape: Filled circle
- Size: 10px default, 14px when selected
- Color: From `CATEGORY_COLORS` map by category slug
- Shadow: shadow-pin
- Tap: Trigger POI selection flow

### User Location Marker

Three concentric layers:

```
Stack(
  alignment: center,
  children: [
    // Outer pulse ring
    AnimatedBuilder(
      animation: pulseController (3s, infinite),
      builder: Container(32px, location@30%, scale 1→2.2, opacity 0.4→0),
    ),
    // Middle ring
    Container(20px, border: 2px location@30%),
    // Inner dot
    Container(12px, solid location color),
    // Optional heading arrow
    if (heading != null) Transform.rotate(angle: heading, child: Triangle),
  ],
)
```

- Pulse: 3s infinite, scale 1→2.2, opacity 0.4→0
- Heading arrow: Small triangle (10px) pointing north, rotated by `heading` degrees

### Search Pin

- Shape: Teardrop (28px)
- Implementation: Custom `CustomPainter` drawing inverted teardrop
- Color: `--accent`
- Center: 10px white circle
- Entry animation: Pin-drop spring (stiffness 300, damping 20) — scale from 0 with bounce

---

## 10. Remark Notification (Geofence Toast)

**Status**: `[TODO]`

### Trigger Logic

- Three distance rings: preload (500m), queue (100m), trigger (50m)
- Cooldown: 2 min between notifications
- Session cap: Max 5 notifications per 30 min
- Per-remark: One trigger per session

### Layout

```
Container(
  decoration: glass-liquid + 3px amber left border,
  borderRadius: radius-2xl,
  child: Row(
    children: [
      AmberDot(8px, pulsing),
      SizedBox(width: 12),
      Column(
        children: [
          Text(poiName, style: display/subhead),
          Text(teaser, style: reading/footnote/secondary, maxLines: 2),
        ],
      ),
      DismissButton(×, 44px),
    ],
  ),
)
```

### Position

- Above sheet top edge, 16px margin horizontal
- z-order: Above map controls, below error toast

### Animations

- Entry: Slide up from y:80, smooth spring (stiffness 200, damping 30)
- Exit: Slide down to y:80, snappy spring (stiffness 400, damping 38)

### Interactions

- Tap notification body: Open POI in sheet (search → POI mode transition)
- Tap ×: Dismiss, mark as dismissed for this session

---

## 11. Error Toast

**Status**: `[TODO]`

### Layout

- Glass-floating, radius-2xl, 3px `--error` left border
- Row: Error icon (16px, `--error`) + message text + dismiss button + "Report" button
- Auto-dismiss: 6s timer

### Position

- Above sheet, 12px horizontal margins, z-60

### Animations

- Same as notification: Slide up, smooth spring

---

## 12. Geolocation

**Status**: `[TODO]`

### Behavior

- Request permission on first launch (or when user taps Locate button)
- Fallback: Munich center (48.1351, 11.5820) if no GPS
- Watch position: High accuracy, 10s max age, 15s timeout
- Track: lat, lon, heading, accuracy
- Permission denied: Show persistent banner or note in Locate button

---

## 13. State Architecture

**Status**: `[TODO]`

All state managed via Riverpod providers.

### Provider Hierarchy

```
// Location
geolocationProvider          → AsyncNotifier<GeoLocation?>
locationStreamProvider       → StreamProvider<GeoLocation>

// Map
mapViewportProvider          → StateNotifier<MapViewport>
mapPitchProvider             → StateProvider<double> (0 or 45)

// Sheet
sheetModeProvider            → StateNotifier<SheetMode> (search | results | poi)
selectedPoiProvider          → StateNotifier<ExternalPOI?>
selectedRemarkProvider       → StateNotifier<RemarkWithPoi?>

// Search
searchQueryProvider          → StateProvider<String>
searchResultsProvider        → AsyncNotifier<List<SearchResult>>
autocompleteSuggestionsProvider → AsyncNotifier<List<Suggestion>>

// Remarks
nearbyRemarksProvider        → AsyncNotifier<List<RemarkWithPoi>>
remarkGenerationProvider     → StateNotifier<GenerationState>
geofenceProvider             → StateNotifier<GeofenceState>
```

### SheetMode Enum

```dart
enum SheetMode { search, results, poi }
```

### GenerationState

```dart
class GenerationState {
  final String? generatingPoiId;
  final bool isRegenerating;
  final int cooldownRemaining; // seconds
}
```

---

## 14. API Client

**Status**: `[TODO]`

### Base Configuration

- Base URL: Configurable via environment (`API_BASE_URL`), default `http://localhost:3000`
- HTTP client: `dio` package
- Timeout: 15s connect, 30s receive
- JSON serialization: `freezed` + `json_serializable`
- Error handling: Map HTTP status codes to typed exceptions

### Endpoints (mapping to existing Next.js backend)

```dart
class ObeliskApi {
  Future<NearbyPoisResponse> getNearbyPois(double lat, double lon, {int radius = 1000});
  Future<PoiLookupResponse> lookupPoi(String name, double lat, double lon, {String? category});
  Future<EnrichMediaResponse> enrichMedia(String poiId);
  Future<NearbyRemarksResponse> getNearbyRemarks(double lat, double lon, {int radius = 5000});
  Future<GenerateRemarkResponse> generateRemarkForPoi(ExternalPOI poi);
  Future<RegenerateRemarkResponse> regenerateRemark(String remarkId);
  Future<SearchResponse> search(String query, double lat, double lon, {int radius, int limit, MapViewport? viewport});
  Future<AutocompleteResponse> autocomplete(String query, double lat, double lon);
}
```

### Error Types

```dart
sealed class ApiError {
  factory ApiError.validation(Map<String, List<String>> fieldErrors);
  factory ApiError.rateLimit(int retryAfterSeconds);
  factory ApiError.notFound(String message);
  factory ApiError.serverError(String message);
  factory ApiError.network(String message);
}
```

---

## 15. Theme System

**Status**: `[TODO]`

### ObeliskTheme (ThemeExtension)

```dart
class ObeliskTheme extends ThemeExtension<ObeliskTheme> {
  // Colors
  final Color foreground;
  final Color foregroundSecondary;
  final Color foregroundTertiary;
  final Color background;
  final Color surface;
  final Color elevated;
  final Color accent;
  final Color accentSubtle;
  final Color ctaBlue;
  final Color ctaBlueSubtle;
  final Color locationColor;
  final Color errorColor;

  // Glass
  final Color glassBg;
  final Color glassBgThin;
  final Color glassBgThick;
  final Color glassBgSheet;
  final Color glassBgFloating;
  final Color glassBorder;
  final Color glassBorderStrong;

  // Category colors
  final Map<String, Color> categoryColors;

  // Shadows
  final List<BoxShadow> shadowSm;
  final List<BoxShadow> shadowMd;
  final List<BoxShadow> shadowLg;
  final List<BoxShadow> shadowFloat;
  final List<BoxShadow> shadowSheet;
  final List<BoxShadow> shadowPin;

  // Typography (TextStyles pre-configured)
  final TextStyle displayLargeTitle;
  final TextStyle displayTitle1;
  final TextStyle displayTitle2;
  final TextStyle displayTitle3;
  final TextStyle uiBody;
  final TextStyle uiSubhead;
  final TextStyle uiFootnote;
  final TextStyle uiCaption1;
  final TextStyle uiCaption2;
  final TextStyle readingBody;
  final TextStyle readingSubhead;

  // Spacing
  final double spaceXs;  // 4
  final double spaceSm;  // 8
  final double spaceMd;  // 12
  final double spaceLg;  // 16
  final double spaceXl;  // 20
  final double space2xl; // 24
  final double space3xl; // 32

  // Radii
  final double radiusSm;   // 8
  final double radiusMd;   // 12
  final double radiusLg;   // 16
  final double radiusXl;   // 20
  final double radius2xl;  // 24
  final double radius3xl;  // 32
}
```

Provide `ObeliskTheme.light()` and `ObeliskTheme.dark()` factory constructors.

---

## 16. Fonts

**Status**: `[TODO]`

### Loading

Add to `pubspec.yaml` under `fonts:`:

```yaml
fonts:
  - family: InstrumentSerif
    fonts:
      - asset: assets/fonts/InstrumentSerif-Regular.ttf
      - asset: assets/fonts/InstrumentSerif-Italic.ttf
        style: italic
  - family: Sora
    fonts:
      - asset: assets/fonts/Sora-Light.ttf
        weight: 300
      - asset: assets/fonts/Sora-Regular.ttf
        weight: 400
      - asset: assets/fonts/Sora-Medium.ttf
        weight: 500
      - asset: assets/fonts/Sora-SemiBold.ttf
        weight: 600
  - family: SourceSerif4
    fonts:
      - asset: assets/fonts/SourceSerif4-Regular.ttf
      - asset: assets/fonts/SourceSerif4-Italic.ttf
        style: italic
      - asset: assets/fonts/SourceSerif4-SemiBold.ttf
        weight: 600
```

Download from Google Fonts and place in `assets/fonts/`.

---

## 17. Animations Helper

**Status**: `[TODO]`

Create `lib/ui/animations.dart`:

```dart
class ObeliskSprings {
  static SpringDescription snappy = SpringDescription(mass: 1, stiffness: 400, damping: 38);
  static SpringDescription smooth = SpringDescription(mass: 1, stiffness: 200, damping: 30);
  static SpringDescription gentle = SpringDescription(mass: 1, stiffness: 150, damping: 28);
  static SpringDescription liquid = SpringDescription(mass: 1.1, stiffness: 180, damping: 28);
  static SpringDescription quick  = SpringDescription(mass: 1, stiffness: 500, damping: 40);
  static SpringDescription floatingEntry = SpringDescription(mass: 0.8, stiffness: 250, damping: 32);
  static SpringDescription tabSwipe = SpringDescription(mass: 1, stiffness: 300, damping: 34);
  static SpringDescription pinDrop = SpringDescription(mass: 1, stiffness: 300, damping: 20);
}
```

Provide helper to create `SpringSimulation` from these for `AnimationController.animateWith()`.
