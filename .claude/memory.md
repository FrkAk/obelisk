# Obelisk — Project Memory

> **Updated:** 2026-02-26
> **Branch:** `improve-db-part-2`
> **Status:** Enrichment rework complete, search & story quality fixes pending

---

## 1. What Was Done (This Session)

### Enrichment & Search Architecture Rework

Replaced web-scraping enrichment pipeline (SearXNG + HTML scraping + LLM extraction) with **taxonomy-based enrichment** using static JSON maps + LLM synthesis.

**Schema changes:**
- Removed 13 profile tables (178 columns) → single JSONB `profile` column on `pois`
- Removed `priceInfo` and `enrichmentLog` tables
- `PoiProfile` interface: `{ subtype?, osmExtracted?, keywords[], products[], summary, enrichmentSource, attributes }`

**Enrichment pipeline:**
- `scripts/download-datasets.ts` — downloads Google Product Taxonomy, NSI, OSM Taginfo, Wikidata brands
- `scripts/build-taxonomy.ts` → `data/tag_enrichment_map.json` (539 entries)
- `scripts/build-brands.ts` → `data/brand_enrichment_map.json` (20,303 entries)
- `scripts/enrich-taxonomy.ts` — merges taxonomy data per POI + LLM synthesis for 2-3 sentence summary
- 100% of POIs enriched (was capped at ~1K with web scraping)

**Search changes:**
- Dropped from 3 engines to 2 (removed Obelisk DB full-text search on remarks)
- Added `products` and `keywords` fields to Typesense schema
- Removed enrichment gates from sync-typesense, generate-embeddings, generate-stories
- All POIs now indexed and embedded

**Deleted (~4,175 lines):**
- `src/lib/enrichment/` (extractors.ts, pipeline.ts, postprocess.ts)
- `src/lib/web/` (ollamaSearch.ts, webSearch.ts, searxng.ts, scraper.ts, wikipedia.ts)
- `scripts/enrich-pois.ts`, `scripts/enrich-menus.ts`
- `searxng/` directory, SearXNG Docker service

**E2E verified:** 1,339 POIs, 100% profiles, 100% embeddings, 20 stories, search+autocomplete working, typecheck/lint/build pass.

---

## 2. Known Issues (QA Findings — Needs Fixing)

### CRITICAL: Search Failures

**RC1: Category mismatch between fast-path and DB**
- `src/lib/search/queryParser.ts:199-221`
- hotel→"hidden" should be "services", church→"architecture" should be "culture"
- 10 fast-path entries have wrong categories

**RC2: Embedding classifier returns garbage for non-fast-path queries**
- `src/lib/search/queryClassifier.ts:22-24`
- "clothes"→cuisineTypes:["vegetarian"], "shoes"→category:"art", "hairdresser"→cuisineTypes:["bakery"]
- Thresholds too low: 0.50/0.45/0.50 cause false positives with embeddinggemma:300m

**RC3: No fallback when category filter yields 0 results**
- `src/app/api/search/route.ts:133-155`
- Wrong category filter blocks Typesense from finding results it actually has
- Single retry without category filter would fix most failures

**RC4: Semantic search MIN_SIMILARITY too high**
- `src/lib/search/semantic.ts:7`
- 0.55 blocks most short keyword queries — lower to 0.35

**RC5: Query text replaced with `"*"` for classifier results**
- `src/app/api/search/route.ts:144`
- When classifier returns category but no keywords, sends `q="*"` instead of original query
- Kills Typesense's typo tolerance entirely

### IMPORTANT: Story Quality

**RC6: Story prompt issues**
- `src/lib/ai/storyGenerator.ts:269` — repetitive teasers ("Seriously, you *need* to try this place" in 15/21 stories)
- `src/lib/ai/localization.ts:225-248` — always passes same 5 German expressions, model uses ALL of them in every story
- No effective anti-hallucination for specific claims (nearby businesses, dishes)

### Search Queries That Fail (for reference)
- 0 results: clothes, shoes, hotel, church, park, hairdresser, romantic dinner spot, outdoor activities, all typo queries
- Poor results: cheap lunch, good bookshop, H&M, McDonald's

### Search Queries That Work
- restaurant, coffee, beer, museum, pharmacy, gym, supermarket, bank, dm
- "where can I get Italian food", "best place for a beer"

---

## 3. Data State

| Metric | Value |
|--------|-------|
| Total POIs | 1,339 |
| POIs with profiles | 1,339 (100%) |
| POIs with summaries | 1,339 (100%) |
| POIs with keywords | 1,306 (97.5%) |
| POIs with products | 1,213 (90.5%) |
| POIs with embeddings | 1,339 (100%) |
| Stories generated | 29 |
| Tag enrichment entries | 539 |
| Brand enrichment entries | 20,303 |

**POI distribution by category:**
shopping (737), food (278), health (70), history (59), culture (48), nightlife (41), services (34), art (32), education (13), hidden (12), sports (6), transport (6), views (3), architecture (1), nature (0)

---

## 4. Architecture Overview

```
make setup (14 steps):
  1. docker compose up (postgres, typesense, app)
  2. drizzle-kit push
  3. ollama pull (gemma3:4b-it-qat, embeddinggemma:300m)
  4-6. seed-regions, seed-cuisines, seed-tags
  7. download-datasets (Google taxonomy, NSI, Taginfo, Wikidata)
  8. build-taxonomy + build-brands
  9. seed-pois (from OSM PBF → pois.profile JSONB)
  10. enrich-taxonomy (merge taxonomy + brand maps + LLM synthesis)
  11. generate-stories
  12. sync-typesense
  13. generate-embeddings
  14. bun run dev
```

**Search flow:**
```
Query → queryParser (230+ fast-path OR embedding classifier fallback)
      → parallel: Typesense (keyword) + pgvector (semantic)
      → RRF fusion → geo-penalty → dedup → results
```

**Key files:**
- Schema: `src/lib/db/schema.ts` (JSONB profile on pois)
- Types: `src/types/api.ts` (PoiProfile interface)
- Search route: `src/app/api/search/route.ts`
- Query parser: `src/lib/search/queryParser.ts` (fast-path + classifier)
- Query classifier: `src/lib/search/queryClassifier.ts` (embedding-based)
- Typesense: `src/lib/search/typesense.ts`
- Semantic: `src/lib/search/semantic.ts`
- Ranking: `src/lib/search/ranking.ts`
- Profile summary: `src/lib/search/profileSummary.ts`
- Embedding builder: `src/lib/ai/embeddingBuilder.ts`
- Story generator: `src/lib/ai/storyGenerator.ts`
- Localization: `src/lib/ai/localization.ts`

---

## 5. Key References

- Product spec: `Obelisk.md`
- Implementation plan: `Plan.md`
- Project docs: `CLAUDE.md`
- Taxonomy data: `data/tag_enrichment_map.json`, `data/brand_enrichment_map.json`
- POI-Enhancer paper: https://arxiv.org/abs/2502.10038
