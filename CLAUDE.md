# Obelisk - Claude Memory

## Overview

Obelisk is a **contextual discovery platform** that transforms urban navigation into meaningful exploration through ambient storytelling. AI-generated stories surface automatically as users walk through cities, triggered by proximity to points of interest. Currently scoped to Munich as a single-city MVP.

Detailed product documentation: **`Obelisk.md`** (features, design, roadmap, brand identity)

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
| LLM | Ollama (gemma3:27b) — NVIDIA GPU |
| Clustering | Supercluster v8 |
| Validation | Zod v3.24 |
| State | TanStack React Query v5 |
| Infrastructure | Docker Compose |
| Package Manager | Bun v1.3.6 |

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
│   │   └── ui/
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
├── tailwind.config.ts
├── Plan.md                           # Implementation plan + roadmap
└── Obelisk.md                        # Product specification
```

---

## Commands

### Make (primary interface)

| Command | Description |
|---------|-------------|
| `make setup` | First-time setup (deps, db, model, seed, stories) |
| `make run` | Start app + services at localhost:3000 |
| `make run-local` | Start exposed to local network (same WiFi) |
| `make stop` | Stop services (data preserved) |
| `make rebuild` | Clean rebuild (.next, node_modules) |
| `make destroy` | Stop + delete all data |
| `make logs` | Stream service logs |

### Bun scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server with Turbopack |
| `bun run build` | Production build |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript type checking |
| `bun scripts/seed-pois.ts` | Seed Munich POIs |
| `bun scripts/generate-stories.ts` | Batch generate stories |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL JS access token |
| `NEXT_PUBLIC_MAPBOX_STYLE_LIGHT` | Mapbox style URL for light mode |
| `NEXT_PUBLIC_MAPBOX_STYLE_DARK` | Mapbox style URL for dark mode |
| `DATABASE_URL` | PostgreSQL connection string (default: `postgresql://obelisk:obelisk_dev@localhost:5432/obelisk`) |
| `OLLAMA_URL` | Ollama API endpoint (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | LLM model name (default: `gemma3:27b`) |

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/pois` | List all POIs |
| GET | `/api/pois/discover` | Smart discovery with filters |
| GET | `/api/remarks` | Get nearby remarks (lat, lng, radius) |
| GET | `/api/remarks/generate` | Batch generate stories |
| POST | `/api/remarks/generate-for-poi` | Generate story for single POI |
| POST | `/api/remarks/regenerate` | Re-roll existing story |
| POST | `/api/search` | Unified search (Obelisk + external POIs) |
| GET | `/api/categories` | List all 8 story categories |
| GET | `/api/poi/[osmId]` | Get external POI details |
| POST | `/api/poi/lookup` | Reverse lookup by coordinates |

---

## Database Schema

Three tables in PostgreSQL (no PostGIS — uses plain doubles with Haversine in app code):

**categories** — Story categories (8 total: history, food, art, nature, architecture, hidden, views, culture)
- `id` UUID PK, `name`, `slug`, `icon`, `color` (hex)

**pois** — Points of interest (408 seeded in Munich)
- `id` UUID PK, `osm_id` BIGINT UNIQUE, `name`, `category_id` FK
- `latitude` DOUBLE PRECISION, `longitude` DOUBLE PRECISION
- `address`, `wikipedia_url`, `image_url`, `osm_tags` JSONB

**remarks** — Stories attached to POIs (100+ generated)
- `id` UUID PK, `poi_id` FK (CASCADE delete)
- `title` VARCHAR(100), `teaser` VARCHAR(100), `content` TEXT
- `local_tip` TEXT, `duration_seconds` INT (default 45), `audio_url` TEXT

---

## Design System (Glassmorphism — iOS 26 Inspired)

**Light Mode:**
- Glass: `rgba(255,255,255,0.72)` + `backdrop-blur(20px)`
- Border: `1px solid rgba(255,255,255,0.5)`
- Radius: `16-24px`
- Shadow: `0 8px 32px rgba(0,0,0,0.08)`

**Dark Mode:**
- Glass: `rgba(30,30,30,0.75)` + `backdrop-blur(20px)`
- Background: `#000000` (true black for OLED)

**Category Colors:**

| Category | Color |
|----------|-------|
| History | `#FF6B4A` (Coral) |
| Food | `#FF9F9F` (Soft Pink) |
| Art | `#BF5AF2` (Purple) |
| Nature | `#34C759` (Mint) |
| Architecture | `#5AC8FA` (Sky Blue) |
| Hidden Gems | `#FFD60A` (Yellow) |
| Views | `#64D2FF` (Teal) |
| Culture | `#5E5CE6` (Indigo) |

**Typography:** Inter (web) / SF Pro (native feel)

---

## Code Standards

### Documentation Style

Use **Google-style docstrings** for all functions, classes, and modules:

```typescript
/**
 * Brief description of what the function does.
 *
 * Args:
 *     paramName: Description of the parameter.
 *     anotherParam: Description of another parameter.
 *
 * Returns:
 *     Description of the return value.
 *
 * Raises:
 *     ErrorType: When this error occurs.
 *
 * Example:
 *     const result = myFunction(arg1, arg2);
 */
```

### Comments Policy

- **NO inline comments** unless explaining a genuinely complex algorithm
- Code must be self-documenting through clear naming
- If you need a comment to explain what code does, refactor the code instead

### Design Principles

- **SOLID** - Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY** - Don't Repeat Yourself
- **KISS** - Keep It Simple, Stupid
- **Composition over Inheritance**
- **Dependency Injection** where it improves testability
- **Early Returns** to reduce nesting

### Clean Code Rules

- Meaningful, descriptive names for variables, functions, and files
- Small, focused functions (prefer < 20 lines)
- Strict TypeScript - no `any` types
- Custom error types for error handling
- Consistent naming: kebab-case for files/folders, PascalCase for components/types, camelCase for functions/variables

---

## Do NOT Create

- README.md or other documentation files (keep repo clean)
- Unnecessary configuration files
- Test files for trivial code
- Do not expose to internet without security audit — planned for Phase 2

---

## Plan Maintenance

- Keep `Plan.md` updated as implementation progresses
- Mark completed tasks with [x] instead of [ ]
- Update status and add notes for blockers
- Reference Plan.md for current implementation status

---

## References

- **Product spec:** `Obelisk.md` — always refer to this for features, design, roadmap, and brand identity
- **Implementation plan:** `Plan.md` — current progress, Phase 2 roadmap, verification checklist
