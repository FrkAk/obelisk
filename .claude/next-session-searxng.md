# Next Session: Review LLM Processing of Search Results in POI Enrichment Pipeline

## What Was Done (SearXNG Improvements)

### SearXNG Configuration (`searxng/settings.yml`)
- Switched from `use_default_settings: true` (loaded 70+ engines) to `use_default_settings.engines.keep_only` whitelist
- **Final engine set**: Google, DuckDuckGo, Mojeek, Yep, mwmbl, Wikipedia, Wikidata
- **Removed broken engines**: Bing (returned completely unrelated results), Brave (429 rate limit), Qwant (access denied), Startpage (CAPTCHA), ahmia/torch (Tor-based, not needed)
- Set `limiter: false` and `public_instance: false` (private instance, no bot detection needed)
- Created `searxng/limiter.toml` to suppress missing config warning
- Tuned timeouts: `request_timeout: 8.0`, `max_request_timeout: 15.0`, DDG gets `timeout: 12.0`
- Note: DuckDuckGo consistently times out from this network but is kept as fallback

### SearXNG Client (`src/lib/web/searxng.ts`)
- Added `SearXNGSearchOptions` interface (categories, language, engines, timeRange)
- Default `language: "en-DE"` per-request for Munich-relevant results
- Added single retry with 1s backoff for transient failures
- Client timeout set to 15s to accommodate slowest engines

### Search Query Improvements (`src/lib/web/webSearch.ts`)
- **Quoted POI names**: `"${base}"` instead of `${base}` for exact-phrase matching
- **Added German keywords** alongside English for Munich MVP (see assumptions below)
- Added `bib gourmand` to food awards pass
- Threaded `SearXNGSearchOptions` through `webSearch()` for per-call engine routing

### Rate Control (`scripts/enrich-pois.ts`)
- Search passes within each POI changed from `Promise.all` (parallel) to sequential `for...of` with 500ms inter-pass delay
- Concurrency reduced from 5 → 3 concurrent POIs
- Added 2s inter-batch delay
- Max simultaneous SearXNG queries dropped from ~20 to ~3

### Docker (`docker-compose.yml`)
- Added SearXNG health check (`wget -q -O /dev/null http://localhost:8080/`)
- App dependency changed from `service_started` → `service_healthy`
- Added `restart: unless-stopped`

## Assumptions Made About Search Keywords

**German keyword strategy for Munich MVP:**
- Since Obelisk is Munich-only, many relevant web pages are in German (restaurant reviews, local blogs, government heritage pages)
- Added German terms alongside English using OR patterns:
  - Food reviews: `erfahrungen bewertung OR review`
  - Menus: `speisekarte OR menu`
  - History: `Geschichte historische Bedeutung`, `Denkmalschutz`
  - Architecture: `Architektur`, `Rundgang`, `Baugeschichte`
  - Nature: `Natur`, `Ausstattung`, `Tipps`
  - Art: `Ausstellung`, `Kunstwerke`, `Besuch`
  - Culture: `Veranstaltungen`, `Erlebnis`, `Kuenstler`
  - Nightlife: `Programm`, `Stimmung`
  - Shopping: `Angebot`, `Sortiment`
  - Views: `Aussicht`, `Aussichtspunkt`
- **Assumption**: The LLM (gemma3:27b) can handle mixed German/English scraped content and extract structured data from both languages. This should be verified.
- **Assumption**: Quoted exact-phrase matching (`"Hofbräuhaus Munich"`) improves result relevance. Tested and confirmed — reduces noise significantly.
- **Assumption**: For future multi-city expansion, the German keywords would need to be made configurable per locale.

## What to Investigate Next

### 1. LLM Processing of Search Results
The enrichment pipeline feeds scraped web content to the LLM for structured profile extraction. Review this chain:

- **`src/lib/enrichment/extractors.ts`** — `extractProfileByCategory()` function. This is the core LLM extraction step. Check:
  - What prompts are used per category?
  - How does it handle mixed German/English content?
  - What's the extraction accuracy like?
  - Are there parsing failures or hallucinations?
  - Is the scraped content being truncated before reaching the LLM?

- **`src/lib/ai/storyGenerator.ts`** — Story generation uses profile data (not raw web search). But verify:
  - Does it receive enough context from enriched profiles?
  - Could the improved search results (more German content) cause issues in English story generation?

### 2. DB Column Length Error
From the original logs, there's a PostgreSQL error: `value too long for type character varying(4)` on `food_profiles` insert. This means the LLM extractor is producing values longer than the column allows. Investigate:
  - Which column is `varchar(4)`? (likely a boolean-like field getting a longer string)
  - Check the schema in `src/lib/db/schema.ts` for `food_profiles` table
  - The extractor might need validation/truncation before DB insert

### 3. End-to-End Test
Run `bun scripts/enrich-pois.ts` with `ENRICH_RADIUS=500` (small batch) to verify:
  - SearXNG returns good results with the new config
  - Scraping works on the new result URLs
  - LLM extraction handles the mixed-language content
  - DB inserts succeed (no varchar overflow)
  - Profile data quality is good

### 4. Scraper Improvements (Optional)
The scraper (`src/lib/web/scraper.ts`) uses `ObeliskBot/1.0` user agent which may get blocked. Consider:
  - Using a more standard user agent
  - Increasing the 500-char content limit in `scrapeWebsite` (used for story gen) — seems very low
  - The 4000-char limit in `scrapeForEnrichment` might also need tuning based on LLM context window

## Key Files for Next Session
- `src/lib/enrichment/extractors.ts` — LLM extraction prompts and parsing
- `src/lib/ai/storyGenerator.ts` — Story generation from enriched profiles
- `src/lib/ai/ollama.ts` — Ollama HTTP client
- `src/lib/db/schema.ts` — Database schema (check varchar constraints)
- `src/lib/web/scraper.ts` — Web scraper (content limits, user agent)
- `scripts/enrich-pois.ts` — Orchestration (already improved)
