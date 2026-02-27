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
| LLM | Ollama (gemma3:4b-it-qat) — NVIDIA GPU |
| Embeddings | Ollama (embeddinggemma:300m) — 768-dim vectors via pgvector |
| Enrichment | Static taxonomy maps (OSM taginfo + Google Product Taxonomy + NSI brands + Wikidata) |
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
│   │       │   ├── route.ts          # POST /api/search (2-engine hybrid)
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
│   │   │   ├── schema.ts             # Drizzle table definitions
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
│   │   │   ├── profileSummary.ts     # Profile summary builder for Typesense
│   │   │   ├── geocoding.ts          # Nominatim forward/reverse geocoding
│   │   │   └── overpass.ts           # Overpass API for OSM queries
│   │   ├── geo/
│   │   │   └── distance.ts           # Haversine distance calculation
│   │   ├── ui/
│   │   │   └── animations.ts         # Framer Motion presets
│   │   └── logger.ts                 # Structured logging utility
│   │
│   └── types/
│       ├── api.ts                    # Client-safe types (plain interfaces, no Drizzle)
│       ├── db.ts                     # Server-only types (Drizzle Insert types)
│       └── index.ts                  # Re-exports api.ts + db.ts
│
├── scripts/
│   ├── download-datasets.ts          # Download external datasets (taxonomy, NSI, taginfo, wikidata)
│   ├── build-taxonomy.ts             # Build tag enrichment map from downloaded data
│   ├── build-brands.ts               # Build brand enrichment map from NSI + Wikidata
│   ├── seed-regions.ts               # Seed regions (Germany -> Bavaria -> Munich)
│   ├── seed-cuisines.ts              # Seed cuisine taxonomy (~100 cuisines)
│   ├── seed-tags.ts                  # Seed tags across all groups
│   ├── seed-pois.ts                  # Seed POIs from local OSM PBF extract
│   ├── enrich-taxonomy.ts            # Taxonomy enrichment + LLM summaries
│   ├── generate-stories.ts           # Batch LLM story generation
│   ├── generate-embeddings.ts        # Generate vector embeddings via Ollama
│   ├── sync-typesense.ts             # Sync PostgreSQL -> Typesense index
│   └── lib/
│       ├── concurrency.ts            # Worker pool for parallel processing
│       ├── pbf-reader.ts             # OpenStreetMap PBF file reader
│       └── osm-read.d.ts             # Type declarations for osm-read
│
├── db/
│   └── dump.sql                      # Database dump for quick restore
│
├── data/                             # External datasets (gitignored)
│   ├── Muenchen.osm.pbf             # Munich OSM extract (~100MB)
│   ├── google_product_taxonomy.txt   # Google Product Taxonomy (~6K categories)
│   ├── nsi/                          # Name Suggestion Index
│   │   ├── nsi.json                  # Brand -> OSM path -> Wikidata QID
│   │   └── dissolved.json            # Discontinued brands
│   ├── taginfo/                      # OSM Taginfo value distributions
│   │   ├── shop.json
│   │   ├── amenity.json
│   │   ├── leisure.json
│   │   ├── tourism.json
│   │   ├── historic.json
│   │   └── ...                       # Subtag files
│   ├── wikidata_brands.json          # Wikidata brand data (industry, products)
│   ├── tag_enrichment_map.json       # Built: OSM tag -> keywords/products
│   └── brand_enrichment_map.json     # Built: Wikidata QID -> brand data
│
├── drizzle/
│   └── 0001_enable_extensions.sql    # Enables pgvector + pg_trgm
│
├── docker-compose.yml                # Dev: app + postgres + typesense
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
| `make setup` | First-time setup (deps, db, models, datasets, seed, enrich, stories, search) |
| `make run` | Start app + services at localhost:3000 |
| `make run-local` | Start exposed to local network (same WiFi) |
| `make stop` | Stop services (data preserved) |
| `make rebuild` | Clean rebuild (.next, node_modules) |
| `make destroy` | Stop + delete all data |
| `make logs` | Stream service logs |

### Data Pipeline

| Command | Description |
|---------|-------------|
| `make download-datasets` | Download external datasets (taxonomy, NSI, taginfo, wikidata) |
| `make build-taxonomy` | Build tag enrichment map from downloaded data |
| `make build-brands` | Build brand enrichment map from NSI + Wikidata |
| `make seed-regions` | Seed regions (Germany -> Bavaria -> Munich) |
| `make seed-cuisines` | Seed cuisine taxonomy |
| `make seed-tags` | Seed tags across all groups |
| `make download-pbf` | Download Munich OSM PBF extract |
| `make seed-pois` | Seed POIs from local OSM extract |
| `make seed-all` | Run all seed scripts in order |
| `make enrich-taxonomy` | Enrich POIs with taxonomy data + LLM summaries |
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
| `OLLAMA_MODEL` | `gemma3:4b-it-qat` | Story generation + enrichment model |
| `OLLAMA_SEARCH_MODEL` | `gemma3:4b-it-qat` | Query parsing model |
| `OLLAMA_EMBED_MODEL` | `embeddinggemma:300m` | Embedding model (768-dim) |
| `TYPESENSE_API_KEY` | `obelisk_typesense_dev` | Typesense API key |
| `TYPESENSE_URL` | `http://localhost:8108` | Typesense endpoint |
| `SEED_RADIUS` | `1000` | POI seed radius in meters from Munich center |

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
| POST | `/api/search` | Hybrid 2-engine search (Typesense + pgvector) |
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

PostgreSQL 15 with pgvector and pg_trgm extensions.

### 1. Core Tables

- **regions** — Geographic hierarchy (country -> state -> city)
- **categories** — POI categories (15 total: history, food, art, nature, architecture, hidden, views, culture, shopping, nightlife, sports, health, transport, education, services)
- **pois** — Points of interest with JSONB `profile` column, embeddings (vector(768)), search vectors (tsvector), trigram index on name

### 2. POI Profile (JSONB on pois table)

Each POI has a `profile` JSONB column with:

```typescript
interface PoiProfile {
  subtype?: string;               // e.g., "clothes", "restaurant", "park"
  osmExtracted?: {                // raw OSM subtag values preserved for enrichment
    [key: string]: string;
  };
  keywords: string[];             // semantic keywords: ["clothing", "fashion", "apparel"]
  products: string[];             // product/service terms: ["jackets", "dresses", "shirts"]
  summary: string;                // LLM-generated 2-3 sentence description
  enrichmentSource: string;       // "seed" | "taxonomy" | "taxonomy+brand" | "taxonomy+brand+llm"
  attributes: {
    [key: string]: unknown;       // category-specific: { priceLevel: "moderate", yearBuilt: 1468 }
  };
}
```

### 3. Shared POI Tables (1:1 with pois)

- **contact_info** — Phone[], email[], website[], social media, opening hours
- **accessibility_info** — Wheelchair, elevator, stroller, dog, parking
- **photos** — POI photos with captions and sort order

### 4. Tag System

- **tags** — Reusable tags with groups (e.g., "pet-friendly" in group "amenities")
- **poi_tags** — Many-to-many POI <-> tag

### 5. Food Domain Tables

- **cuisines** — Hierarchical cuisine taxonomy (~100 entries with parent relationships)
- **poi_cuisines** — Many-to-many POI <-> cuisine (with isPrimary flag)
- **dishes** — Global dish catalog with dietary flags and allergens
- **poi_dishes** — POI-specific dish offerings with prices and availability

### 6. Content Tables

- **poi_translations** — Localized POI names, descriptions, review summaries
- **remarks** — AI-generated stories with versioning (locale, version, isCurrent)
- **events** — POI events with dates, types, and ticket info

### 7. User Tables

- **users** — User accounts with email, locale, role
- **auth_providers** — OAuth/password auth (multi-provider per user)
- **user_preferences** — Favorite categories, dietary needs, exploration style
- **user_saved_pois** — Bookmarked POIs
- **user_visits** — Visit history with duration
- **user_sessions** — App sessions with device and location data

### 8. Monetization Tables

- **business_accounts** — Business profiles linked to POIs
- **ad_campaigns** — Campaigns with targeting, budgets, and scheduling
- **ad_impressions** — Impression/click/conversion tracking
- **user_engagement** — Fine-grained engagement events (dwell time, scroll depth)
- **recommendations** — Scored POI recommendations (organic + sponsored)

---

## Search Architecture

Two-engine hybrid search with Reciprocal Rank Fusion.

**Query flow:** User query -> `queryParser` (230+ fast-path entries or LLM fallback) -> parallel search:

1. **Typesense** — Keyword search with typo tolerance, geo-filtering, facets
2. **pgvector** — Semantic similarity via cosine distance on embeddings

Results are fused via RRF scoring, geo-penalized by distance, boosted for POIs with stories, deduplicated by POI ID.

**Autocomplete:** Separate fast path via Typesense prefix search (<50ms).

---

## `make setup` — Full Bootstrap (14 steps)

| Step | Command | What it does |
|------|---------|-------------|
| 1/14 | `docker compose up -d --build` | Build + start postgres, typesense, app containers |
| 2/14 | `drizzle-kit push` | Enable pgvector + pg_trgm extensions, apply schema migrations |
| 3/14 | `ollama pull` x3 | Pull gemma3:4b-it-qat, embeddinggemma:300m |
| 4/14 | `download-datasets.ts` | Download external datasets (Google taxonomy, NSI, taginfo, Wikidata) |
| 5/14 | `build-taxonomy.ts` | Build tag enrichment map from downloaded data |
| 6/14 | `build-brands.ts` | Build brand enrichment map from NSI + Wikidata |
| 7/14 | `seed-regions.ts` | Seed regions: Germany -> Bavaria -> Munich |
| 8/14 | `seed-cuisines.ts` | Seed ~100 cuisine taxonomy entries |
| 9/14 | `seed-tags.ts` | Seed tags across all groups |
| 10/14 | `download-pbf` | Download Munich OSM PBF extract (~100MB from bbbike.org) |
| 11/14 | `seed-pois.ts` | Parse OSM PBF, upsert POIs within `SEED_RADIUS` of Munich center |
| 12/14 | `enrich-taxonomy.ts` | Taxonomy enrichment: merge keywords/products + LLM summaries |
| 13/14 | `generate-stories.ts` | Batch LLM story generation (non-blocking, `\|\| true`) |
| 14/14 | `sync-typesense.ts` + `generate-embeddings.ts` | Sync search index + generate 768-dim vectors |

`SEED_RADIUS` defaults to `100` (meters) in the Makefile for quick first-time setup. Increase for production runs.

---

## Data Pipeline

Four sequential stages (run via `make search-setup`):

1. **Seed POIs** (`seed-pois.ts`) — Extract from local OSM PBF, 10 query groups, `SEED_RADIUS` from Munich center, batch upsert with dedup. Writes initial JSONB profile with `subtype` and `osmExtracted` fields.
2. **Enrich POIs** (`enrich-taxonomy.ts`) — Merge keywords/products from static taxonomy maps, add brand data from Wikidata, generate LLM summaries. Resumable (skips POIs with existing summary).
3. **Sync Typesense** (`sync-typesense.ts`) — Full PostgreSQL -> Typesense sync with weighted fields. All POIs indexed.
4. **Generate Embeddings** (`generate-embeddings.ts`) — 768-dim vectors via embeddinggemma:300m into pgvector. All POIs get embeddings. Resumable.

---

## Taxonomy Enrichment Pipeline (`scripts/enrich-taxonomy.ts`)

### Overview

Enriches POIs using static JSON taxonomy maps and LLM synthesis. No external API calls at runtime -- all data comes from pre-built local files.

### Data Sources

| File | Content | Built by |
|------|---------|----------|
| `data/tag_enrichment_map.json` | OSM tag -> keywords, products, subtags | `build-taxonomy.ts` |
| `data/brand_enrichment_map.json` | Wikidata QID -> brand name, products, industry | `build-brands.ts` |

### Enrichment Flow

For each POI:
1. Read `pois.profile.osmExtracted` and determine primary OSM tag (e.g., `shop=clothes`)
2. Look up `tag_enrichment_map[primaryTag]` -- merge keywords + products into profile
3. If `brand:wikidata` exists, look up `brand_enrichment_map[wikidataQID]` -- merge brand-specific products
4. If POI has specific subtags (e.g., `clothes=women`), refine keywords
5. LLM synthesis: call Ollama (`gemma3:4b-it-qat`) to generate 2-3 sentence description grounded in merged data
6. Update `pois.profile` JSONB with: summary, keywords, products, enrichmentSource

### Resumability

- Skips POIs where `profile.summary` is already non-empty
- Safe to re-run: `make enrich-taxonomy` picks up where it left off

### Key Files

| File | Role |
|------|------|
| `scripts/enrich-taxonomy.ts` | Enrichment orchestration (batching, LLM synthesis) |
| `scripts/build-taxonomy.ts` | Builds tag enrichment map from taginfo + Google taxonomy |
| `scripts/build-brands.ts` | Builds brand enrichment map from NSI + Wikidata |
| `scripts/download-datasets.ts` | Downloads all external datasets |
| `src/lib/ai/ollama.ts` | `generateText()` for LLM summary synthesis |

---

## Docker Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| app | Dockerfile (dev target) | 3000 (host network) | Next.js app server |
| postgres | pgvector/pgvector:pg15 | 5432 | Database with vector + trigram extensions |
| typesense | typesense/typesense:30.1 | 8108 | Search engine |

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

### Breaking Changes Policy

This project is in **active development** (pre-production). Breaking changes to interfaces, return types, function signatures, and APIs are encouraged when they improve the codebase. Do NOT add backward-compatibility shims, wrapper functions, re-exports, or deprecation layers. Just change the code and update all callers. Every file is fair game.

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

## Types Architecture

Types are split into client-safe and server-only modules:

- **`src/types/api.ts`** — Client-safe types. Plain TypeScript interfaces with NO Drizzle imports. All Select types, composite types, Zod schemas, geo types, constants. Import from `@/types/api` in components, hooks, and client code.
- **`src/types/db.ts`** — Server-only types. Drizzle `InferInsertModel` types for DB writes. Only used in API routes, queries, and scripts.
- **`src/types/index.ts`** — Re-exports both. Server files can import from `@/types`.

No barrel exports exist in the codebase — always import directly from the source file (e.g., `@/components/ui/GlassCard`, not `@/components/ui`).

---

## Logging

All API routes use `createLogger` from `@/lib/logger.ts` instead of raw `console.*`. Each route file creates a named logger:

```typescript
import { createLogger } from "@/lib/logger";
const log = createLogger("route-name");
log.info("message");
log.error("message", error);
```

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
