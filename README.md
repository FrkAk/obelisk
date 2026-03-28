# Obelisk

Maps show you where things are but never tell you why they matter. You walk past a century old bakery, a courtyard where a revolution started, or a bar that every local knows about, and the map says nothing. Obelisk fills that gap.

Obelisk is a contextual discovery platform that generates AI remarks about real places and surfaces them as you explore a city. It pulls every point of interest from OpenStreetMap, enriches each one with taxonomy data, Wikipedia, brand info, and LLM generated summaries, then delivers that context through the map in real time. The result is a map that understands what makes each place worth knowing about.

Search goes beyond matching names. You can type things like "quiet place to read near the river" or "where do locals eat lunch" and the hybrid search engine combines keyword matching with semantic understanding to find relevant places. This is still early and evolving.

Everything runs on your own hardware. No cloud AI APIs, no usage fees, no data leaving your machine. The entire stack is designed around what a home computer with a GPU can do.

## How It Works

Obelisk seeds points of interest from OpenStreetMap, enriches them with taxonomy data and LLM generated summaries, then indexes everything for hybrid search. As you interact with the map, the database fills itself on demand: places you visit get enriched in real time, so pre seeding an entire city is never required.

If you do want to pre seed a full city, the enrichment pipeline supports distributed processing across multiple machines on your local network. Enriching tens of thousands of places with LLM summaries takes a long time on a single computer, so you can spread the work across whatever hardware you have available.

Search combines two engines using Reciprocal Rank Fusion: Typesense handles keyword queries with typo tolerance, while PostgreSQL with pgvector provides semantic understanding through local embeddings.

## Prerequisites

| Dependency | Purpose |
|------------|---------|
| Docker and Compose | Runs PostgreSQL, Typesense, and the app |
| Ollama (on host with GPU) | Local LLM inference for enrichment and remarks |
| Mapbox access token | Map tiles and geocoding (free tier works) |

## Quick Start

Clone the repository and copy the environment template:

```
git clone https://github.com/obelisk/obelisk.git
cd obelisk
cp .env.example .env
```

Add your Mapbox token to `.env` (the `NEXT_PUBLIC_MAPBOX_TOKEN` field).

Run the full setup pipeline:

```
make setup
```

This builds containers, pulls Ollama models, downloads map data, seeds places, runs enrichment, and indexes everything for search. You can resume from any phase with `make setup FROM=N`.

Start the development server:

```
make run
```

Open http://localhost:3000 in your browser.

For a faster start using a database snapshot (if you have one):

```
make setup-quick
```

## Project Structure

```
src/
  app/            Next.js App Router (pages and API routes)
  components/     React components (map, search, poi, remark, ui)
  hooks/          Custom React hooks (geolocation, geofence, search)
  lib/
    ai/           Ollama client, remark generator, embeddings
    db/           Drizzle ORM schema and queries
    search/       Hybrid search (Typesense + pgvector + ranking)
    geo/          Distance calculations, city configs, OSM categories
  types/          TypeScript interfaces (api.ts for client, db.ts for server)
scripts/          Data pipeline (seed, enrich, sync, embeddings)
```

## Commands

Run `make help` to see all available targets. The key ones:

| Command | What it does |
|---------|-------------|
| `make setup` | Full bootstrap from scratch |
| `make setup-quick` | Restore from database snapshot |
| `make run` | Start on localhost:3000 |
| `make run-local` | Expose to local network (same WiFi) |
| `make stop` | Stop services, data preserved |
| `make destroy` | Stop and delete all data |
| `make seed-city` | Seed a new city (`SEED_LOCATION=berlin make seed-city`) |
| `make enrich-pois` | Full LLM enrichment with summaries |
| `make enrich-distributed` | Start coordinator and workers for LAN enrichment |
| `make sync-search` | Rebuild the Typesense search index |
| `make generate-embeddings` | Regenerate vector embeddings |
| `make db-dump` | Export database to db/dump.sql |
| `make db-restore` | Restore database from db/dump.sql |

## Supported Cities

Munich, Berlin, Vienna, and Istanbul are preconfigured. Set `SEED_LOCATION` in your `.env` or pass it directly:

```
SEED_LOCATION=berlin make seed-city
```

## Distributed Enrichment

Pre seeding is optional. The database enriches places on demand as you use the app. But if you want a full city ready in advance, enrichment can be distributed across multiple computers on your local network.

On the host machine:

```
make enrich-distributed
```

This starts the coordinator, prints connection instructions for worker machines, and begins local enrichment. Each worker needs Ollama with a GPU and a clone of the repo. The Makefile prints the exact commands to run on each worker.

This exists because enriching a city like Munich (tens of thousands of places) with LLM summaries can take hours on one machine. With two or three home computers running in parallel, it becomes practical.

## Tech Stack

Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Drizzle ORM, PostgreSQL 15 (pgvector + pg_trgm), Typesense, Mapbox GL JS, Supercluster, Zod, TanStack Query, Ollama.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE). A commercial license is also available. See [LICENSING.md](LICENSING.md) for details.
