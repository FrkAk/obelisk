# Obelisk

Contextual discovery platform -- AI-generated stories surface as users walk through Munich. Single-city MVP. Product spec in `Obelisk.md`, roadmap in `Plan.md`.

## Tech Stack

Next.js 16 (App Router) + React 19, Tailwind CSS v4, Framer Motion v12, Drizzle ORM on PostgreSQL 15 (pgvector + pg_trgm), Typesense v30.1, Mapbox GL JS v3.18 + react-map-gl, Supercluster v8, Zod v4, TanStack Query v5. LLM: Ollama (gemma3:4b-it-qat) on host GPU. Embeddings: embeddinggemma:300m (768-dim).

## Commands

- `make setup` -- full bootstrap (14 steps: docker, migrations, models, datasets, seed, enrich, stories, search)
- `make run` / `make run-local` -- start at localhost:3000 (or LAN-exposed)
- `make stop` / `make destroy` -- stop (preserve data) or nuke everything
- `make rebuild` -- clean rebuild (.next + containers)
- `make seed-all` -- seed regions, cuisines, tags, POIs in order
- `make search-setup` -- full pipeline: seed-pois + enrich + sync-typesense + embeddings
- `make enrich-taxonomy` -- taxonomy enrichment + LLM summaries (resumable, skips existing)
- `make sync-search` / `make generate-embeddings` -- sync Typesense / generate pgvector embeddings
- `make db-dump` / `make db-restore` -- export/restore from `db/dump.sql`
- `bun run dev` / `bun run build` / `bun run lint` / `bun run typecheck`

## Environment

Copy `.env.example.local` to `.env.local`. Required: `NEXT_PUBLIC_MAPBOX_TOKEN`. Defaults exist for everything else in the Makefile. `SEED_RADIUS` defaults to 2000m. Ollama runs on host at `http://localhost:11434`, not in Docker.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Main map page
│   ├── providers.tsx       # React Query + theme providers
│   ├── globals.css         # Tailwind + CSS design tokens
│   └── api/                # API routes (pois, remarks, search, categories)
├── components/
│   ├── map/                # MapView, MapControls, POIPin, ClusterPin, UserLocationMarker
│   ├── search/             # SearchBar, SearchResults
│   ├── poi/                # POICard
│   ├── story/              # StoryNotification
│   ├── layout/             # BottomSheet
│   └── ui/                 # GlassCard, GlassButton, GlassPill, ShimmerText
├── hooks/                  # useGeolocation, useGeofence, useNearbyRemarks, useSearch
├── lib/
│   ├── db/
│   │   ├── client.ts       # Drizzle ORM + postgres connection
│   │   ├── schema.ts       # All table definitions
│   │   └── queries/        # pois, remarks, search
│   ├── ai/                 # ollama client, storyGenerator, embeddingBuilder, localization
│   ├── search/             # queryParser, typesense, semantic, ranking, overpass
│   ├── geo/                # distance (haversine + geoBounds), categories (OSM mapping)
│   └── ui/                 # animations, constants
└── types/
    ├── api.ts              # Client-safe types (NO Drizzle imports)
    ├── db.ts               # Server-only Drizzle insert types
    └── index.ts            # Re-exports both

scripts/                    # Data pipeline: seed, enrich, build-taxonomy, sync-typesense, generate-embeddings
data/                       # External datasets (gitignored): PBF, taxonomy maps, brand maps
db/dump.sql                 # Database dump for quick restore
```

## Architecture Decisions

- **Types split**: `src/types/api.ts` (client-safe, plain interfaces, NO Drizzle imports) vs `src/types/db.ts` (server-only, Drizzle InferInsertModel). Client code imports from `@/types/api`. Server code can import from `@/types`.
- **No barrel exports** -- always import from source file directly (e.g., `@/components/ui/GlassCard`).
- **Logging**: use `createLogger("name")` from `@/lib/logger` in all server code. Never raw `console.*`.
- **API routes**: validate with Zod `safeParse`, return 400 on failure, wrap in try/catch with 500 fallback.
- **Search**: two-engine hybrid (Typesense keyword + pgvector semantic), fused via Reciprocal Rank Fusion in `src/lib/search/ranking.ts`. Query parsing in `queryParser.ts` (230+ fast-path entries, LLM fallback).
- **POI enrichment**: static taxonomy maps in `data/` (built by `build-taxonomy.ts` and `build-brands.ts`), not runtime API calls. POI profile lives in JSONB `pois.profile` column.
- **DB schema**: single source of truth in `src/lib/db/schema.ts`. Migrations via `drizzle-kit push`.
- **Docker**: 3 services (app on host network:3000, postgres:5432, typesense:8108). App container runs `bun run dev`.

## Conventions

- File naming: kebab-case for files/folders, PascalCase for components/types, camelCase for functions/variables.
- Strict TypeScript -- no `any` types.
- Pre-production: breaking changes encouraged. No backward-compat shims, re-exports, or deprecation layers.
- Keep `Plan.md` updated -- mark completed tasks with `[x]`.
- Do NOT create: README.md, test files for trivial code, unnecessary config files.
