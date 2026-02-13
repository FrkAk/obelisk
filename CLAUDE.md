# Obelisk - Claude Memory

## Overview

Obelisk is a **contextual discovery platform** that transforms urban navigation into meaningful exploration through ambient storytelling. AI-generated stories surface automatically as users walk through cities, triggered by proximity to points of interest. Currently scoped to Munich as a single-city MVP.

Detailed product documentation: **`Obelisk.md`** (features, design, roadmap, brand identity)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + React 19 |
| Map | Mapbox GL JS v3.18 + react-map-gl v8.1 |
| Map Data | Mapbox (streets/dark styles) + OpenStreetMap (POI data via local PBF extract) |
| Styling | Tailwind CSS v4 + CSS variables |
| Animation | Framer Motion v12 |
| Database | PostgreSQL 15 + pgvector (vector similarity) + pg_trgm (fuzzy text) |
| ORM | Drizzle ORM v0.45 |
| Search Engine | Typesense v30.1 (keyword search, autocomplete, faceted filtering) |
| Web Search | SearXNG (self-hosted meta search for POI enrichment) |
| LLM | Ollama (gemma3:4b-it-qat) — NVIDIA GPU |
| Embeddings | Ollama (embeddinggemma:300m) — 768-dim vectors via pgvector |
| Clustering | Supercluster v8 |
| Validation | Zod v4 |
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
│   │       ├── search/
│   │       │   ├── route.ts          # POST /api/search (3-engine hybrid)
│   │       │   └── autocomplete/route.ts # GET /api/search/autocomplete
│   │       ├── categories/route.ts   # GET /api/categories
│   │       ├── business/
│   │       │   ├── route.ts          # Business accounts API
│   │       │   └── campaigns/route.ts # Ad campaigns API
│   │       ├── users/
│   │       │   ├── route.ts          # User CRUD
│   │       │   ├── engagement/route.ts # User engagement tracking
│   │       │   ├── preferences/route.ts # User preferences
│   │       │   └── saved/route.ts    # Saved POIs
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
│   │   │   ├── SearchBar.tsx         # Search input + autocomplete
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
│   │   ├── useSearch.ts              # Search + autocomplete hooks
│   │   └── useDiscoverPois.ts        # POI discovery
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts             # Drizzle ORM + postgres connection
│   │   │   ├── schema.ts             # Drizzle table definitions (30+ tables)
│   │   │   └── queries/
│   │   │       ├── pois.ts           # POI queries
│   │   │       ├── remarks.ts        # Remark CRUD + generation
│   │   │       ├── search.ts         # Full-text search on remarks
│   │   │       ├── dishes.ts         # Dish/menu queries
│   │   │       ├── business.ts       # Business account queries
│   │   │       ├── engagement.ts     # User engagement queries
│   │   │       └── users.ts          # User queries
│   │   ├── ai/
│   │   │   ├── ollama.ts             # Ollama HTTP client
│   │   │   ├── storyGenerator.ts     # LLM story generation
│   │   │   ├── embeddingBuilder.ts   # Embedding text builder
│   │   │   └── localization.ts       # Multi-language generation
│   │   ├── search/
│   │   │   ├── types.ts              # Unified SearchResult type
│   │   │   ├── queryParser.ts        # 230+ fast-path + LLM fallback
│   │   │   ├── typesense.ts          # Typesense client (search, autocomplete)
│   │   │   ├── semantic.ts           # pgvector cosine similarity search
│   │   │   ├── ranking.ts            # Reciprocal Rank Fusion
│   │   │   ├── geocoding.ts          # Nominatim forward/reverse geocoding
│   │   │   └── overpass.ts           # Overpass API for OSM queries
│   │   ├── enrichment/
│   │   │   └── extractors.ts         # LLM profile extraction by category
│   │   ├── geo/
│   │   │   └── distance.ts           # Haversine distance calculation
│   │   ├── ui/
│   │   │   └── animations.ts         # Framer Motion presets
│   │   ├── web/
│   │   │   ├── scraper.ts            # HTML scraping for business data
│   │   │   ├── searxng.ts            # SearXNG JSON API client
│   │   │   └── webSearch.ts          # Enrichment search queries + scraping
│   │   └── logger.ts                 # Structured logging utility
│   │
│   └── types/
│       └── index.ts                  # All types (Select/Insert for 30+ tables)
│
├── scripts/
│   ├── seed-regions.ts               # Seed regions (Germany -> Bavaria -> Munich)
│   ├── seed-cuisines.ts              # Seed cuisine taxonomy (~100 cuisines)
│   ├── seed-tags.ts                  # Seed tags across all groups
│   ├── seed-pois.ts                  # Seed POIs from local OSM PBF extract
│   ├── enrich-pois.ts                # Web enrichment: SearXNG + scrape + LLM
│   ├── enrich-menus.ts               # Menu/dish enrichment for food POIs
│   ├── generate-stories.ts           # Batch LLM story generation
│   ├── generate-embeddings.ts        # Generate vector embeddings via Ollama
│   ├── sync-typesense.ts             # Sync PostgreSQL -> Typesense index
│   └── lib/
│       ├── concurrency.ts            # Worker pool for parallel processing
│       ├── pbf-reader.ts             # OpenStreetMap PBF file reader
│       └── osm-read.d.ts             # Type declarations for osm-read
│
├── searxng/
│   ├── settings.yml                  # SearXNG engine config
│   └── limiter.toml                  # Rate limiter config (disabled)
│
├── db/
│   └── dump.sql                      # Database dump for quick restore
│
├── data/                             # OSM PBF extracts (gitignored)
│   └── Muenchen.osm.pbf             # Munich OSM extract (~100MB)
│
├── drizzle/
│   └── 0001_enable_extensions.sql    # Enables pgvector + pg_trgm
│
├── docker-compose.yml                # Dev: app + postgres + typesense + searxng
├── docker-compose.local.yml          # Local network overlay
├── docker-compose.prod.yml           # Production config
├── Dockerfile
├── Makefile                          # CLI commands
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── Plan.md                           # Implementation plan + roadmap
└── Obelisk.md                        # Product specification
```

---

## Package Manager

Always use `bun` / `bunx` instead of `npm` / `pnpm` / `npx`.

---

## Commands

### Make (primary interface)

| Command | Description |
|---------|-------------|
| `make setup` | First-time setup (deps, db, models, seed, enrich, stories, search) |
| `make run` | Start app + services at localhost:3000 |
| `make run-local` | Start exposed to local network (same WiFi) |
| `make stop` | Stop services (data preserved) |
| `make rebuild` | Clean rebuild (.next, node_modules) |
| `make destroy` | Stop + delete all data |
| `make logs` | Stream service logs |

### Data Pipeline

| Command | Description |
|---------|-------------|
| `make seed-regions` | Seed regions (Germany -> Bavaria -> Munich) |
| `make seed-cuisines` | Seed cuisine taxonomy |
| `make seed-tags` | Seed tags across all groups |
| `make download-pbf` | Download Munich OSM PBF extract |
| `make seed-pois` | Seed POIs from local OSM extract |
| `make seed-all` | Run all seed scripts in order |
| `make enrich-pois` | Enrich POIs with web data + LLM |
| `make sync-search` | Sync PostgreSQL -> Typesense |
| `make generate-embeddings` | Generate vector embeddings |
| `make search-setup` | Full search pipeline (seed + enrich + sync + embed) |

### Database

| Command | Description |
|---------|-------------|
| `make db-dump` | Export database to db/dump.sql |
| `make db-restore` | Restore database from db/dump.sql + sync search |

### Bun scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server with Turbopack |
| `bun run build` | Production build |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript type checking |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | — | Mapbox GL JS access token |
| `NEXT_PUBLIC_MAPBOX_STYLE_LIGHT` | — | Mapbox style URL for light mode |
| `NEXT_PUBLIC_MAPBOX_STYLE_DARK` | — | Mapbox style URL for dark mode |
| `DATABASE_URL` | `postgresql://obelisk:obelisk_dev@localhost:5432/obelisk` | PostgreSQL connection string |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `gemma3:4b-it-qat` | Story generation model |
| `OLLAMA_SEARCH_MODEL` | `gemma3:4b-it-qat` | Query parsing model |
| `OLLAMA_EMBED_MODEL` | `embeddinggemma:300m` | Embedding model (768-dim) |
| `TYPESENSE_API_KEY` | `obelisk_typesense_dev` | Typesense API key |
| `TYPESENSE_URL` | `http://localhost:8108` | Typesense endpoint |
| `SEARXNG_URL` | `http://localhost:8080` | SearXNG endpoint |
| `SEED_RADIUS` | `1000` | POI seed radius in meters from Munich center |
| `ENRICH_RADIUS` | `$SEED_RADIUS` | Enrichment radius (defaults to SEED_RADIUS) |
| `ENRICH_BATCH_SIZE` | `20` | POIs per enrichment batch |
| `ENRICH_CONCURRENCY` | `3` | Concurrent enrichment workers |

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
| POST | `/api/search` | Hybrid 3-engine search (Typesense + pgvector + DB) |
| GET | `/api/search/autocomplete` | Fast prefix autocomplete via Typesense |
| GET | `/api/categories` | List all categories |
| GET | `/api/poi/[osmId]` | Get external POI details |
| POST | `/api/poi/lookup` | Reverse lookup by coordinates |
| GET/POST | `/api/users` | User CRUD |
| GET/POST | `/api/users/preferences` | User preferences |
| GET/POST | `/api/users/saved` | Saved POIs |
| POST | `/api/users/engagement` | Engagement tracking |
| GET/POST | `/api/business` | Business accounts |
| GET/POST | `/api/business/campaigns` | Ad campaigns |

---

## Database Schema

PostgreSQL 15 with pgvector and pg_trgm extensions. 30+ tables organized into 9 groups:

### 1. Core Tables
- **regions** — Geographic hierarchy (country -> state -> city)
- **categories** — POI categories (15 total: history, food, art, nature, architecture, hidden, views, culture, shopping, nightlife, sports, health, transport, education, services)
- **pois** — Points of interest (10,000+ seeded in Munich) with embeddings (vector(768)), search vectors (tsvector), trigram index on name

### 2. Shared POI Tables (1:1 with pois)
- **contact_info** — Phone[], email[], website[], social media, opening hours
- **price_info** — Price level, admission fees, currency
- **accessibility_info** — Wheelchair, elevator, stroller, dog, parking
- **photos** — POI photos with captions and sort order

### 3. Tag System
- **tags** — Reusable tags with groups (e.g., "pet-friendly" in group "amenities")
- **poi_tags** — Many-to-many POI <-> tag

### 4. Category Profile Tables (1:1 with pois)
- **food_profiles** — 60+ fields: establishment type, dietary options, ambiance, reservations, payment, kids, wifi, etc.
- **history_profiles** — Year built/destroyed, key figures, events, heritage level, preservation status
- **architecture_profiles** — Style, architect, materials, denomination, tower access
- **nature_profiles** — Area, trails, wildlife, facilities, entry points
- **art_culture_profiles** — Collection focus, notable works, guided tours, capacity
- **nightlife_profiles** — Dress code, cover charge, happy hour, DJ, dancefloor
- **shopping_profiles** — Product highlights, brands, secondhand, market days
- **viewpoint_profiles** — Elevation, view direction, visible landmarks, best time

### 5. Food Domain Tables
- **cuisines** — Hierarchical cuisine taxonomy (~100 entries with parent relationships)
- **poi_cuisines** — Many-to-many POI <-> cuisine (with isPrimary flag)
- **dishes** — Global dish catalog with dietary flags and allergens
- **poi_dishes** — POI-specific dish offerings with prices and availability

### 6. Content Tables
- **poi_translations** — Localized POI names, descriptions, review summaries
- **remarks** — AI-generated stories with versioning (locale, version, isCurrent)
- **events** — POI events with dates, types, and ticket info

### 7. Enrichment Pipeline
- **enrichment_log** — Tracks enrichment source, status, and fields updated per POI

### 8. User Tables
- **users** — User accounts with email, locale, role
- **auth_providers** — OAuth/password auth (multi-provider per user)
- **user_preferences** — Favorite categories, dietary needs, exploration style
- **user_saved_pois** — Bookmarked POIs
- **user_visits** — Visit history with duration
- **user_sessions** — App sessions with device and location data

### 9. Monetization Tables
- **business_accounts** — Business profiles linked to POIs
- **ad_campaigns** — Campaigns with targeting, budgets, and scheduling
- **ad_impressions** — Impression/click/conversion tracking
- **user_engagement** — Fine-grained engagement events (dwell time, scroll depth)
- **recommendations** — Scored POI recommendations (organic + sponsored)

---

## Search Architecture

Three-engine hybrid search with Reciprocal Rank Fusion.

**Query flow:** User query -> `queryParser` (230+ fast-path entries or LLM fallback) -> parallel search:
1. **Typesense** — Keyword search with typo tolerance, geo-filtering, facets
2. **pgvector** — Semantic similarity via cosine distance on embeddings
3. **Obelisk DB** — Story text search on remarks table

Results are fused via RRF scoring, geo-penalized by distance, boosted for POIs with stories, deduplicated by POI ID.

**Autocomplete:** Separate fast path via Typesense prefix search (<50ms).

---

## Data Pipeline

The search system requires four sequential stages (run via `make search-setup`):

1. **Seed POIs** (`seed-pois.ts`) — Extract from local OSM PBF, 10 query groups, `SEED_RADIUS` from Munich center, batch upsert with dedup
2. **Enrich POIs** (`enrich-pois.ts`) — Web search via SearXNG + scrape + LLM extraction into category profiles. Resumable (checks enrichment_log). Runs multi-pass per category.
3. **Sync Typesense** (`sync-typesense.ts`) — Full PostgreSQL -> Typesense sync with weighted fields
4. **Generate Embeddings** (`generate-embeddings.ts`) — 768-dim vectors via embeddinggemma:300m into pgvector. Resumable.

---

## Known Issues

### P0: SearXNG Rate Limiting — Blocks Enrichment Pipeline

The enrichment pipeline (`enrich-pois.ts`) depends on SearXNG for web searches, but SearXNG gets rate-limited by upstream engines, making large enrichment runs unreliable.

**How it breaks:**
- SearXNG queries upstream engines (Google, DuckDuckGo, Mojeek, etc.) on every search
- After ~50-100 queries in quick succession, upstream engines start returning 429s or empty results
- SearXNG has no built-in retry/backoff for upstream failures — it just returns 0 results
- The enrichment script sees 0 results and logs the POI as "failed" (no data extracted)
- A single enrichment pass for a food POI makes 3 SearXNG calls (general + reviews + awards), so 20 POIs = 60+ searches

**Current state of mitigations in code:**
- `INTER_BATCH_DELAY_MS = 2000` — 2s pause between batches of 20 POIs
- `INTER_PASS_DELAY_MS = 500` — 500ms pause between enrichment passes per POI
- `ENRICH_CONCURRENCY = 3` — max 3 POIs enriched in parallel
- `MAX_SCRAPE_PER_PASS = 2` — scrape at most 2 URLs per search pass
- 7 SearXNG engines enabled to distribute load across providers
- SearXNG's built-in rate limiter is **disabled** (`limiter: false` in `searxng/settings.yml`)
- Pipeline is resumable (checks `enrichment_log` before re-enriching a POI)

**Why current mitigations are insufficient:**
- 2s batch delay is too short — Google throttles after ~30s of sustained queries
- No exponential backoff in `searxng.ts` — retries once after 1s then gives up
- No detection of rate limiting vs genuine "no results" — both return empty arrays
- Concurrency of 3 means 3 POIs x 2-3 passes = 6-9 near-simultaneous SearXNG calls
- Re-runs help (resumable), but require manual intervention and waiting 10-30min between attempts

**What needs to be solved:**
- Add exponential backoff with jitter in `src/lib/web/searxng.ts` when receiving 429 or 0 results
- Detect rate limiting (0 results from an engine that normally returns results) vs genuine empty results
- Increase delays: `INTER_BATCH_DELAY_MS` to 5000-10000, `INTER_PASS_DELAY_MS` to 2000
- Reduce `ENRICH_CONCURRENCY` to 1 for large runs (>50 POIs)
- Consider enabling SearXNG's built-in rate limiter (`limiter: true`) with appropriate per-engine limits
- Consider caching SearXNG results to avoid re-querying on pipeline re-runs
- Consider a local search cache or pre-fetching strategy to reduce total queries needed

**Key files:**
- `src/lib/web/searxng.ts` — SearXNG client (retry logic lives here)
- `scripts/enrich-pois.ts` — Pipeline orchestration (batching, concurrency, delays)
- `searxng/settings.yml` — Engine configuration
- `searxng/limiter.toml` — Rate limiter config (currently a no-op)

---

## Docker Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| app | Dockerfile (dev target) | 3000 (host network) | Next.js app server |
| postgres | pgvector/pgvector:pg15 | 5432 | Database with vector + trigram extensions |
| typesense | typesense/typesense:30.1 | 8108 | Search engine |
| searxng | searxng/searxng:latest | 8080 | Meta search (enrichment only) |

Ollama runs on the host (not in Docker) at `http://localhost:11434`.

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
| Shopping | `#FF8A65` (Deep Orange) |
| Nightlife | `#CE93D8` (Light Purple) |
| Sports | `#4CAF50` (Green) |
| Health | `#EF5350` (Red) |
| Transport | `#78909C` (Blue Grey) |
| Education | `#FFAB40` (Amber) |
| Services | `#A1887F` (Brown) |

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

- **Product spec:** `Obelisk.md` — features, design, roadmap, brand identity
- **Implementation plan:** `Plan.md` — current progress, Phase 2 roadmap
