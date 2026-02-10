# Search System Overhaul

## Problem

Obelisk's search was fundamentally broken. We were using Nominatim (a geocoder built for address lookup) as a POI search engine. "Pizza near me" returned 0 results. "Odeonplatz" from a different viewport returned 0 results. The DB only had 408 POIs from 6 OSM categories within 2km of Marienplatz — no restaurants, cafes, shops, hospitals, or parks. 13 specific issues were cataloged in `SearchProblems.md`, all stemming from two root causes: **not enough data** and **no proper search infrastructure**.

## Solution

A complete rewrite replacing Nominatim-based geocoding with a three-layer hybrid search: Typesense (keyword), pgvector (semantic), and Obelisk DB (stories), fused with Reciprocal Rank Fusion.

---

## Data Pipeline

The search system requires data to be built in four sequential stages before any user search can work. This runs once during setup via `make search-setup` and can be re-run at any time.

### Stage 1: Seed POIs from OpenStreetMap (`make seed-pois`)

**Script:** `scripts/seed-pois.ts`

We extract real-world POI data from OpenStreetMap via the [Overpass API](https://overpass-api.de). The process:

1. **Center point and radius**: Munich center (48.137, 11.576) with configurable `SEED_RADIUS` (default 10km). This is a circle around Marienplatz that captures the whole city.

2. **10 query groups** hit the Overpass API sequentially (to avoid timeouts):
   - Food & Drink: restaurant, cafe, bar, pub, fast_food, biergarten, ice_cream, food_court
   - Culture & Entertainment: theatre, cinema, museum, gallery, library, community_centre, nightclub
   - Services: hospital, pharmacy, clinic, doctors, dentist, bank, post_office, police, fire_station
   - Education: university, school, college, kindergarten
   - Tourism: hotel, hostel, guest_house, attraction, artwork, viewpoint, information
   - Historic: everything tagged `historic`
   - Leisure: park, garden, nature_reserve, sports_centre, stadium, fitness_centre, swimming_pool, pitch, playground
   - Shopping: everything tagged `shop`
   - Healthcare: everything tagged `healthcare`
   - Transport: bus_station, railway station, tram_stop

3. **Per query group**, we build an Overpass QL query that fetches both nodes and ways (for larger POIs like parks that are drawn as polygons):
   ```
   [out:json][timeout:120];
   (
     node["amenity"="restaurant"]["name"](around:10000,48.137,11.576);
     way["amenity"="restaurant"]["name"](around:10000,48.137,11.576);
     ...
   );
   out body center;
   ```
   The `["name"]` filter ensures we only get POIs that have a human-readable name. `out body center` gives us the centroid for ways.

4. **Deduplication** by OSM ID across query groups (a biergarten tagged as both `amenity=biergarten` and `tourism=attraction` would appear in multiple groups).

5. **Category assignment**: Each POI is mapped to one of 15 Obelisk categories (history, food, art, nature, architecture, hidden, views, culture, shopping, nightlife, sports, health, transport, education, services) based on its OSM tags. A `determineCategorySlug()` function applies priority rules — e.g., `historic` tag wins over everything, food amenities map to "food", bars/pubs/nightclubs map to "nightlife".

6. **Tag extraction**: We pull `osmAmenity` (the primary OSM type like "restaurant" or "pharmacy") and `osmCuisine` (the cuisine tag like "italian" or "kebab") into dedicated columns for later use in search filtering and enrichment.

7. **Database upsert**: POIs are inserted in batches of 100 with `ON CONFLICT (osm_id) DO UPDATE` — so re-running the seed updates existing records rather than duplicating them.

**Result**: ~10,000+ POIs in PostgreSQL covering every named place in Munich.

### Stage 2: Enrich POIs with Web Data + LLM (`make enrich-pois`)

**Script:** `scripts/enrich-pois.ts`

Raw OSM data only gives us a name, coordinates, and tags. To enable semantic search ("cozy cafe for a date"), we need rich text descriptions. The enrichment pipeline adds this:

1. **Select unenriched POIs**: Query all POIs where `enriched_at IS NULL` — this makes the process resumable. If it crashes at POI #500, re-running picks up at #501.

2. **Per POI**, the pipeline does:

   **a) Build a search query** using `buildSearchQuery()` from `src/lib/web/webSearch.ts`:
   - For food: `"{name} {city} restaurant reviews menu"`
   - For history: `"{name} {city} history facts significance"`
   - For art: `"{name} {city} museum gallery art collection"`
   - Each category has a tailored pattern to get the most relevant web results.

   **b) Search the web via SearXNG** (`src/lib/web/searxng.ts`):
   - SearXNG is a self-hosted meta search engine running at `http://searxng:8080` inside Docker
   - It aggregates results from Google, DuckDuckGo, Wikipedia, and other engines
   - We request the top 5 results in JSON format
   - No API keys needed — SearXNG is fully self-hosted

   **c) Scrape the top 3 URLs** using `scrapeWebsite()` from `src/lib/web/scraper.ts`:
   - Fetches each URL with a 5-second timeout
   - Extracts title, meta description, and main content (stripped of HTML)
   - Truncates to 500 characters per page to keep LLM context manageable
   - If scraping fails, falls back to SearXNG snippet text

   **d) Generate a structured summary via LLM** using gemma3 through Ollama:
   - A category-specific prompt is built with hints:
     - Food: "Focus on cuisine type, price range, atmosphere, and what dishes they are known for."
     - History: "Focus on historical era, significance, key events, and architectural details."
     - Nightlife: "Focus on music, atmosphere, drink specialties, and crowd type."
     - (15 categories total, each with tailored instructions)
   - The scraped web content is injected into the prompt
   - The LLM responds in **labeled text format** (not JSON — more reliable with smaller models):
     ```
     DESCRIPTION: A cozy Italian restaurant in the heart of Schwabing known for handmade pasta...
     REVIEW_SUMMARY: Visitors praise the authentic flavors and intimate atmosphere...
     PRICE_RANGE: moderate
     ATMOSPHERE: cozy, romantic, intimate
     SPECIALTIES: Known for their handmade tagliatelle and tiramisu.
     ```
   - We parse this with simple `KEY: value` line splitting

   **e) Store results** in PostgreSQL:
   - `description` — the 2-3 sentence LLM description
   - `review_summary` — what visitors say
   - `attributes` — JSONB with priceRange, atmosphere array, specialties
   - `web_context` — JSONB with source URLs and the search query used
   - `enriched_at` — timestamp marking this POI as done

3. **Batching**: Processes 10 POIs at a time with 1-second delays between batches to avoid overwhelming SearXNG and Ollama.

**Result**: Every POI now has a rich text description, review summary, and structured attributes — the raw material for both keyword and semantic search.

### Stage 3: Sync to Typesense (`make sync-search`)

**Script:** `scripts/sync-typesense.ts`

Typesense is a dedicated search engine (like Elasticsearch but simpler). We sync all PostgreSQL data into it for fast keyword search:

1. **Initialize the collection**: Creates (or recreates if schema changed) a Typesense collection named "pois" with fields:
   - `name` (string, weight 5) — highest search priority
   - `description` (string, weight 3) — LLM-generated description
   - `reviewSummary` (string, weight 2) — visitor opinions
   - `cuisine` (string, facet, weight 2) — "italian", "kebab", etc.
   - `amenityType` (string, facet, weight 1) — "restaurant", "pharmacy", etc.
   - `category` (string, facet) — one of our 15 categories
   - `location` (geopoint) — latitude/longitude for geo-filtering
   - `hasStory` (bool, facet) — whether this POI has an Obelisk story
   - `hasOutdoorSeating`, `hasWifi` (bool) — from OSM tags
   - `priceRange`, `atmosphere` — from enrichment

2. **Query all POIs** from PostgreSQL with their category slugs.

3. **Check which POIs have stories** by querying the `remarks` table and building a Set of POI IDs.

4. **Build Typesense documents** — each POI becomes a document with all searchable fields, including the `hasStory` flag and extracted attributes.

5. **Bulk upsert** in batches of 100.

**Result**: Typesense now has a full-text search index over all POIs with typo tolerance, geo-filtering, and faceted search on category/cuisine/amenity.

### Stage 4: Generate Embeddings (`make generate-embeddings`)

**Script:** `scripts/generate-embeddings.ts`

For semantic search ("cozy place for a date"), we need vector embeddings — numerical representations of meaning:

1. **Select unembedded POIs**: Query all POIs where `embedding IS NULL` — resumable like enrichment.

2. **Per POI, build embedding text** by concatenating:
   ```
   "{name}. {osmAmenity}. {osmCuisine}. {description}"
   ```
   Example: `"Augustiner-Keller. biergarten. german. A historic beer garden dating back to 1812, famous for its chestnut-shaded courtyard..."`

3. **Generate embedding** via Ollama's `/api/embed` endpoint using the `mxbai-embed-large` model:
   - Runs on the existing NVIDIA GPU
   - Produces a 1024-dimensional float vector
   - This vector captures the *meaning* of the text — similar places get similar vectors

4. **Store in PostgreSQL** using pgvector:
   ```sql
   UPDATE pois SET embedding = '[0.023, -0.456, ...]'::vector WHERE id = $1
   ```
   pgvector stores this as a compact binary vector with an HNSW index for fast nearest-neighbor search.

5. **Batching**: Processes 10 POIs at a time.

**Result**: Every POI now has a 1024-dim vector in pgvector, enabling "find places similar in *meaning* to this query" searches.

---

## How Search Works (User Flow)

### What the User Sees

1. User opens the app and sees the map
2. User taps the search bar and starts typing (e.g., "piz...")
3. **Autocomplete** suggestions appear within ~50ms as they type (prefix search via Typesense)
4. User either selects a suggestion or submits their full query ("pizza near me")
5. Results appear ranked by relevance, with distances and category icons
6. User taps a result to fly to it on the map

### What Happens Under the Hood

When the user submits a search query, here's the exact sequence:

#### Step 1: Frontend (`useSearch` hook)

The `useSearch` hook in `src/hooks/useSearch.ts` sends a POST to `/api/search`:

```json
{
  "query": "pizza near me",
  "location": { "latitude": 48.137, "longitude": 11.576 },
  "radius": 5000,
  "limit": 20
}
```

The user's GPS location is always included so results can be sorted by distance.

#### Step 2: Query Understanding (`queryParser.ts`)

The search route calls `parseQueryIntent(query)` to understand what the user wants. This has three tiers:

**Tier 1 — Discovery check**: If the query is "surprise me", "discover", "explore", etc., we skip search entirely and return a random story from the DB within the user's radius.

**Tier 2 — Fast-path (230+ entries)**: A hardcoded lookup table maps common queries to structured intents instantly (0ms). Examples:
- `"pizza"` → `{ category: "food", keywords: ["pizza", "restaurant"], cuisineTypes: ["pizza"] }`
- `"apotheke"` → `{ category: "health", keywords: ["pharmacy"] }`
- `"döner"` → `{ category: "food", keywords: ["döner", "kebab", "fast_food"], cuisineTypes: ["kebab"] }`
- `"schwimmbad"` → `{ category: "sports", keywords: ["swimming_pool"] }`
- `"cocktail bar"` → `{ category: "nightlife", keywords: ["cocktail_bar", "bar"] }`

Covers English, German, food slang (currywurst, breze, simit), nightlife terms (kneipe, shisha), and Munich-specific queries.

Multi-word queries are matched by trying the full phrase first, then progressively shorter prefixes: "pizza near me" → tries "pizza near me" → "pizza near" → "pizza" (match!).

**Tier 3 — LLM fallback**: For queries the fast-path doesn't cover (e.g., "quiet café with wifi and outdoor seating"), we call gemma3 via Ollama with a structured prompt. The LLM responds in labeled text format:

```
MODE: keyword
KEYWORDS: cafe, coffee
CATEGORY: food
PLACE_NAME: none
CUISINE: cafe
```

This is parsed with simple line-by-line regex — much more reliable than the old JSON parsing approach. Temperature is set to 0.1 for deterministic output, and we limit to 100 tokens.

If the LLM fails, a final heuristic parser splits the query into words and uses them as keywords.

The output is a `ParsedIntent` with: category, keywords, placeName, cuisineTypes, and filters (wifi, outdoor, quiet).

#### Step 3: Parallel Search (three engines at once)

The search route fires three searches in parallel using `Promise.allSettled` — if one fails, the others still return results:

**Engine A — Typesense (keyword search)**:
- Queries the Typesense index with the extracted keywords
- Applies filters: category facet, cuisine facet, hasWifi, hasOutdoorSeating
- Geo-filters to the user's radius
- Typesense handles typo tolerance ("pizzza" still finds pizza) and relevance scoring
- Fields are weighted: name (5x), description (3x), reviewSummary (2x), cuisine (2x), amenityType (1x)
- Results sorted by distance from user when location is provided
- Target latency: < 200ms

**Engine B — pgvector (semantic search)**:
- Embeds the raw query text using mxbai-embed-large (same model used during indexing)
- Runs a cosine similarity search against all POI embeddings within a geo bounding box:
  ```sql
  SELECT id, name, 1 - (embedding <=> $1::vector) as similarity
  FROM pois
  WHERE embedding IS NOT NULL
    AND latitude BETWEEN $minLat AND $maxLat
    AND longitude BETWEEN $minLon AND $maxLon
  ORDER BY embedding <=> $1::vector
  LIMIT 10
  ```
- This finds POIs that are semantically similar to the query even without keyword matches
- "cozy place for a date" would match a café described as "intimate atmosphere, candlelit tables"
- Target latency: < 500ms (dominated by the embedding API call)

**Engine C — Obelisk DB (story search)**:
- Searches the `remarks` table (our AI-generated stories) for text matches in title, content, and POI name
- Uses ILIKE pattern matching within a geo bounding box
- This surfaces stories that mention the query — e.g., searching "beer" might find a story about Munich's brewing history attached to Hofbräuhaus

#### Step 4: Ranking with Reciprocal Rank Fusion (`ranking.ts`)

The three result lists are fused into a single ranked list using RRF:

1. **RRF scoring**: Each result gets a score based on its rank in each list:
   ```
   score = Σ 1/(60 + rank)
   ```
   where `k=60` is a standard smoothing constant. A result ranked #1 in Typesense and #3 in semantic search gets:
   ```
   1/(60+0) + 1/(60+2) = 0.0167 + 0.0161 = 0.0328
   ```
   Results appearing in multiple engines get boosted because their scores accumulate.

2. **Geo-distance penalty**: Closer results score higher:
   ```
   score *= max(0.5, 1 - distance/maxRadius)
   ```
   A POI right next to you keeps its full score. A POI at the edge of the search radius gets halved.

3. **Story bonus**: POIs with Obelisk stories (remarks) get `+0.1` added to their score — a tiebreaker that surfaces storytelling-enabled POIs.

4. **Deduplication**: The same POI might appear in all three engines. We deduplicate by POI ID, keeping the highest-scoring entry and merging story data from the Obelisk DB results.

5. **Sort** by final score descending, return top N results.

#### Step 5: Response

The API returns:

```json
{
  "results": [
    {
      "id": "uuid",
      "name": "La Vecchia Masseria",
      "category": "food",
      "latitude": 48.152,
      "longitude": 11.581,
      "distance": 342,
      "score": 0.0412,
      "description": "Authentic Italian restaurant...",
      "cuisine": "italian",
      "amenityType": "restaurant",
      "hasStory": true,
      "remark": { "title": "...", "teaser": "...", "content": "..." },
      "source": "typesense"
    }
  ],
  "intent": {
    "category": "food",
    "keywords": ["pizza", "restaurant"],
    "cuisineTypes": ["pizza"]
  },
  "timing": {
    "parseMs": 0,
    "typesenseMs": 45,
    "semanticMs": 312,
    "obeliskMs": 12,
    "totalMs": 358
  }
}
```

The `timing` object lets us monitor latency per engine.

### Autocomplete Flow (Separate Path)

When the user types in the search bar, a separate debounced flow runs:

1. `useAutocomplete` hook waits 150ms after the last keystroke
2. Sends GET to `/api/search/autocomplete?q=mar&lat=48.137&lon=11.576`
3. The autocomplete route calls Typesense's prefix search directly — no LLM, no semantic search
4. Typesense returns up to 5 name matches sorted by proximity
5. Results appear as suggestions under the search bar

This is designed to be < 50ms end-to-end.

---

## Infrastructure

| Component | Container | Port | Purpose |
| --- | --- | --- | --- |
| PostgreSQL | `pgvector/pgvector:pg15` | 5432 | POI data, stories, vector embeddings |
| Typesense | `typesense/typesense:27.1` | 8108 | Keyword search, autocomplete, facets |
| SearXNG | `searxng/searxng:latest` | 8080 | Web search for POI enrichment |
| Ollama | host or container | 11434 | LLM (gemma3) + embeddings (mxbai-embed-large) |
| Next.js | `obelisk-app` | 3000 | App server, API routes |

### How the LLM is Used

The LLM (gemma3 via Ollama) is used in two places:

1. **Query parsing fallback** — When a user query doesn't match any of the 230+ fast-path entries, gemma3 parses it into structured intent (category, keywords, cuisine). Uses the `OLLAMA_SEARCH_MODEL` env var, temperature 0.1, max 100 tokens. This adds ~1-3 seconds but only triggers for unusual queries.

2. **POI enrichment** (offline, during `make enrich-pois`) — gemma3 reads scraped web content about each POI and generates a description, review summary, price range, and atmosphere tags. Uses temperature 0.3, max 512 tokens. This runs once per POI and the results are stored in the database.

The LLM is NOT used during normal search execution (the old system called the LLM on every search to generate a "conversational response" — we removed that).

### How Embeddings Work

Embeddings are generated by `mxbai-embed-large`, a 1024-dimensional embedding model running through Ollama on the NVIDIA GPU.

**What is an embedding?** A list of 1024 floating-point numbers that represents the *meaning* of a piece of text. Similar texts produce similar vectors. "cozy Italian restaurant" and "intimate trattoria" would have vectors that are close together in 1024-dimensional space, even though they share zero keywords.

**Cosine similarity** measures how close two vectors are (1.0 = identical, 0.0 = unrelated). During search, we embed the user's query and find POIs whose embeddings have the highest cosine similarity to it.

**pgvector** stores these vectors in PostgreSQL and provides the `<=>` operator for cosine distance. An HNSW index makes nearest-neighbor lookups fast without scanning every row.

---

## Makefile Commands

```bash
make seed-pois            # Stage 1: Extract POIs from OSM (10km radius)
make enrich-pois          # Stage 2: Web enrichment via SearXNG + LLM (long-running, resumable)
make sync-search          # Stage 3: Sync PostgreSQL -> Typesense
make generate-embeddings  # Stage 4: Generate vector embeddings via mxbai-embed-large
make search-setup         # All 4 stages in sequence
```

Stages 2 and 4 are resumable — they only process POIs that haven't been enriched/embedded yet. You can safely kill and re-run them.

---

## Architecture Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Search engine | Typesense | Typo tolerance, geo-search, facets, self-hosted, single binary |
| Embedding model | mxbai-embed-large (1024-dim) | Runs on existing NVIDIA GPU via Ollama |
| Web search | SearXNG | Self-hosted, no API keys, no rate limits |
| Ranking | Reciprocal Rank Fusion | Simple, effective fusion of heterogeneous result lists |
| Query parser output | Labeled text (not JSON) | More reliable with gemma3, simpler parsing |
| PostgreSQL image | pgvector/pgvector:pg15 | Drop-in replacement, adds vector extension |
| Three-engine parallel search | Promise.allSettled | One engine failing doesn't break the whole search |

---

## Files

### Deleted
- `src/lib/search/nominatim.ts` (405 lines) — Replaced by Typesense + geocoding.ts

### New Files
| File | Purpose |
| --- | --- |
| `src/lib/search/typesense.ts` | Typesense client: init, search, autocomplete, browse, upsert |
| `src/lib/search/semantic.ts` | pgvector cosine similarity + Ollama embeddings |
| `src/lib/search/ranking.ts` | Reciprocal Rank Fusion algorithm |
| `src/lib/search/geocoding.ts` | Nominatim geocoding only (forward + reverse) |
| `src/lib/web/searxng.ts` | SearXNG JSON API client |
| `scripts/enrich-pois.ts` | Batch web enrichment: SearXNG + scrape + LLM |
| `scripts/sync-typesense.ts` | PostgreSQL to Typesense sync |
| `scripts/generate-embeddings.ts` | pgvector embedding generation |
| `src/app/api/search/autocomplete/route.ts` | Fast autocomplete endpoint |
| `searxng/settings.yml` | SearXNG configuration |
| `drizzle/0001_enable_extensions.sql` | Enables pgvector + pg_trgm extensions |

### Rewritten
| File | What changed |
| --- | --- |
| `src/app/api/search/route.ts` | Parallel 3-engine search + RRF ranking |
| `src/lib/search/queryParser.ts` | 230+ fast-path, labeled text LLM fallback |
| `src/lib/search/types.ts` | Unified SearchResult type |
| `src/lib/db/queries/search.ts` | Simplified text search on remarks |
| `src/lib/search/index.ts` | New barrel exports |
| `scripts/seed-pois.ts` | 10km radius, all OSM categories, batch upsert |
| `src/hooks/useSearch.ts` | New API shape + useAutocomplete hook |
| `src/components/search/SearchBar.tsx` | Autocomplete dropdown |
| `src/components/search/SearchResults.tsx` | Unified SearchResult rendering |

### Modified
| File | Change |
| --- | --- |
| `docker-compose.yml` | Added Typesense, SearXNG; switched to pgvector image |
| `src/lib/db/schema.ts` | 8 new columns on `pois` + new indexes |
| `Makefile` | Search pipeline commands + mxbai-embed-large in setup |
| `package.json` | Added `typesense` dependency |
