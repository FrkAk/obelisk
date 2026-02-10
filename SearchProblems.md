# Search System — Problem Statement

Obelisk is a contextual discovery platform. If search doesn't work, nothing works. This document catalogs every known issue in the search pipeline, organized by severity and root cause.

---

## P0 — Search Returns 0 Results for Valid Queries

### Problem 1: ALL food queries return 0 outside city center

**What happens:** User in Neuperlach searches "Pizza" → 0 results. "Döner" → 0. "Simit" → 0.

**Root cause — two compounding issues:**

**1a. Cuisine override creates compound Nominatim queries that fail**

`src/lib/search/nominatim.ts:153-157`
```
finalQuery = intent.cuisineTypes[0] + " " + query;
```
When `cuisineTypes: ["pizza"]` and `buildSearchQuery` returns `"restaurant"`, the Nominatim query becomes `"pizza restaurant"`. Nominatim treats this as a single phrase and can't find it. This happens for EVERY food query that has cuisineTypes set — including the fast-path "Pizza" query.

| Query | cuisineTypes | buildSearchQuery | Nominatim receives | Result |
|-------|-------------|-----------------|-------------------|--------|
| Pizza | ["pizza"] | "restaurant" | "pizza restaurant" | 0 |
| Döner | ["döner"] | "restaurant" | "döner restaurant" | 0 |
| Simit | ["simit"] | "restaurant" | "simit restaurant" | 0 |
| Beer (fast-path) | (none) | "bar" | "bar" | works |

Note: "Beer" works because the fast-path doesn't set cuisineTypes, so no override happens.

**1b. `bounded=1` with no fallback restricts to viewport**

`src/lib/search/nominatim.ts:167`
```
bounded: "1",
```
Keyword mode uses `bounded=1`, strictly limiting results to the current map viewport. When user is in Neuperlach (~5km from center), the viewport covers an area with fewer Nominatim-indexed POIs. Even without the cuisine override, a search for just "restaurant" with bounded=1 in a sparse viewport might return few or no results.

There is **no fallback** — if bounded=1 returns 0, the search ends with 0 results.

**Evidence:**
```
[queryParser] Fast-path: "Pizza"              ← fast-path works (0ms parse)
[nominatim] Cuisine query: "pizza restaurant"  ← cuisine override
[nominatim] Keyword search: "pizza restaurant", results: 0  ← bounded=1 in Neuperlach
[search] Results: 0 (0 stories, 0 places)     ← user gets nothing
```

---

### Problem 2: Name searches return 0 for Munich landmarks

**What happens:** "Odeonplatz" → 0 results from all sources.

**Root cause: viewbox bias in unbounded name search**

`src/lib/search/nominatim.ts:251-255`
```
const viewbox = viewportBounds
  ? `${viewportBounds.west},${viewportBounds.north},${viewportBounds.east},${viewportBounds.south}`
  : MUNICH_VIEWBOX;
const results = await fetchNominatim(placeName, viewbox, "0", limit, "de");
```

Even with `bounded=0`, the viewport is sent as `viewbox`. Nominatim uses this as a strong preference bias. When the user's viewport is a small or offset area (zoomed into Neuperlach), landmarks outside the viewport are suppressed.

Additionally, the DB returns 0 because:
- `searchRemarksByName` → INNER JOIN on remarks: Odeonplatz has no story → 0
- `searchPoisByName` → Odeonplatz may not exist in the 408 seeded POIs (seed script only covers 2km radius around Marienplatz, and only fetches specific OSM tag categories)

| Query | DB remarks | DB POIs | Nominatim | Total |
|-------|-----------|---------|-----------|-------|
| Odeonplatz | 0 | 0 | 0 | **0** |
| Marienplatz | 0 | 0 | 1 | 1 |
| Apple | 0 | 0 | 2 | 2 |

---

## P1 — Results Are Not Relevant

### Problem 3: Suggested places don't match query intent

**What happens:** When results do come back, they're not always relevant to what the user searched for.

**Root causes:**

**3a. No keyword relevance filtering on Nominatim results**

`src/lib/search/nominatim.ts:184-204` — Nominatim results are filtered only by distance and viewport. There's no check that the result actually matches the search intent. Nominatim returns whatever it finds for the query text, and all results are included regardless of category match.

For example, "hospital" might return clinics, pharmacies, and doctor's offices — Nominatim returns them all and our code includes them all. The scoring gives +20 for category match, but non-matching results still appear with base score of 50-60.

**3b. Scoring favors metadata over relevance**

`src/app/api/search/route.ts:126-162` — The external result scoring:
```
Base score: 50-60
Category match: +20
Has wifi: +15
Has outdoor seating: +15
Has opening hours: +5
Has website: +3
Has phone: +2
Name match: +15-35
```

A completely irrelevant result with opening hours, website, and phone (score 50+5+3+2=60) outranks a category-matching result without metadata (score 50+20=70... ok this one is fine). But the issue is that **distance penalty uses zoomFactor**, so at high zoom levels distant but relevant results get heavily penalized while close but irrelevant results rank higher.

**3c. Nominatim's free-text search is inherently imprecise**

Nominatim is a geocoder, not a POI search engine. Searching for "pizza" in Nominatim doesn't reliably return pizza restaurants — it returns anything with "pizza" in the name or description. There's no structured way to say "amenity=restaurant AND cuisine=pizza" via Nominatim's free-text search.

**3d. LLM misclassifies queries → wrong category → wrong scoring**

`src/lib/search/queryParser.ts` — The LLM sometimes misclassifies:
```
"Hospital nearby" → category: "services" (should be "health")
```
This means category-match bonus (+20/+25) is awarded to the wrong results.

---

### Problem 4: Wifi/outdoor filter breaks non-food searches

`src/app/api/search/route.ts:329-333`
```
if (intent.filters.wifi || intent.filters.outdoor) {
  const amenityTypes = intent.category === "food"
    ? ["cafe", "restaurant"]
    : ["cafe", "restaurant", "bar"];
  externalPois = await searchByAmenityOverpass(amenityTypes, ...);
}
```

When user searches "museum with wifi" or "quiet library" → category is "art"/"education", but the code searches Overpass for cafes/restaurants/bars instead. The actual query intent is completely lost.

---

### Problem 13: LLM generates incorrect/useless keywords for non-fast-path queries

**What happens:** Any query not in the 24-entry `FAST_PATH_MAP` is parsed by the LLM (gemma3:4b). The LLM frequently returns keywords that are not OSM-searchable, misclassifies modes, or produces entirely wrong structured output — making the downstream `buildSearchQuery` produce queries that Nominatim can't match.

**Root causes:**

**13a. Query parser uses JSON output format instead of labeled text**

`src/lib/search/queryParser.ts:15-16` — The prompt demands JSON output (`{"mode":"...","keywords":[...],...}`), which adds unnecessary parsing complexity. The story generator (`src/lib/ai/storyGenerator.ts:282-286`) already proves that a labeled text format (`TITLE: ...\nTEASER: ...`) with regex extraction is more reliable with gemma3. The query parser should use the same pattern (e.g., `MODE: keyword\nKEYWORDS: pizza, restaurant\nCATEGORY: food`) instead of requiring valid JSON. The current JSON approach means:
- Any stray text or formatting wraps the JSON and breaks `JSON.parse`, triggering `fallbackParse`
- The model wastes tokens on JSON syntax (braces, quotes, commas) instead of focusing on semantic accuracy
- `extractJsonFromResponse` needs three increasingly desperate regex fallbacks to find the JSON object

**13b. Prompt has insufficient examples for edge cases**

`src/lib/search/queryParser.ts:5-47` — The prompt contains only ~10 examples. Common query patterns that the LLM gets wrong:
- German-language queries: "Apotheke" (pharmacy), "Krankenhaus" (hospital) — LLM doesn't map to English OSM types
- Slang and colloquial terms: "döner", "simit", "currywurst" — LLM doesn't know these should map to `restaurant`
- Multi-intent queries: "coffee and cake near Marienplatz" — LLM picks one intent and drops the rest
- Negations: "not too expensive restaurant" — LLM ignores the negation

**13c. Keywords don't align with OSM taxonomy, making `buildSearchQuery` ineffective**

`src/lib/search/nominatim.ts:79-129` — `buildSearchQuery` tries to find an OSM-friendly term in the keywords array (line 109-116). If the LLM generates keywords like `["food", "eat", "lunch"]` instead of `["restaurant"]`, none match the `osmFriendlyTerms` list. The function falls back to the first keyword (`"food"`), which Nominatim can't meaningfully resolve to POIs.

| Query | LLM keywords (actual) | Ideal keywords | buildSearchQuery output | Works? |
|-------|-----------------------|----------------|------------------------|--------|
| Apotheke | ["apotheke"] | ["pharmacy"] | "apotheke" | No — Nominatim needs "pharmacy" |
| Döner | ["döner", "food"] | ["döner", "restaurant"] | "döner" | Partial — no fallback to "restaurant" |
| hospital nearby | ["hospital", "nearby"] | ["hospital"] | "hospital" | Yes (lucky) |
| where to eat sushi | ["eat", "sushi", "food"] | ["restaurant", "sushi"] | "sushi" | Partial |
| Spielplatz | ["spielplatz"] | ["playground"] | "spielplatz" | No — needs English OSM term |

**13d. `fallbackParse` is too naive when LLM fails**

`src/lib/search/queryParser.ts:169-185` — When JSON extraction fails, `fallbackParse` simply splits the query into words and uses those as keywords. No category inference, no synonym expansion, no OSM mapping. A query like "I need a hospital" produces keywords `["need", "hospital"]` with no category set.

**Impact:** This is the entry point for the entire search pipeline. Wrong keywords cascade through `buildSearchQuery` → Nominatim query → results. Combined with Problem 1 (cuisine override) and Problem 3 (scoring), even queries that partially work return irrelevant results.

---

## P2 — Performance Issues

### Problem 5: Parse latency 1.3-5.6s for non-fast-path queries

Every query not in the 24-entry FAST_PATH_MAP hits the LLM (gemma3:4b). First query includes model warmup (~5s), subsequent queries take 1.3-2s.

Common queries that miss fast-path and waste LLM time:
- "Hospital nearby" (1.7s)
- "Simit" (1.7s)
- "Döner" (1.4s)
- "Odeonplatz" (5.7s — first query with warmup)
- "How can I go from X to Y" (1.7s)

### Problem 6: Conversational response adds latency to every search

`src/app/api/search/route.ts:458-462` — `generateConversationalResponse` runs on every search, adding another LLM call (SEARCH_MODEL / gemma3:4b). This happens even when results are 0 (returns canned "I couldn't find anything" message anyway).

---

## P3 — Data Coverage Gaps

### Problem 7: DB only has POIs within 2km of Marienplatz

`scripts/seed-pois.ts:47` — Overpass query uses `around:2000` from Munich center:
```
node["historic"]["name"](around:2000,48.137154,11.576124);
```

Only 6 OSM tag categories are fetched: historic, museum, place_of_worship, biergarten, theatre, viewpoint. This means:
- No restaurants, cafes, shops, hospitals, schools, parks, etc. in DB
- Zero coverage outside 2km center radius
- Odeonplatz may not be in DB despite being a famous Munich landmark (depends on whether Overpass returned it — fallback list has it as "Odeonsplatz" id 25, but Overpass success may have different results)

### Problem 8: Only ~100 remarks for 408 POIs

Remarks are generated in batches of 10. Many POIs don't have stories yet. `searchRemarksByName` uses INNER JOIN on remarks, so POIs without stories are invisible to that search path. (Fixed by `searchPoisByName`, but DB coverage is still the bottleneck.)

---

## P4 — Architectural Issues

### Problem 9: Viewport filter logic is inverted in keyword search

`src/lib/search/nominatim.ts:203`
```
.filter((poi) => viewportBounds || (poi.distance !== undefined && poi.distance <= radius))
```

This reads: "if viewportBounds is truthy, include ALL results regardless of distance." When viewport is provided (which is the common case), no distance filtering happens on keyword results. Results from 50km away could be included.

### Problem 10: No deduplication in keyword mode's Nominatim results

`deduplicateByName` is only called in `searchNominatimByName` (name mode). Keyword mode via `searchNominatim` doesn't dedup. If Nominatim returns both "Odeonplatz" (subway) and "Odeonplatz" (square) for a keyword search, both appear.

### Problem 11: Silent error swallowing hides failures

Three try/catch blocks in `route.ts` (lines 248, 272, 338) log errors to console but return empty arrays to the user. There's no way to know if Nominatim was down, the DB query failed, or Overpass timed out. The user just sees "0 results."

### Problem 12: No index on pois.name for ILIKE queries

`src/lib/db/schema.ts` — Only indexes on `categoryId` and `(latitude, longitude)`. The `ILIKE '%name%'` query in `searchPoisByName` does a full table scan. Not critical at 408 rows but becomes a problem at scale.

---

## Summary by Impact

| # | Severity | Issue | User sees |
|---|----------|-------|-----------|
| 1 | **P0** | Cuisine override + bounded=1 | "Pizza" → 0 results |
| 2 | **P0** | Viewbox bias in name search | "Odeonplatz" → 0 results |
| 3 | **P1** | No relevance filtering, scoring favors metadata | Wrong places suggested |
| 4 | **P1** | Wifi/outdoor filter ignores category | "museum with wifi" finds restaurants |
| 13 | **P1** | LLM generates wrong keywords | "Apotheke" → unsearchable, wrong search path |
| 5 | **P2** | LLM parse latency 1.3-5.6s | Slow search for common queries |
| 6 | **P2** | Conversational response on every search | Extra latency, even for 0 results |
| 7 | **P3** | DB covers only 2km center | No DB results outside center |
| 8 | **P3** | ~100 remarks for 408 POIs | Most POIs have no stories |
| 9 | **P4** | Inverted viewport filter | Distant irrelevant results |
| 10 | **P4** | No dedup in keyword mode | Duplicate results |
| 11 | **P4** | Silent error swallowing | Hidden failures |
| 12 | **P4** | No name index | Slow at scale |

---

## Key Files

| File | Issues |
|------|--------|
| `src/lib/search/nominatim.ts` | #1 (cuisine override), #1 (bounded=1), #2 (viewbox), #9 (filter inversion), #10 (no dedup) |
| `src/app/api/search/route.ts` | #3 (scoring), #4 (wifi/outdoor), #6 (conv. response), #11 (error swallowing) |
| `src/lib/search/queryParser.ts` | #3d (misclassification), #5 (parse latency), #13 (wrong keywords, bad fallback) |
| `scripts/seed-pois.ts` | #7 (2km coverage), #8 (sparse remarks) |
| `src/lib/db/schema.ts` | #12 (missing index) |
| `src/lib/search/overpass.ts` | Available but underused for structured POI search |
