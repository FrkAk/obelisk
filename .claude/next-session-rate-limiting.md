# Next Session: SearXNG Rate Limiting & Enrichment Pipeline Sustainability

## Problem

The enrichment pipeline (`scripts/enrich-pois.ts`) hammers SearXNG with thousands of search queries in rapid succession. With ~2900 POIs and 2-3 enrichment passes each (general, reviews, category-specific), that's ~6000-9000 search queries per run. Each query fans out to all enabled engines (Google, DuckDuckGo, Wikipedia, Wikidata, Mojeek, mwmbl, Yep).

**Result:** Google returns 403 and gets auto-suspended for 24 hours. DuckDuckGo times out from rate limiting. Yep crashes with unicode decode errors. Only Wikipedia/Mojeek/mwmbl survive, but they don't have Munich POI data.

## Current Engine Status

| Engine | Status | Issue |
|--------|--------|-------|
| Google | Suspended 24h | 403 Access Denied — bot detection from volume |
| DuckDuckGo | Timing out | Rate limited, every request hits 15s timeout |
| Yep | Crashing | `UnicodeDecodeError` in SearXNG's yep.py parser |
| Wikipedia | Working | Only returns Wikipedia articles, not POI reviews |
| Wikidata | Working | Structured data only, limited for enrichment |
| Mojeek | Working | Small indie index, poor Munich coverage |
| mwmbl | Working | Tiny index, rarely returns results |

## Root Causes

1. **No throttling between search queries** — `INTER_PASS_DELAY_MS` is only 500ms, `INTER_BATCH_DELAY_MS` is 2000ms, `CONCURRENCY` is 3. Three concurrent POIs × 2-3 passes each = ~9 queries per second to SearXNG, all fanning out to Google/DDG simultaneously.

2. **`useragent_suffix: "obelisk-dev"`** in `searxng/settings.yml` — tags every outgoing request SearXNG makes to Google/DDG, making automated traffic easier to fingerprint.

3. **No per-run POI limit** — the pipeline tries to enrich all 2900 POIs in a single run. Should process 50-100 per run across multiple sessions.

4. **Yep engine is broken** — SearXNG's yep.py has a unicode decode bug. Should be removed from the engine list.

## What to Fix

### 1. SearXNG Config (`searxng/settings.yml`)

- Remove `useragent_suffix: "obelisk-dev"` (set to `""`)
- Remove `yep` from engine list (broken)
- Consider removing `mwmbl` (tiny index, rarely useful)

### 2. Enrichment Pipeline Throttling (`scripts/enrich-pois.ts`)

- Lower default `ENRICH_CONCURRENCY` from `3` to `1`
- Increase `INTER_PASS_DELAY_MS` from `500` to `2000-3000`
- Increase `INTER_BATCH_DELAY_MS` from `2000` to `5000-10000`
- Add `ENRICH_MAX_POIS` env var to cap POIs per run (default ~50)
- Add randomized jitter to delays (±30%) so requests don't look machine-timed

### 3. SearXNG Client Retry Logic (`src/lib/web/searxng.ts`)

- Current: 1 retry with 1s delay
- Consider: exponential backoff (1s, 3s, 9s) if we keep retries
- Or: fail fast with 0 retries since the enrichment pipeline already handles failures gracefully

### 4. Alternative Approach: Brave Search API

Brave offers a free tier (2000 queries/month) with an API key. Unlike scraping Google through SearXNG, API access is legitimate and won't get rate-limited. Could be added as a fallback when SearXNG engines are all down. Requires `BRAVE_API_KEY` env var. The user tested other SearXNG engines (Bing, Brave via SearXNG, Qwant, Startpage) and found they don't produce good results through SearXNG's scraping — but the Brave API directly might be different.

## Quick Recovery (Start of Next Session)

1. `docker compose restart searxng` — resets Google suspension timer
2. Run with conservative settings: `ENRICH_CONCURRENCY=1 ENRICH_BATCH_SIZE=10 bun scripts/enrich-pois.ts`
3. Monitor `docker compose logs searxng -f` for 403s/timeouts

## Completed This Session

The enrichment pipeline code improvements are done and verified (typecheck + lint clean):

- **`src/lib/ai/ollama.ts`** — Added `chatExtract<T>()` using `/api/chat` with `format: "json"`
- **`src/lib/enrichment/extractors.ts`** — System prompt, per-category user prompts, validation layer (enum/varchar/numeric), confidence scoring (0-100)
- **`src/lib/web/scraper.ts`** — Chrome UA, unified `extractMainContent` with optional maxLen
- **`src/lib/web/webSearch.ts`** — `scrapeTopResults()` accepts `maxContentLength` param
- **`scripts/enrich-pois.ts`** — Passes 4000 char limit, text length for confidence, logs confidence scores

All changes reviewed by code reviewer agent. No type errors, no lint errors, deprecated code cleaned up.
