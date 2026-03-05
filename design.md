# Obelisk Design System

Contextual discovery platform for Munich. Apple Maps-inspired progressive-disclosure UI with Obelisk's warm identity: amber accents, serif display typography, AI-generated storytelling.

---

## 1. Design Philosophy

- **Always-visible sheet**: The bottom sheet is always on screen. Default state shows search bar inside the sheet. It never fully closes — it transitions between search mode and POI detail mode. Map stays maximally visible.
- **Progressive disclosure**: Peek → half → full sheet reveals content gradually. Each level adds information density.
- **44pt minimum touch targets**: Every interactive element meets this threshold — buttons, pills, list items, map controls.
- **Translucent materials**: Frosted-glass (vibrancy) surfaces create depth without visual clutter. Map content bleeds through with a strong tint.
- **Typography hierarchy**: Three-tier font system (display / UI / reading) makes scanning effortless at a glance.
- **Semantic color**: Category colors on POI icons, amber for brand identity, system blue for navigation CTAs.
- **Information density management**: Pack detail (directions, photos, remarks) behind progressive disclosure. Every element earns its space.

---

## 2. Color System

### 2.1 Core Palette

```
Token                    Light           Dark            Usage
─────────────────────────────────────────────────────────────────
--foreground             #1D1D1F         #F5F5F7         Primary text, titles
--foreground-secondary   #6E6E73         #A1A1A6         Subtitles, metadata
--foreground-tertiary    #86868B         #6E6E73         Disabled, de-emphasized
--background             #FFFFFF         #0A0A0A         App background
--surface                #F5F5F7         #141414         Card backgrounds
--elevated               #FFFFFF         #1C1C1E         Elevated containers
```

### 2.2 Brand & Action Colors

```
Token                    Light           Dark            Usage
─────────────────────────────────────────────────────────────────
--accent (amber)         #C49A6C         #D4AA7C         Brand accent, obelisk icon, tab underline, local tip border
--accent-subtle          rgba(C49A6C,12%)rgba(D4AA7C,12%)Accent backgrounds, highlight fills
--cta-blue               #007AFF         #0A84FF         Primary CTA (Navigate/Directions button)
--cta-blue-subtle        rgba(007AFF,12%)rgba(0A84FF,15%)Secondary blue fills
--location               #3478F6         #5E9EFF         User location dot, heading arrow
--error                  #E5484D         #E54D4D         Error states, report indicators
```

### 2.3 Category Colors

Five muted semantic groups for POI classification:

```
Group        Hex       Categories
──────────────────────────────────────────────
Heritage     #8B8680   history, architecture, culture, education
Gastronomy   #A89080   food, nightlife, shopping
Nature       #7A8B7A   nature, views, sports, health
Discovery    #C49A6C   art, hidden
Utility      #8890A0   transport, services
```

### 2.4 Glass Materials

Translucent surfaces with backdrop blur and saturation boost. All include `saturate(150%)` and `1px solid` border.

```
Material       Light bg            Dark bg              Blur    Border opacity   Usage
────────────────────────────────────────────────────────────────────────────────────────
glass          white 70%           #141414 72%          16px    6%               Standard cards
glass-thin     white 50%           #141414 50%          16px    6%               Subtle overlays
glass-thick    white 82%           #141414 82%          32px    6%               Dense panels, autocomplete
glass-liquid   white 75%           #141414 78%          24px    6%               Bottom sheet surface
glass-floating white 80%           #1C1C1E 82%          16px    6%               FABs, action buttons, pills
```

### 2.5 Border Colors

```
Token                  Light              Dark
──────────────────────────────────────────────────
--glass-border         rgba(0,0,0,0.06)   rgba(255,255,255,0.06)
--glass-border-strong  rgba(0,0,0,0.12)   rgba(255,255,255,0.12)
```

---

## 3. Typography

### 3.1 Font Stack

```
Role       Font               Fallback              Usage
──────────────────────────────────────────────────────────────
Display    Instrument Serif   Georgia, serif         POI names, section headings
UI         Sora               system-ui, sans-serif  Buttons, labels, metadata, nav
Reading    Source Serif 4     Georgia, serif         Remark body, long-form content
```

### 3.2 Type Scale

```
Token           Size    Usage
──────────────────────────────────────────────
large-title     34px    Reserved for hero moments
title1          28px    POI name (expanded sheet)
title2          22px    POI name (collapsed/peek sheet)
title3          20px    Section headings ("About", "Details")
body            17px    Body text, remark content, search input
subhead         15px    Subtitles, secondary names
footnote        13px    Metadata, button labels, info metrics
caption1        12px    Section sublabels, pill text
caption2        11px    Attribution, source watermarks
```

### 3.3 Typography Rules

**POI name (expanded)**: Display font, title1 (28px), --foreground, center-aligned
**POI name (peek)**: Display font, title2 (22px), --foreground, center-aligned
**Secondary name**: UI font, subhead (15px), --foreground-secondary, center-aligned (e.g. "Der Münchner Dom")
**Category/subtitle**: UI font, footnote (13px), --foreground-tertiary, center-aligned
**Section headings**: Display font, title3 (20px), --foreground, left-aligned
**Button labels**: UI font, footnote (13px), weight 500
**Body text**: Reading font, body (17px), line-height 1.7
**Metadata labels**: UI font, caption1 (12px), --foreground-tertiary, uppercase, letter-spacing 0.05em
**Info metric values**: UI font, footnote (13px), --foreground
**Attribution watermark**: UI font, caption2 (11px), white, on dark gradient overlay

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```
Name    Value    Usage
────────────────────────────────────────
xs      4px      Tight gaps, icon padding
sm      8px      Compact spacing, between pills
md      12px     Standard gap between elements
lg      16px     Section padding, card padding
xl      20px     Between major sections
2xl     24px     Sheet horizontal padding
3xl     32px     Large separations
```

### 4.2 Border Radius

```
Token      Value    Usage
──────────────────────────────────────────
radius-sm  8px      Small pills, input fields
radius-md  12px     Action buttons, photo thumbnails, cards
radius-lg  16px     Large cards
radius-xl  20px     Sheet at mid snap
radius-2xl 24px     Prominent containers, search bar
radius-3xl 32px     Sheet at floating snap (peek)
radius-full 9999px  Circular buttons (FABs), pill badges, avatars
```

### 4.3 Layout Constants

```
Constant                     Value
─────────────────────────────────────────
Sheet max-width              540px (centered on tablet/desktop)
Sheet horizontal padding     20px
Minimum touch target         44px × 44px
FAB button diameter          44px
Action button height         56px
Photo carousel aspect        3:2 (expanded), 2:1 (compact/peek)
Search bar height            50px
Drag handle width            36px
Drag handle height           5px
User avatar size             36px diameter
Bottom toolbar height        48px
```

---

## 5. Shadows

Depth hierarchy for elevation levels.

```
Token          Value                                          Usage
──────────────────────────────────────────────────────────────────────
shadow-sm      0 1px 3px rgba(0,0,0,0.04)                    Subtle cards
shadow-md      0 4px 12px rgba(0,0,0,0.06)                   Standard elevation
shadow-lg      0 8px 24px rgba(0,0,0,0.08)                   Elevated panels
shadow-xl      0 12px 32px rgba(0,0,0,0.12)                  High emphasis
shadow-float   0 8px 32px rgba(0,0,0,0.10) +                 FABs, floating elements
               0 2px 8px rgba(0,0,0,0.04)
shadow-sheet   0 -8px 32px rgba(0,0,0,0.08) +                Bottom sheet
               0 -2px 8px rgba(0,0,0,0.04)
shadow-pin     0 2px 8px rgba(0,0,0,0.12)                    Map pins
```

Dark mode: shadow-float and shadow-sheet use 4× opacity (0.40 / 0.20 instead of 0.10 / 0.04).

---

## 6. Animation System

### 6.1 Spring Configurations

All motion uses spring physics (no duration-based easing). Higher damping = weighted, non-bouncy feel matching iOS Liquid Glass.

```
Name            Stiffness  Damping  Mass   Usage
──────────────────────────────────────────────────────────
snappy          400        38       1.0    Buttons, quick feedback
smooth          200        30       1.0    Content transitions, general movement
gentle          150        28       1.0    Entries, reveals, fade-ins
liquid          180        28       1.1    Sheet transitions, glass morphing
quick           500        40       1.0    Micro-interactions, immediate response
floating-entry  250        32       0.8    Floating buttons entering view
tab-swipe       300        34       1.0    Tab content horizontal transitions
pin-drop        300        20       1.0    Map pin drop (low damping = bounce)
```

### 6.2 Motion Patterns

**Sheet expand**: Height + corner radius + bottom gap morph simultaneously, liquid spring
**Content crossfade**: When sheet switches mode (search → POI), content cross-fades (150ms out, 150ms in)
**Content reveal**: Staggered fade-in (opacity 0→1, y 8→0), gentle spring with cascading delays (0.04s per item, max 8 items)
**Tab switch**: Horizontal slide (x: ±200px), tab-swipe spring, AnimatePresence wait mode
**Button press**: Scale to 0.95, quick spring
**Button hover**: Scale to 1.005, snappy spring
**Pin drop**: Scale spring with low damping (visible bounce)
**Notification enter**: Slide up from y:80, smooth spring
**Notification exit**: Slide down to y:80, snappy spring
**Placeholder rotation**: 4-second interval, cross-fade between suggestion strings
**Chevron hint**: ±12° rotation on drag handle bars, smooth spring, auto-resets after 800ms
**Text expand ("MORE")**: Height auto-animation (smooth spring) when truncated text is expanded

---

## 7. Component Specifications

### 7.1 Bottom Sheet (Always Visible)

The bottom sheet is **always on screen** — it never closes. It acts as the primary UI container that transitions between modes: search (default), search results, and POI detail.

**Modes**:

| Mode | Default snap | Content |
|------|-------------|---------|
| Search (default) | Mini (search bar height ~100px) | Search bar + optional suggestions |
| Search results | Half (55%) | Search results list |
| POI detail | Peek (35%) | POI card |

**Snap points (POI mode)**: 3 positions at 35%, 55%, 85% of viewport height.

```
Snap     Height   Bottom gap   Corner radius   Shadow
──────────────────────────────────────────────────────────
Peek     35%      12px         32px (floating)  shadow-sm
Half     55%      4px          20px (mid)       shadow-md
Full     85%      0px          12px (flush)     shadow-lg
```

**Search mode**: Sheet sits at a minimal peek (~100px) showing just the drag handle + search bar. Swiping up or tapping the search bar expands to show autocomplete/results.

**Drag handle**: Two bars (16px wide × 3px tall each) with gradient fill (rgba(120,120,128,0.4) → 0.3), centered at top. Chevron hint animation: bars rotate ±12° when not at max snap, auto-resets after 800ms.

**Overlay**: Fixed full-screen behind sheet. Background: black, opacity = 0.04 + (elevation_level × 0.04). Pointer-events: none (map remains interactive). Only visible at Half and Full snaps; invisible at Peek/Mini.

**Drag behavior**: Y-axis only, elastic dampening 0.05. Velocity > 500 or offset > 100 = snap to next/prev. Downward drag at lowest snap returns to search mode (not close). Otherwise snap to nearest point by position.

**Content area**: Scrollable, respects safe area (pb-safe), horizontal padding 20px.

**Mode transitions**: When switching between search and POI modes, content cross-fades (150ms opacity out → swap content → 150ms opacity in) while sheet animates to the new snap height.

### 7.2 Search Bar (Inside Bottom Sheet)

The search bar lives **inside the bottom sheet**, not floating above the map. In the default state, the sheet shows at minimal height with just the search bar visible.

**Default (mini sheet) layout**:

```
┌────────────────────────────────────────────────┐
│  ── drag handle ──                             │
│                                                │
│  🔍  Search Obelisk...          🎤    👤      │
│                                                │
└────────────────────────────────────────────────┘
  glass-liquid sheet, search bar inside
```

- **Search icon**: Magnifying glass, 18px, --foreground-tertiary, left side
- **Input field**: UI font, body (17px), --foreground, placeholder in --foreground-tertiary
- **Placeholder**: Rotating suggestions (4s interval), cross-fade: "A quiet cafe near the river...", "Hidden courtyards in Altstadt...", "Best beer gardens nearby...", "Street art in Glockenbachviertel..."
- **Microphone icon**: 20px, --foreground-tertiary, right side (voice search — initially decorative, future feature)
- **User avatar**: 36px circular photo, radius-full, right-most element. Shows user profile image if authenticated, otherwise a default person silhouette icon on --surface background
- **Clear button**: Replaces microphone icon when text is entered. Animated spring entry/exit (quick spring)
- **Loading indicator**: Pulsing amber dot (8px) replaces search icon during search

**Focused / Active state**: Tapping the search bar expands the sheet to Half snap. Autocomplete suggestions appear below.

**Autocomplete dropdown**: Below search input (inside the sheet), glass-thick background, max 5 suggestions. Each row: category color dot (6px) + name (UI font, subhead) + category label (footnote, --foreground-secondary). Tapping a suggestion triggers search.

**Search results**: When search completes, results list replaces autocomplete. Each result row:
- Category dot (colored by CATEGORY_COLORS)
- Name: Display font, subhead (15px)
- Subtitle: category + distance (footnote, --foreground-secondary)
- Optional teaser: Reading font, footnote (13px), --foreground-tertiary, 1 line
- Staggered fade-in animation (0.04s delay per item, max 8)

**"Searching this area" badge**: When viewport-based search active, show as a small pill above results (caption1, --foreground-tertiary, glass-thin background).

### 7.3 POI Card

The main content inside the bottom sheet when a POI is selected. Apple Maps-inspired layout with centered header, action buttons, info metrics, and tab system.

#### Structure (top to bottom):

**A. Top Action Bar** — hidden at peek

```
[Share icon]                              [× Close]
```

- Share: 44px touch target, square-with-arrow icon, --foreground-secondary
- Close: 44px touch target, × icon inside 30px dark circle (glass-floating). Closes POI → returns sheet to search mode.

**B. Centered Header** — always visible (scales at peek)

```
              The Munich Cathedral           ← Display font, title1/title2, --foreground
                Der Münchner Dom             ← UI font, subhead, --foreground-secondary (secondary/local name)
              Italian · Bavarian             ← UI font, footnote, --foreground-secondary (subcategories)
              ● Cathedral                    ← UI font, caption1, --foreground-tertiary + category color dot
```

- **Name**: Display font, title1 (28px) when expanded, title2 (22px) at peek. Center-aligned.
- **Secondary name**: Local/German name if available from `extraTags.name:de` or `extraTags.alt_name`. UI font, subhead (15px), --foreground-secondary. Hidden if same as primary name or unavailable.
- **Subcategories**: Extracted from cuisine + extraTags (shop, amenity, tourism, leisure), max 3, joined by " · ". UI font, footnote (13px), --foreground-secondary.
- **Category**: Broad category with colored dot (6px circle). UI font, caption1 (12px), --foreground-tertiary.

**C. Action Buttons Row** — hidden at peek

Three equal-width buttons in a 3-column grid, 8px gap:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     🧭       │  │     📞       │  │     🌐       │
│   850 m      │  │    Call      │  │   Website    │
└──────────────┘  └──────────────┘  └──────────────┘
  CTA blue fill     glass-floating    glass-floating
  white text        blue text label   blue text label
```

- **Navigate**: --cta-blue background, white icon (20px, compass/pin) + white label. Shows formatted distance if available, otherwise "Navigate". Tapping opens native maps app with destination coordinates.
- **Call**: glass-floating background, phone icon (20px, --foreground), --cta-blue label text. Disabled (40% opacity) if no phone number. Tapping opens `tel:` link.
- **Website**: glass-floating background, globe icon (20px, --foreground), --cta-blue label text. Disabled (40% opacity) if no website. Tapping opens URL externally.
- All: 56px height, radius-md (12px), flex-col centered, icon on top, label below (footnote, weight 500)
- Tap: scale 0.95, quick spring

**D. Info Metrics Row** — hidden at peek

Three-column grid below action buttons, 16px top margin:

```
  Distance            Category            Good to know
   850 m              ● Church              WiFi
```

- Label row: caption1 (12px), --foreground-tertiary, uppercase, letter-spacing 0.05em
- Value row: footnote (13px), --foreground
- **Distance column**: Formatted distance from user (e.g., "850 m", "2.1 km"). If unavailable, show "—".
- **Category column**: Colored dot (6px) + broad category name.
- **Good-to-know column**: First available of: WiFi / Outdoor seating / cuisine. If nothing available, show "—".

**E. Media Carousel** — always visible, 16px top margin

Horizontal scroll-snap carousel of photos + optional Mapillary street view as last slide.

- Aspect ratio: 3:2 (expanded), 2:1 (peek/compact)
- Corner radius: radius-md (12px)
- **Source attribution watermark**: caption2 (11px), white text, bottom-right corner on dark gradient overlay. Shows source name: "Wikimedia", "Mapillary", "Commons", etc.
- Dot indicators: bottom-center, 6px dots, current = --foreground, others = --foreground-tertiary at 40%
- Fullscreen: Tap photo to enter fullscreen portal (dark overlay, top bar with name + counter, bottom bar with dots)
- On-demand enrichment: If POI lacks images, POST to /api/poi/enrich-media to fetch Mapillary + Wikimedia
- Street view slide: Lazy-loaded, "Explore" button to enable drag interaction, "Lock" button in fullscreen
- **Empty state**: Category-colored gradient placeholder with shimmer animation

**F. Tab Bar** — hidden at peek

Horizontal row of tab buttons with animated underline indicator.

```
  Remark        Capsules        Details
  ────────
  (accent underline, 2px, rounded, layout-animated)
```

- Font: UI font, footnote (13px)
- Active: weight 500, --foreground, accent underline
- Inactive: weight 400, --foreground-secondary
- Underline: 2px height, radius-full, --accent color, animates position on switch (tab-swipe spring)
- Border-bottom: 1px solid --glass-border on the tab bar container

**G. Tab Content** — hidden at peek

Swipeable container with horizontal drag to switch tabs. AnimatePresence with wait mode.

**Remark Tab (≈ Apple Maps "About" section)**:
- **Section header**: "About" — Display font, title3 (20px), --foreground, left-aligned
- **Remark title**: Accent bar (2px wide × full height) left side + Display font, title3 (20px). Below "About" header.
- **Remark body**: Reading font, body (17px), line-height 1.7, rendered as safe Markdown (p, strong, em, a, ul, ol, li)
- **Text truncation**: Body text truncated to ~4 lines with **"...MORE"** at end. "MORE" is tappable (--foreground, bold), expands to show full text with height auto-animation (smooth spring).
- **Wikipedia link**: If POI has `wikipediaUrl`, show "More on Wikipedia" link below body text. --cta-blue color, UI font, footnote (13px). Opens URL externally.
- **Local tip**: Left border (3px, --accent), obelisk icon + "From a local" label, Reading font, subhead (15px), --foreground-secondary
- **Regenerate button**: glass-floating pill, caption1 (12px), refresh icon, cooldown timer (shows "12s" countdown)
- **Loading state**: Obelisk silhouette SVG with breathing pulse (0.9→1.1 scale), rotating phrase text (4s interval)
- **Empty state**: "No remark yet for this place" centered

**Capsules Tab**:
- Empty state: Capsule icon (outlined), "No capsules here yet", "Leave the first one" accent pill button
- Create form: Format pills (Text/Voice/Photo/Video), textarea, "Leave capsule" accent button
- Coming soon: Tap "Leave capsule" shows tooltip

**Details Tab**:
- List of detail rows: icon (16px, --foreground-tertiary) + label (footnote, --foreground-secondary or --accent if linked)
- Rows: Address, Opening hours, Phone (tel: link), Website (external link)
- Amenities: "Good to know" section header, pill badges (caption1, glass-thin border)
- Report button: glass-floating, caption1, flag icon, "Coming soon" tooltip
- Empty state: "No details available" centered

**H. Bottom Toolbar** — visible at Half and Full snaps, hidden at peek

Persistent toolbar at the bottom of the POI card content area (above safe area), 48px height.

```
           [+]          [☆]          [···]
          Add         Favorite       More
```

- Three evenly-spaced icon buttons, centered in toolbar
- **Add (+)**: Plus icon in circle outline, 24px, --foreground. Tapping → future: add to a collection/guide. Currently shows "Coming soon" tooltip.
- **Favorite (☆)**: Outlined star icon, 24px, --foreground. Tapping toggles fill (--accent when active). Currently shows "Coming soon" tooltip.
- **More (···)**: Three-dot ellipsis in circle outline, 24px, --foreground. Tapping → future: contextual menu (Report, Share, Add to Contacts). Currently shows "Coming soon" tooltip.
- Background: Subtle top border (1px --glass-border), no fill (transparent over sheet glass)
- Touch targets: 44px × 44px each

#### Peek State Behavior

At peek snap (35% height):
- **Visible**: Drag handle, share icon (left), centered POI name (title2) + category, close button (right)
- **Hidden**: Secondary name, subcategories, action buttons, info metrics, media carousel, tabs, bottom toolbar
- **Layout**: Compact single-line header matching Apple Maps collapsed state:

```
┌────────────────────────────────────────────────┐
│  ── drag handle ──                             │
│                                                │
│  [↗ Share]   The Munich Cathedral    [× Close] │
│              Cathedral                         │
│                                                │
└────────────────────────────────────────────────┘
```

- **Transition**: Content below header uses max-height 0→auto + opacity 0→1, 0.35s ease height, 0.3s ease opacity

### 7.4 Map Controls (Right-side FAB Stack)

Right-side floating action button stack, above the bottom sheet.

**Position**: Right edge, 20px from edge, vertically centered between status bar and sheet top.

**Buttons** (top to bottom, 12px gap):

```
  ┌────┐
  │ 3D │  3D/2D toggle (text label, not icon)
  └────┘
  ┌────┐
  │ 📖 │  Map layers (book/pages icon)
  └────┘
  ┌────┐
  │ ➤  │  Locate (location arrow icon)
  └────┘
```

- Each: 44px diameter circle, glass-floating, radius-full
- Icons: 18px, --foreground
- **3D toggle**: Shows "3D" text label (UI font, footnote, bold) when in 2D mode, "2D" when in 3D. Toggles map pitch.
- **Map layers**: Book/pages icon. Tapping opens layer selection (Standard, Satellite — future feature). Currently shows "Coming soon" tooltip.
- **Locate**: Location arrow icon. Centers map on user position. 50% opacity if no GPS permission. When map is rotated, shows compass needle instead.
- Tap: scale 0.95, quick spring

### 7.5 Look Around Button (Bottom-left)

**Position**: Bottom-left, 20px from edges, above sheet peek height.

```
  ┌────┐
  │ 🔭 │  Binoculars icon
  └────┘
```

- 44px diameter circle, glass-floating, radius-full
- Binoculars icon, 20px, --foreground
- Tapping: Opens street view for nearest Mapillary image to map center. If no street view available, shows brief tooltip "No street view here".
- Tap: scale 0.95, quick spring

### 7.6 Map Markers

**POI Pin**: Simple filled circle, 10px default, 14px selected. Color from category colors. Shadow: shadow-pin.

**User Location**: Three nested circles:
- Outer pulse: 32px, --location at 30% opacity, scales 1→2.2 with opacity fade (3s infinite)
- Middle ring: 20px, --location at 30% border
- Inner dot: 12px, solid --location
- Optional heading arrow: Triangle rotated by heading degrees

**Search Pin**: Teardrop shape (28px), --accent color:
- Teardrop: border-radius 50% 50% 50% 0, rotated -45°
- Center dot: 10px white circle
- Entry: pin-drop spring animation

### 7.7 Remark Notification (Geofence Toast)

Geofence-triggered floating toast. Appears above the sheet.

**Position**: Above the sheet top edge, horizontal 16px margins, z-30.

**Structure**:

```
┌──────────────────────────────────────────┐
│  ● POI Name                          ✕   │
│    Teaser text from the remark...        │
└──────────────────────────────────────────┘
  glass-liquid, radius-2xl, 3px amber left border
```

- Amber dot: 8px, pulsing
- POI name: Display font, subhead (15px)
- Teaser: Reading font, footnote (13px), --foreground-secondary, 2 lines max
- Dismiss: × button, 44px touch target
- Entry: Slide up from y:80, smooth spring
- Exit: Slide down to y:80, snappy spring
- Tap: Opens POI in bottom sheet (transitions from search mode to POI mode)

### 7.8 Error Toast

Auto-dismissing error message.

**Position**: Above bottom sheet, horizontal 12px margins, z-60.

**Structure**: glass-floating, radius-2xl, 3px --error left border. Error icon + message + dismiss + report stub. Auto-dismiss after 6s.

### 7.9 Loading State

Branded loading indicator used inside remark tab during generation.

- Obelisk silhouette SVG: Breathing pulse (scale 0.9→1.1, opacity 0.4→1.0, 2s infinite)
- Rotating phrases: "Just a moment…", "Looking into this place…", "Gathering stories…", "Piecing together…", "Crafting your remark…" — 4s interval with clip-path text reveal
- Font: Reading font, italic, footnote (13px)

---

## 8. Screen States & Transitions

### 8.1 Default (Map + Search)

Map fills entire screen. Bottom sheet visible at mini height showing search bar. Map controls on right side. Look Around button on bottom-left.

```
┌──────────────────────────────────────┐
│                                      │
│           (map canvas)               │
│                                 [3D] │
│  [🔭]                          [📖] │
│                                 [➤]  │
├──── sheet (mini ~100px) ─────────────┤
│  ── handle ──                        │
│  🔍 Search Obelisk...     🎤  👤    │
└──────────────────────────────────────┘
```

### 8.2 Search Active

User taps search bar → sheet expands to Half (55%). Keyboard opens. Autocomplete appears as user types.

```
┌──────────────────────────────────────┐
│           (map, dimmed)              │
│                                      │
├──── sheet (half ~55%) ───────────────┤
│  ── handle ──                        │
│  🔍 quiet cafe_              ✕      │
│                                      │
│  ● Café Luitpold                     │
│    food · 350 m                      │
│  ● Café Cord                         │
│    food · 820 m                      │
│  ● Café Frischhut                    │
│    food · 1.2 km                     │
│                                      │
│  ──── keyboard ────                  │
└──────────────────────────────────────┘
```

### 8.3 Search Results

Search completes → sheet stays at Half with full results list. Map shows search pins.

### 8.4 POI Selected

User taps a search result or map pin → sheet transitions to POI mode at Peek (35%).

```
┌──────────────────────────────────────┐
│                                      │
│           (map, centered on POI)     │
│                                 [3D] │
│  [🔭]                          [📖] │
│                                 [➤]  │
├──── sheet (peek ~35%) ───────────────┤
│  ── handle ──                        │
│                                      │
│  [↗]    The Munich Cathedral    [×]  │
│              Cathedral               │
│                                      │
└──────────────────────────────────────┘
```

User swipes up → Half snap shows action buttons, metrics, photos. Full snap shows tabs and all content.

### 8.5 POI Fully Expanded

```
┌──────────────────────────────────────┐
│  (map barely visible)                │
├──── sheet (full ~85%) ───────────────┤
│  ── handle ──                        │
│  [↗ Share]                    [× Close]
│                                      │
│       The Munich Cathedral           │
│         Der Münchner Dom             │
│        Italian · Bavarian            │
│           ● Cathedral                │
│                                      │
│  [🧭 850 m]  [📞 Call]  [🌐 Website]│
│                                      │
│  Distance    Category    Good to know│
│   850 m      ● Church      WiFi     │
│                                      │
│  ┌──────────┐ ┌──────────┐          │
│  │ [photo1] │ │ [photo2] │ →        │
│  │Wikimedia │ │Mapillary │          │
│  └──────────┘ └──────────┘          │
│                                      │
│  Remark    Capsules    Details       │
│  ─────                               │
│                                      │
│  About                               │
│  ┃ The Devil's Footprint             │
│                                      │
│  The Frauenkirche is a church in     │
│  Munich, Bavaria, that serves as the │
│  cathedral of the Archdiocese...MORE │
│                                      │
│  More on Wikipedia                   │
│                                      │
│  ┃ From a local                      │
│  Stand at the entrance and look for  │
│  the black mark on the floor...      │
│                                      │
│  [↻ Regenerate]                      │
│                                      │
│      [+]       [☆]       [···]      │
│                                      │
└──────────────────────────────────────┘
```

### 8.6 Geofence Trigger

Remark notification toast slides up above the sheet. Tapping opens POI in sheet (transitions from search → POI mode).

### 8.7 Close POI → Return to Search

Tapping × Close or dragging sheet fully down from peek → cross-fade transition back to search mode. Sheet returns to mini height with search bar.

---

## 9. Responsive Behavior

- **Phone (< 540px)**: Sheet spans full width minus bottom gaps. Single-column layout.
- **Tablet/Desktop (≥ 540px)**: Sheet max-width 540px, centered. Map controls adjust position.
- **Web**: Same layout, mouse hover states enabled on buttons/cards. Scroll replaces drag for sheet expansion.
- **Safe areas**: Top (status bar), bottom (home indicator) respected via platform safe area insets.

---

## 10. Accessibility

- All interactive elements: 44pt minimum touch target
- Color contrast: Text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- Motion: Respect reduced-motion preference (disable springs, use instant transitions)
- Screen reader: Semantic labels on all buttons, images, map markers
- Focus indicators: Visible focus rings on keyboard navigation (web)
