# Obelisk MVP Phase 1 - Implementation Plan

> **Status:** Phase 1 Complete - All P0 Features Verified
> **Last Updated:** 2026-01-17

## Overview

**Goal:** Validate ambient storytelling creates engagement
**Scope:** Single city (Munich), Core P0 features only
**Timeline:** 6 weeks
**Status:** MVP Phase 1 Complete

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) + React 19 |
| Map | Mapbox GL JS v3.10 + react-map-gl v7.1 |
| Map Data | Mapbox (streets/dark styles) + OpenStreetMap (POI data via Overpass/Nominatim) |
| Styling | Tailwind CSS v4 + CSS variables |
| Animation | Framer Motion v12 |
| Database | PostgreSQL 15 |
| ORM | Drizzle ORM v0.38 |
| LLM | Ollama (gemma3:27b) — **NVIDIA GPU** |
| Clustering | Supercluster v8 |
| Validation | Zod v3.24 |
| State | TanStack React Query v5 |
| TTS | Piper - self-hosted (Phase 2) |
| Infrastructure | Docker Compose |
| Package Manager | Bun v1.3.6 |

---

## MVP Features (Core P0 Scope)

| Feature | Description | Success Metric | Status |
|---------|-------------|----------------|--------|
| Interactive Map | Mapbox GL JS map with user location + dark mode | Map loads < 2s | [x] Verified |
| Remark Pins | POI markers with category colors + Supercluster | 50+ POIs displayed | [x] 408 POIs, 100 stories |
| Story Cards | Text display in bottom sheet (glassmorphism) | Avg read time > 30s | [x] Verified |
| Geofence Triggers | Notification at 50m radius with cooldown | > 90% accuracy | [x] Implemented |
| Story Generation | On-demand LLM story generation for POIs | Stories feel authentic | [x] Implemented |
| Story Regeneration | Re-roll stories with 20s cooldown | New story generated | [x] Implemented |
| Story Localization | Multi-language story generation | Stories in target language | [x] Implemented |

**Deferred to Phase 2:** Search (implemented but unreliable UI/UX), Category Filters, Audio Playback, Explore Mode, Settings, PWA, Public Deployment

---

## Project Structure

```
obelisk/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout + metadata
│   │   ├── page.tsx                  # Main map page (core app logic)
│   │   ├── providers.tsx             # React Query + theme providers
│   │   ├── globals.css               # Tailwind + CSS design tokens
│   │   └── api/
│   │       ├── pois/
│   │       │   ├── route.ts          # GET /api/pois
│   │       │   └── discover/route.ts # GET /api/pois/discover
│   │       ├── remarks/
│   │       │   ├── route.ts          # GET /api/remarks
│   │       │   ├── generate/route.ts # GET batch story generation
│   │       │   ├── generate-for-poi/route.ts # POST single POI story
│   │       │   └── regenerate/route.ts       # POST re-roll story
│   │       ├── search/route.ts       # POST /api/search
│   │       ├── categories/route.ts   # GET /api/categories
│   │       └── poi/
│   │           ├── [osmId]/route.ts  # GET external POI details
│   │           └── lookup/route.ts   # POST reverse lookup
│   │
│   ├── components/
│   │   ├── map/
│   │   │   ├── MapContainer.tsx      # Wrapper + location permissions
│   │   │   ├── MapView.tsx           # Core Mapbox GL component
│   │   │   ├── MapControls.tsx       # Zoom, locate buttons
│   │   │   ├── POIPin.tsx            # Map marker for POIs
│   │   │   ├── ClusterPin.tsx        # Supercluster markers
│   │   │   ├── UserLocationMarker.tsx # Blue dot + accuracy ring
│   │   │   └── LocateButton.tsx      # Center-on-user button
│   │   ├── story/
│   │   │   ├── StoryCard.tsx         # Full story in bottom sheet
│   │   │   └── StoryNotification.tsx # Toast notification (50m trigger)
│   │   ├── search/
│   │   │   ├── SearchBar.tsx         # Search input
│   │   │   └── SearchResults.tsx     # Unified results display
│   │   ├── poi/
│   │   │   └── POICard.tsx           # POI detail card
│   │   ├── layout/
│   │   │   └── BottomSheet.tsx       # Apple Maps-style draggable sheet
│   │   └── ui/                       # Design system
│   │       ├── GlassCard.tsx         # Glassmorphic container
│   │       ├── GlassButton.tsx       # Themed button
│   │       ├── GlassPill.tsx         # Pill/tag component
│   │       └── ShimmerText.tsx       # Loading animation
│   │
│   ├── hooks/
│   │   ├── useGeolocation.ts         # GPS tracking + permissions
│   │   ├── useGeofence.ts            # Proximity detection engine
│   │   ├── useNearbyRemarks.ts       # Fetch nearby stories
│   │   ├── useSearch.ts              # Search functionality
│   │   └── useDiscoverPois.ts        # POI discovery
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts             # Drizzle ORM + postgres connection
│   │   │   ├── schema.ts             # Drizzle table definitions
│   │   │   └── queries/
│   │   │       ├── pois.ts           # POI queries
│   │   │       ├── remarks.ts        # Remark CRUD + generation
│   │   │       └── search.ts         # Full-text search
│   │   ├── ai/
│   │   │   ├── ollama.ts             # Ollama HTTP client
│   │   │   ├── storyGenerator.ts     # LLM story generation
│   │   │   └── localization.ts       # Multi-language generation
│   │   ├── search/
│   │   │   ├── types.ts              # Search types
│   │   │   ├── queryParser.ts        # NLU query parsing
│   │   │   ├── nominatim.ts          # OSM geocoding
│   │   │   └── overpass.ts           # OSM POI querying
│   │   ├── geo/
│   │   │   └── distance.ts           # Haversine distance calculation
│   │   ├── ui/
│   │   │   └── animations.ts         # Framer Motion presets
│   │   └── web/
│   │       ├── scraper.ts            # HTML scraping for business data
│   │       └── webSearch.ts          # Web search context
│   │
│   └── types/
│       └── index.ts                  # Poi, Remark, Category, GeoLocation types
│
├── scripts/
│   ├── seed-pois.ts                  # Seed Munich POIs from Overpass API
│   └── generate-stories.ts           # Batch LLM story generation
│
├── drizzle/                          # Database migrations
├── docker-compose.yml                # Dev: app + postgres + ollama
├── docker-compose.jetson.yml         # NVIDIA Jetson (aarch64)
├── Dockerfile
├── Makefile                          # CLI commands
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── tailwind.config.ts
```

---

## Implementation Phases (Core P0 - 6 Weeks)

### Week 1-2: Foundation (COMPLETED)
- [x] Initialize Next.js 15 + TypeScript + Tailwind
- [x] Set up PostgreSQL + PostGIS (Docker)
- [x] Create database schema with Drizzle
- [x] Integrate MapLibre GL JS with OpenFreeMap tiles
- [x] Build `MapView` component
- [x] Implement `useGeolocation` hook
- [x] Display user location marker (pulsing blue dot)
- [x] Build `GlassCard` base component
- [x] Set up design tokens (colors, blur, shadows)

### Week 3-4: Data + Pins (COMPLETED)
- [x] Create Overpass API query for Munich POIs
- [x] Build POI seed script
- [x] Seed 50+ Munich POIs with category mapping
- [x] Set up Ollama with gemma3:4b-it-q4_K_M (NVIDIA GPU)
- [x] Create story generation prompt
- [x] Generate stories for all POIs
- [x] Build `GET /api/pois/nearby` endpoint
- [x] Build `RemarkPin` component
- [x] Display POI markers on map with category colors

### Week 5-6: Stories + Geofencing (COMPLETED)
- [x] Build `GET /api/remarks` endpoint
- [x] Build `BottomSheet` component (iOS-style)
- [x] Build `StoryCard` component
- [x] Build `StoryNotification` toast
- [x] Pin click -> show story in bottom sheet
- [x] Implement Haversine distance calculation
- [x] Build `useGeofence` hook
- [x] Trigger notification at 50m proximity
- [x] Story fatigue prevention (2-min cooldown)
- [x] Dark mode support
- [x] Animation polish

### UI Visual Refinement (COMPLETED)
- [x] Design tokens: iOS typography scale, enhanced shadows, multi-layer glass variants
- [x] Spring animation system: snappy, bouncy, smooth presets (Framer Motion)
- [x] Bottom sheet polish: proper drag handle (36×5px pill), spring physics, dynamic shadows
- [x] Story card refinement: iOS typography hierarchy (title2: 22px), proper spacing rhythm
- [x] Map pin upgrade: gradient fill, soft shadows, selection glow ring, bounce animation
- [x] Discover button: gradient background, pulsing glow, larger touch target
- [x] User location marker: three-ring design (dot, accuracy ring, pulse), heading arrow
- [x] Glass components: border-top highlight, inner shadow depth, variant system

### Integrated Map & Search Architecture (PARTIAL — search needs Phase 2 refinement)
- [x] Mapbox GL JS integration (replaced MapLibre for premium visuals)
- [x] OpenStreetMap POI data via Nominatim and Overpass APIs
- [x] Dark mode automatic switching with Mapbox styles
- [x] External POI details API (`GET /api/poi/[osmId]`)
- [x] POICard component for POI detail display
- [ ] LLM-powered intelligent search query parsing (implemented but unreliable)
- [ ] Unified search API (`POST /api/search`) (implemented but inconsistent results)
- [ ] Search UI: SearchBar, SearchResults (implemented but not responsive, non-uniform flow)
- [ ] Search → POI card navigation (tapping search result doesn't open navigable card)

### Future (Phase 2)

---

#### Explore Mode — "Your Local Friend" (Key Differentiator)

Explore Mode is Obelisk's signature feature. It transforms the app from a passive story listener into an **active local companion**. When activated, Obelisk takes the initiative — it scans the user's surroundings, discovers interesting places, generates a personalized walking route, and guides the user through it with stories and tips delivered via audio.

**The "Local Friend" metaphor:** Imagine a knowledgeable friend who lives in the city. They'd say *"Follow me — I'll show you the real Munich."* They wouldn't recite Wikipedia. They'd take you to the courtyard nobody knows about, tell you which schnitzel to order, and share the story behind the fountain you'd otherwise walk past.

##### User Flow

```
┌──────────────────────────────────────────────────────────────┐
│  1. ACTIVATION                                                │
│     User taps "Explore" button on map                        │
│     ↓                                                         │
│  2. SCANNING (3-5 seconds)                                    │
│     "Let me look around..."                                  │
│     • GPS location detected                                   │
│     • Overpass API scans 1-2km radius                        │
│     • Obelisk DB checked for existing stories                │
│     • LLM selects & orders best stops                        │
│     ↓                                                         │
│  3. ROUTE PROPOSAL                                            │
│     "I found 6 interesting spots — 1.8km, about 45 min"     │
│     • Route preview on map (numbered pins + path)            │
│     • Quick summary card for each stop                       │
│     • User can accept, shuffle, or adjust                    │
│     ↓                                                         │
│  4. GUIDED EXPLORATION (audio-first)                          │
│     • Walking directions between stops via audio             │
│     • Story auto-plays when approaching each stop            │
│     • Transition narration between stops                     │
│     • Detour suggestions for nearby discoveries              │
│     ↓                                                         │
│  5. ADAPTATION (continuous)                                   │
│     • User deviates → route recalculates                     │
│     • User lingers → remaining route adjusts                 │
│     • New POI discovered mid-route → offers detour           │
│     • Skip a stop → moves to next                            │
│     ↓                                                         │
│  6. SESSION END                                               │
│     "You explored 1.8km and discovered 5 stories!"          │
│     • Summary card with all visited stops                    │
│     • Option to continue exploring or end                    │
└──────────────────────────────────────────────────────────────┘
```

##### Route Generation Logic

**Input signals for POI selection:**
- User's GPS position (center point)
- Time of day → morning: cafés, bakeries; afternoon: museums, parks; evening: restaurants, bars, viewpoints
- Available POIs in radius (Overpass categories: historic, tourism, amenity, leisure)
- Existing Obelisk stories (prefer POIs that already have remarks)
- Category variety (don't put 3 history stops in a row — mix it up)
- Walking distance between stops (prefer 100-400m gaps for natural flow)

**LLM Route Planning Prompt (conceptual):**
```
You are a local guide creating a walking tour. Given these nearby POIs:
[list of POIs with categories, distances, and whether they have stories]

Create a walking route with 4-8 stops that:
1. Starts from the user's current position
2. Alternates categories (history → food → hidden → art → nature)
3. Keeps total distance under 2.5km
4. Prioritizes POIs with existing stories
5. Includes at least one food/drink stop
6. Ends at a natural resting point (café, park, viewpoint)

Time context: [morning/afternoon/evening]
Output: ordered list of POI IDs with brief "why this stop" reasoning
```

**Route scoring algorithm:**
- Story availability: +30 (has remark) / +10 (can generate)
- Category diversity: +20 per unique category in route
- Distance penalty: -5 per 100m beyond 300m between consecutive stops
- Time-of-day relevance: +15 (café in morning, restaurant at evening)
- Hidden gem bonus: +10 for "hidden" category (surprise factor)

##### Audio-First Experience (TTS Integration)

The user puts on headphones and Obelisk becomes a voice in their ear — a friend narrating their walk.

**Audio content types during exploration:**

| Moment | What Obelisk Says | Example |
|--------|-------------------|---------|
| **Route start** | Welcome + overview | *"Alright, I've got a great route for you. 6 stops, about 45 minutes. First up — a bakery that's been here since 1847."* |
| **Walking transition** | Direction + teaser | *"Walk north on Sendlinger Straße for about 200 meters. On your left, look for a small courtyard entrance — that's our next stop."* |
| **Approaching stop** | Full story | The remark content, read in local-friend tone (existing story generation) |
| **Local tip** | Practical insider info | *"If you're hungry, get the Butterbrezel — they bake them fresh every hour."* |
| **Detour offer** | Optional discovery | *"By the way, there's a hidden garden 50 meters to your right. Want a quick detour?"* |
| **Between stories** | Context/bridge | *"That fountain we just passed? It was actually a horse watering station in the 1700s. Anyway, next up..."* |
| **Route end** | Wrap-up + stats | *"Nice walk! You covered 1.8km and heard 5 stories. There's a beer garden right here if you want to sit down."* |

**TTS Pipeline:**
1. All audio generated via Piper (self-hosted TTS)
2. Route start narration generated on-the-fly when route is created
3. Story audio pre-generated for POIs with existing remarks
4. Transition narrations generated in real-time based on user position + next stop
5. Audio queued and played seamlessly — no silence gaps between segments
6. User can pause/resume, skip story, or ask for repeat

**Audio Controls (minimal, glanceable):**
```
┌─────────────────────────────────────┐
│  🎧 Exploring Munich                │
│  Stop 3/6 · "The Hidden Courtyard"  │
│  ▶ ━━━━━━━━━○──── 0:23/0:45        │
│  [⏸]  [⏭ Skip]  [🔊]              │
└─────────────────────────────────────┘
```

##### UI/UX Design

**Explore Mode Button:**
- Prominent on map, glassmorphic, pulsing glow (reuse `discoverButtonVariants`)
- Label: "Explore" with compass icon
- Position: bottom-center, above bottom sheet area

**Scanning State:**
- Map zooms out slightly to show scan radius
- Pulsing ring animation around user location (1-2km)
- Glass card: *"Scanning your surroundings..."* with shimmer animation
- POI pins appear one by one as they're discovered (staggered pop animation)

**Route Preview (before starting):**
- Bottom sheet at 50% snap with route summary
- Map shows: numbered pins connected by dashed walking path
- Each stop shows: category icon, name, distance from previous, ~reading time
- Buttons: "Let's Go" (primary), "Shuffle" (secondary), "Cancel"
- User can tap any stop to preview the story card

**Active Exploration:**
- Map follows user (auto-center with heading)
- Current stop highlighted, upcoming stop pulsing gently
- Completed stops shown as muted/checked
- Walking path shown between current position and next stop
- Mini audio player floating at bottom (collapsed by default)
- Bottom sheet shows current stop's story card (expandable)
- Swipe up on audio bar → full story card

**Route Adaptation:**
- User walks off-route → subtle toast: *"Looks like you're going your own way — want me to adjust?"*
- User stays at stop >5 min → remaining stops recalculated for time
- New interesting POI nearby → glassmorphic card: *"Detour? There's something cool 50m away"*

##### Technical Architecture

**New types:**
```typescript
interface ExploreRoute {
  id: string;
  stops: ExploreStop[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  createdAt: number;
}

interface ExploreStop {
  order: number;
  poi: Poi;
  remark: Remark | null;
  distanceFromPrevious: number;
  reasonForInclusion: string;
  visited: boolean;
  skipped: boolean;
}

interface ExploreSession {
  route: ExploreRoute;
  currentStopIndex: number;
  startedAt: number;
  status: "scanning" | "preview" | "active" | "paused" | "completed";
  audioEnabled: boolean;
  adaptationCount: number;
}
```

**New hook — `useExploreMode`:**
- Manages full explore session lifecycle
- Calls `/api/explore/generate-route` to create the route
- Tracks progress through stops
- Integrates with `useGeofence` for auto-triggers at each stop (30m radius)
- Handles route adaptation when user deviates
- Returns: `{ session, startExploring, skipStop, pauseExploring, endExploring }`

**New API endpoints:**
- `POST /api/explore/generate-route` — lat/lng + time context → `ExploreRoute`
  - Internally: Overpass scan + Obelisk DB check + LLM route ordering
- `POST /api/explore/adapt-route` — current position + remaining stops → updated route
- `GET /api/explore/transition` — current stop + next stop → transition narration text

**New components:**
- `ExploreButton.tsx` — Map overlay button to start explore mode
- `ExploreScanning.tsx` — Scanning animation overlay
- `ExploreRoutePreview.tsx` — Route summary in bottom sheet
- `ExploreActiveOverlay.tsx` — Progress bar, current stop, mini audio player
- `ExploreRoutePath.tsx` — Mapbox layer for walking path between stops
- `ExploreSummary.tsx` — Session end card with stats

**New sheet mode:** `"explore"` added to `SheetMode`

**Reuses existing infrastructure:**
- `useGeofence` — with custom config (30m trigger radius for stops)
- `/api/pois/discover` — surrounding POI scan via Overpass
- `/api/remarks/generate-for-poi` — on-demand story generation at stops
- `storyGenerator.ts` — LLM + persona system for story content
- `localization.ts` — multilingual route narrations
- `BottomSheet` — route preview and active story display
- `POIPin` / `ClusterPin` — with numbered variant for route stops
- `StoryNotification` — for detour suggestions
- Animation presets — `floatingEntry`, `notificationVariants`

##### Explore Mode vs Ambient Mode

| Aspect | Ambient Mode (current) | Explore Mode (new) |
|--------|----------------------|-------------------|
| **User initiative** | Passive — walk anywhere | Active — tap "Explore" |
| **Obelisk role** | Quiet observer, occasional whisper | Tour guide, continuous companion |
| **Route** | No route, wherever user walks | LLM-generated walking route |
| **Engagement** | 2-5 notifications per 30 min | Continuous: story per stop + transitions |
| **Audio** | Optional (future TTS per story) | Primary — full narrated experience |
| **Discovery** | Random nearby stories | Curated, category-balanced tour |
| **Adaptation** | Fixed cooldown rules | Dynamic route adjustment |
| **Session feel** | Background companion | Guided adventure |
| **End state** | No defined end | Summary card with stats |

##### Content & Tone — The Local Friend Voice

**Narration principles:**
- **Conversational, not scripted** — *"So this place..."* not *"Welcome to stop number 3"*
- **Opinionated** — *"Honestly, the terrace is overrated — grab a seat inside"*
- **Contextual humor** — *"They say Mozart played here. They say that about everywhere in Munich, but this one might be true"*
- **Practical** — *"Bathroom's in the back, by the way"*
- **Time-aware** — Morning: *"Perfect time for a coffee before it gets busy"* / Evening: *"Catch the sunset from this bench"*
- **Encouraging** — *"You've got great taste — this is one of my favorite spots"*

**Transition narration between stops:**
- Not just *"Walk 200m north"* but *"Walk up this street — notice the Art Nouveau facades? That's from when this was the artist quarter"*
- Brief, 10-20 second audio bridges that add value while walking
- Can reference things visible along the way (buildings, streets, landmarks)

**Route start examples by time of day:**
- Morning: *"Good morning! I found a route that starts with the best coffee in the neighborhood and ends at a park. 5 stops, 30 minutes. Let's go."*
- Afternoon: *"Nice afternoon for a walk. I've got 6 stops for you — some history, a hidden courtyard, and that bakery everyone talks about. 45 minutes, 1.5km."*
- Evening: *"Perfect evening stroll ahead. I'm taking you past two historic spots, a great viewpoint for sunset, and we'll finish at a beer garden. Ready?"*

---

#### Other Phase 2 Features

- Audio playback (TTS with Piper) — also powers Explore Mode narration
- **Search overhaul:** fix query parsing reliability, responsive search results UI, POI card navigation from search results, uniform UX across search and pin-tap flows
- Settings page: dark mode toggle, language selection (UI + story language), user account management
- PWA / Mobile App: service worker, manifest, offline shell — or React Native / Expo wrapper
- Statistics & analytics: usage tracking, story engagement metrics, geofence trigger rates, session duration, popular POIs — required before public launch
- Public deployment: expose on existing domain after strict security audit (rate limiting, API auth, env vars, CORS, CSP headers, Ollama isolation) and analytics in place
- User accounts, offline caching, category filter UI

---

## Database Schema

```sql
-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL
);

-- Points of Interest
CREATE TABLE pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    osm_id BIGINT UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    wikipedia_url TEXT,
    image_url TEXT,
    osm_tags JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remarks (Stories)
CREATE TABLE remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID REFERENCES pois(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    teaser VARCHAR(100),
    content TEXT NOT NULL,
    local_tip TEXT,
    duration_seconds INTEGER DEFAULT 45,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (no PostGIS — distance uses Haversine in app code)
CREATE INDEX idx_pois_location ON pois(latitude, longitude);
CREATE INDEX idx_pois_category ON pois(category_id);
CREATE INDEX idx_remarks_poi ON remarks(poi_id);
```

---

## Design System (Glassmorphism)

**Light Mode:**
- Glass: `rgba(255,255,255,0.72)` + `backdrop-blur(20px)`
- Border: `1px solid rgba(255,255,255,0.5)`
- Radius: `16-24px`
- Shadow: `0 8px 32px rgba(0,0,0,0.08)`

**Dark Mode:**
- Glass: `rgba(30,30,30,0.75)` + `backdrop-blur(20px)`
- Background: `#000000` (true black)

**Colors:**
- Coral (Primary): `#FF6B4A`
- User Location: `#5AC8FA`
- History: `#FF6B4A`, Food: `#FF9F9F`, Art: `#BF5AF2`
- Nature: `#34C759`, Architecture: `#5AC8FA`, Hidden: `#FFD60A`

**Typography:** Inter (web) / SF Pro (native feel)

---

## Geofence Logic

```
Distance Tiers:
├─ 500m: Pre-load story data + audio
├─ 100m: Queue notification (if not in cooldown)
└─  50m: Trigger ambient notification

Cooldown Rules:
├─ Min 2 minutes between notifications
├─ Max 5 notifications per 30-min session
└─ Dismiss -> 5-minute local cooldown
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Map load time | < 2 seconds |
| POI coverage | 50+ in Munich |
| Story quality | Engaging, not Wikipedia-style |
| Geofence accuracy | > 90% |
| Avg story read time | > 30 seconds |

---

## Verification Checklist

**Docker Setup:**
- [x] `make setup` completes without errors
- [x] `docker compose ps` shows all 3 services running
- [x] App accessible at http://localhost:3000

**Functionality:**
- [x] Map loads with Munich centered (Mapbox GL JS with streets/dark styles)
- [x] 408 POIs seeded, 100 stories generated with category colors
- [x] Tap pin -> story card appears in bottom sheet (glassmorphism UI)
- [x] Geofence hook implemented (50m trigger, 100m queue, 500m preload)
- [x] Cooldown logic: 2-min between notifications, max 5 per 30-min session
- [x] Dark mode CSS classes configured (bottom sheet uses dark glass)
- [ ] Mobile responsive -> works on phone viewport (not yet tested)

**Code Quality:**
- [ ] `make lint` passes with no errors
- [ ] `make typecheck` passes with no errors

**Verified Features (2026-01-17):**
- Interactive Map: Mapbox GL JS with auto light/dark mode switching, loads < 2s
- Story Cards: "Tiny Treasures, Big Stories" (Spielzeugmuseum), "Shadows & Sparkling Secrets" (GOP Theater)
- Category colors: Coral (architecture), Purple (art), Blue (culture)
- Local tips working with insider recommendations
- On-demand story generation and regeneration via Ollama
- Story localization (multi-language support)
- Listen button ready for Phase 2 TTS

**Known Issues:**
- Search: query parsing unreliable, results UI not responsive, POI card navigation from search broken
- Mobile responsive: not yet tested on phone viewport
