# Obelisk QA Test Report

**Date:** 2026-02-26
**Branch:** `improve-db-part-2`
**Commit:** `edb0371`
**Tester:** Automated QA (Claude Opus 4.6)

---

## 1. Executive Summary

This report covers the data integrity, search engine functionality, and story generation quality of the Obelisk contextual discovery platform. The testing was performed against a live instance with 1,342 POIs seeded from a Munich OSM extract.

**Key Findings:**

- **Data State:** 1,342 POIs with 99.7% profile completeness (1,339/1,342 have summaries). 36 POIs (2.7%) have zero keywords. 3 POIs have no enrichment source at all (completely unenriched).
- **Search Engine:** Functional for direct keyword queries. Semantic search produces semantically confused results for German-language queries (e.g., "Kirche" returns kitchen stores). Typo tolerance works but with degraded relevance. Natural language queries return reasonable but imperfect results.
- **Story Generation:** 300 stories generated (22.4% POI coverage). Severe quality issues: 86.3% of teasers contain the banned word "Seriously" despite an explicit prompt ban. Extreme template repetition ("Okay, so...", "you know?", "not flashy", "tucked away", "gemütlich"). Only 3 of 10 German expressions are ever used. Multiple hallucinations detected in low-data stories. Confidence and model_id fields are NULL for all 300 stories (not being persisted to the database).
- **Critical Bugs:** 3 identified -- confidence/model_id not saved, prompt ban on "Seriously" not enforced, story word count consistently exceeds the 60-word prompt limit.

---

## 2. Test Environment

| Component | Version / Configuration |
|-----------|------------------------|
| Git Branch | `improve-db-part-2` |
| Git Commit | `edb0371` |
| Docker | 29.2.1 |
| Docker Compose | v5.1.0 |
| Next.js | 16.1.6 |
| React | 19.2.3 |
| PostgreSQL | 15.15 (pgvector 0.8.1, pg_trgm 1.6) |
| Typesense | 30.1 (healthy, 1,339 documents indexed) |
| LLM Model | gemma3:4b-it-qat (via Ollama, host) |
| Embedding Model | embeddinggemma:300m (768-dim) |
| SEED_RADIUS | 500m (set in `.env.local`, overrides Makefile default of 100m) |
| Test Date | 2026-02-26 |

---

## 3. Data State Audit

### 3.1 POI Statistics

**Total POIs:** 1,342

| Category | POI Count | % of Total |
|----------|-----------|------------|
| Shopping | 737 | 54.9% |
| Food | 278 | 20.7% |
| Health | 70 | 5.2% |
| History | 59 | 4.4% |
| Culture | 49 | 3.7% |
| Nightlife | 41 | 3.1% |
| Services | 34 | 2.5% |
| Art | 32 | 2.4% |
| Education | 13 | 1.0% |
| Hidden Gems | 12 | 0.9% |
| Transport | 6 | 0.4% |
| Sports | 6 | 0.4% |
| Views | 3 | 0.2% |
| Architecture | 2 | 0.1% |
| Nature | 0 | 0.0% |

**Observations:**
- Shopping dominates at 54.9% of all POIs -- the dataset is heavily skewed toward retail.
- Nature has 0 POIs despite being a defined category. No parks, gardens, or green spaces were seeded.
- Architecture has only 2 POIs (Neues Rathaus and Theatinerkirche), both of which have zero enrichment.
- Views has only 3 POIs with 0 stories.

### 3.2 Profile Completeness

| Metric | Count | Percentage |
|--------|-------|------------|
| Total POIs | 1,342 | 100% |
| Has profile (non-null) | 1,342 | 100% |
| Has summary | 1,339 | 99.8% |
| Has keywords (>0) | 1,306 | 97.3% |
| Has products (>0) | 1,213 | 90.4% |
| Has embedding | 1,339 | 99.8% |

**Keyword/Product Statistics:**

| Metric | Keywords | Products |
|--------|----------|----------|
| Min | 0 | 0 |
| Max | 6 | 14 |
| Average | 4.2 | 5.3 |

**Gaps:** 36 POIs (2.7%) have zero keywords. 129 POIs (9.6%) have zero products. 3 POIs have no embedding.

### 3.3 Enrichment Coverage

| Enrichment Source | Count | Percentage |
|-------------------|-------|------------|
| taxonomy+llm | 1,120 | 83.5% |
| taxonomy+brand+llm | 219 | 16.3% |
| (none/empty) | 3 | 0.2% |

**Unenriched POIs (no enrichment source):**

| POI Name | Category |
|----------|----------|
| Neues Rathaus | Architecture |
| Theatinerkirche St. Kajetan | Architecture |
| Feldherrnhalle | Culture |

These 3 POIs were completely missed by the enrichment pipeline. They have 0 keywords, 0 products, and no summary, yet stories were still generated for them.

**POIs with 0 Keywords by Category:**

| Category | Count |
|----------|-------|
| Shopping | 10 |
| Health | 8 |
| History | 8 |
| Transport | 6 |
| Architecture | 2 |
| Services | 1 |
| Culture | 1 |

### 3.4 Embedding & Search Index Coverage

| System | Document Count | vs POI Total | Gap |
|--------|---------------|--------------|-----|
| PostgreSQL (POIs) | 1,342 | -- | -- |
| Embeddings (non-null) | 1,339 | 99.8% | 3 missing |
| Typesense Index | 1,339 | 99.8% | 3 missing |

The 3 POIs missing embeddings and Typesense documents are the same 3 unenriched POIs (Neues Rathaus, Theatinerkirche, Feldherrnhalle). These are effectively invisible to search.

### 3.5 Story/Remark Coverage

| Metric | Value |
|--------|-------|
| Total remarks | 300 |
| Unique POIs with stories | 300 |
| POIs without stories | 1,042 |
| Overall story coverage | 22.4% |
| All locale values | (empty string) |
| All versions | 1 |
| All is_current | true |
| Confidence populated | 0 / 300 (0%) |
| Model ID populated | 0 / 300 (0%) |

**Story Coverage by Category:**

| Category | Total POIs | Stories | Coverage % |
|----------|-----------|---------|------------|
| Architecture | 2 | 2 | 100.0% |
| Sports | 6 | 3 | 50.0% |
| Culture | 49 | 18 | 36.7% |
| Services | 34 | 10 | 29.4% |
| History | 59 | 15 | 25.4% |
| Art | 32 | 8 | 25.0% |
| Food | 278 | 66 | 23.7% |
| Nightlife | 41 | 9 | 22.0% |
| Shopping | 737 | 155 | 21.0% |
| Transport | 6 | 1 | 16.7% |
| Hidden Gems | 12 | 2 | 16.7% |
| Health | 70 | 10 | 14.3% |
| Education | 13 | 1 | 7.7% |
| Views | 3 | 0 | 0.0% |
| Nature | 0 | 0 | N/A |

---

## 4. Search Engine Tests

### 4.1 Test Methodology

All search queries were sent as POST requests to `http://localhost:3000/api/search` with a location centered on Munich (48.137154, 11.576124) and a 5,000m radius. Results were evaluated for: result count, relevance of top 3 results, and response timing.

### 4.2 Results Matrix

| Query | Results | #1 Result | #1 Score | Total ms |
|-------|---------|-----------|----------|----------|
| clothes | 11 | J.G. Mayer | 0.100 | 1,209 |
| shoes | 13 | J.G. Mayer | 0.100 | 69 |
| hotel | 17 | Hotel am Markt | 0.116 | 89 |
| church | 3 | St. Peter | 0.100 | 63 |
| park | 11 | Frnk. Wurstwaren Clasen | 0.100 | 74 |
| hairdresser | 18 | Haarwerk | 0.110 | 94 |
| resturant | 10 | DinnerHopping | 0.046 | 125 |
| pharmcy | 4 | Lowenapotheke | 0.044 | 121 |
| cofee | 6 | Coffee Fellows | 0.035 | 130 |
| restaurant | 13 | Ratskeller | 0.100 | 67 |
| coffee | 9 | Nespresso | 0.124 | 68 |
| beer | 3 | Biergarten am Viktualienmarkt | 0.143 | 71 |
| museum | 13 | Spielzeugmuseum | 0.131 | 64 |
| pharmacy | 12 | Rathaus-Apotheke | 0.128 | 65 |
| gym | 5 | Bikram Hot Yoga | 0.129 | 85 |
| supermarket | 5 | Rewe | 0.145 | 73 |
| bank | 10 | Munchner Bank | 0.126 | 77 |
| Italian food (NL) | 9 | Italian Connection | 0.046 | 181 |
| beer (NL) | 10 | Late Nights | 0.047 | 165 |
| romantic dinner (NL) | 9 | DinnerHopping | 0.041 | 161 |
| outdoor activities (NL) | 3 | Mammut Store | 0.033 | 155 |
| a | 11 | MVG Kundencenter | 0.010 | 72 |
| ab | 11 | Labor Becker | 0.010 | 73 |
| H&M | 3 | H&M | 0.060 | 138 |
| McDonald's | 3 | McDonald's | 0.056 | 145 |
| Apotheke | 12 | Rathaus-Apotheke | 0.144 | 85 |
| Backerei | 3 | Backerei Zottl | 0.130 | 86 |
| Kirche | 11 | WMF | 0.100 | 71 |
| Schnitzel | 1 | HeimWerk | 0.136 | 79 |
| Zahnarzt | 1 | Zahnarztpraxis am Farbergraben | 0.156 | 69 |

### 4.3 Previously Failing Queries

| Query | Status | Notes |
|-------|--------|-------|
| clothes | PASS (with caveats) | 11 results. Top results are multi-category stores (J.G. Mayer, Ludwig Beck) rather than dedicated clothing shops. No clothing-specific stores in top 3. |
| shoes | PASS (with caveats) | 13 results. Same top results as "clothes" -- J.G. Mayer, Ludwig Beck, Hartl. Identical ranking suggests query differentiation is weak. |
| hotel | PASS | 17 results. Hotel am Markt ranked #1 with good relevance. |
| church | PASS | 3 results. St. Peter, Frauenkirche, Sankt Michael. Correct and relevant. |
| park | FAIL | 11 results. Top 3 are all butcher shops (Wurstwaren Clasen, Hofmetzgerei Sippl, Adrian Klobeck). Zero actual parks returned. Note: the Nature category has 0 POIs, so no parks exist in the database. |
| hairdresser | PASS | 18 results. Haarwerk, Coiffeur Robert top-ranked. Good relevance. |

### 4.4 Typo Tolerance

| Query | Corrected To | Results | Relevance | Parse ms |
|-------|-------------|---------|-----------|----------|
| resturant | restaurant | 10 | Fair -- DinnerHopping #1, not a restaurant itself | 58 |
| pharmcy | pharmacy | 4 | Good -- all pharmacies | 57 |
| cofee | coffee | 6 | Good -- Coffee Fellows #1 | 60 |

Typo tolerance adds ~60ms parse time (LLM query parsing fallback) but returns usable results. Score magnitudes drop significantly compared to exact-match queries (0.04-0.06 vs 0.10-0.15).

### 4.5 Working Queries (Regression)

All 8 "must work" queries return relevant results:

| Query | Verdict | Notes |
|-------|---------|-------|
| restaurant | PASS | Ratskeller #1 |
| coffee | PASS | Nespresso #1 (a coffee capsule store, not a cafe -- minor relevance issue) |
| beer | PASS | Biergarten am Viktualienmarkt #1 |
| museum | PASS | Spielzeugmuseum #1 |
| pharmacy | PASS | Rathaus-Apotheke #1 |
| gym | PASS (marginal) | Bikram Hot Yoga #1 -- yoga studio, not a traditional gym |
| supermarket | PASS | Rewe #1 |
| bank | PASS | Munchner Bank #1 |

### 4.6 Natural Language Queries

| Query | Results | Top Result | Assessment |
|-------|---------|------------|------------|
| "where can I get Italian food" | 9 | Italian Connection | PASS -- Italian restaurants returned |
| "best place for a beer" | 10 | Late Nights | MARGINAL -- Late Nights is a bar, but Biergarten am Viktualienmarkt (the obvious best answer) is not in top 3 |
| "romantic dinner spot" | 9 | DinnerHopping | MARGINAL -- DinnerHopping is a dinner event service, not a restaurant |
| "outdoor activities" | 3 | Mammut Store | FAIL -- all results are outdoor clothing stores, not actual outdoor activities |

Natural language queries trigger LLM parsing (68-93ms overhead). Results are semantically approximate but often miss the intent distinction between "buying outdoor gear" vs "doing outdoor activities."

### 4.7 Edge Cases

| Query | Results | Assessment |
|-------|---------|------------|
| "a" | 11 | Returns noise -- single-letter queries should be rejected or return empty |
| "ab" | 11 | Returns noise -- two-letter queries are not useful |
| "H&M" | 3 | PASS -- all 3 H&M stores returned |
| "McDonald's" | 3 | PASS -- McDonald's #1, related fast food follows |
| "Apotheke" | 12 | PASS -- German term works, pharmacies returned |
| "Backerei" | 3 | PASS -- bakeries returned |
| "Kirche" | 11 | FAIL -- WMF (#1) and Kustermann (#2, #3) are kitchen/houseware stores. Zero churches in top 3. The embedding model confuses "Kirche" (church) with "kitchen" (Kuche). Actual churches (St. Peter, Frauenkirche, Sankt Michael) are not in results. |
| "Schnitzel" | 1 | PASS -- HeimWerk (German restaurant) returned |
| "Zahnarzt" | 1 | PASS -- Zahnarztpraxis am Farbergraben returned |

### 4.8 Search Timing Analysis

| Metric | Value |
|--------|-------|
| Fastest query | "church" at 63ms total |
| Slowest query | "clothes" at 1,209ms (first semantic query, cold cache) |
| Average (excl. outlier) | ~95ms |
| Parse time (fast-path) | 0-1ms |
| Parse time (LLM fallback) | 57-93ms |
| Typesense time | 3-16ms |
| Semantic search time | 61-87ms (excl. cold start) |

**Cold start issue:** The first semantic search query ("clothes") took 1,205ms for the semantic component, likely due to embedding model warm-up. Subsequent queries averaged 65-87ms.

### 4.9 Search Issues & Findings

1. **CRITICAL: German "Kirche" returns kitchen stores** -- The embedding model (embeddinggemma:300m) confuses German "Kirche" (church) with English-adjacent "kitchen." Top 3 results are WMF and Kustermann (kitchen/houseware stores). The 3 actual churches in the database are not returned.

2. **HIGH: "park" returns butcher shops** -- No parks exist in the database (Nature category has 0 POIs), but semantic search returns butchers instead of indicating no results. This is misleading.

3. **HIGH: "clothes" and "shoes" return identical rankings** -- Top 3 are the same (J.G. Mayer, Ludwig Beck, Hartl) with identical scores, suggesting the semantic engine cannot differentiate between these categories.

4. **MEDIUM: Single/double letter queries return results** -- "a" and "ab" return 11 results each. These should be rejected as too short for meaningful search.

5. **MEDIUM: Natural language "outdoor activities" returns stores, not activities** -- The semantic model maps "outdoor activities" to outdoor gear retailers.

6. **MEDIUM: "coffee" returns Nespresso (capsule store) as #1** -- Not a cafe. Minor relevance issue.

7. **LOW: Typo-corrected queries have significantly lower scores** -- Scores drop from 0.10-0.15 range to 0.03-0.06 range. This may affect UI display/confidence indicators.

---

## 5. Story Generation Tests

### 5.1 Test Methodology

All 300 stories in the database were extracted and analyzed programmatically for: teaser compliance, word count, German expression frequency, repetitive patterns, hallucination indicators, and template-like quality.

### 5.2 Generation Results Overview

| Metric | Value |
|--------|-------|
| Total stories | 300 |
| Stories with confidence field | 0 (all NULL) |
| Stories with model_id field | 0 (all NULL) |
| Stories with locale field | 0 (all empty) |
| All at version 1, is_current true | Yes |

### 5.3 Category Coverage Analysis

| Category | POIs | Stories | Coverage | Assessment |
|----------|------|---------|----------|------------|
| Architecture | 2 | 2 | 100% | Both POIs have 0 keywords/products, stories are hallucinated |
| Sports | 6 | 3 | 50% | Reasonable |
| Culture | 49 | 18 | 36.7% | Good coverage for a key category |
| Services | 34 | 10 | 29.4% | -- |
| History | 59 | 15 | 25.4% | -- |
| Art | 32 | 8 | 25.0% | -- |
| Food | 278 | 66 | 23.7% | Core category, should be higher |
| Nightlife | 41 | 9 | 22.0% | -- |
| Shopping | 737 | 155 | 21.0% | Most stories in absolute terms |
| Transport | 6 | 1 | 16.7% | Only Nationaltheater covered |
| Hidden Gems | 12 | 2 | 16.7% | Low for a category that should drive discovery |
| Health | 70 | 10 | 14.3% | -- |
| Education | 13 | 1 | 7.7% | Only Juristische Bibliothek covered |
| Views | 3 | 0 | 0.0% | No stories at all |

### 5.4 Confidence Level Assessment

**All 300 stories have NULL confidence in the database.** The `assessConfidence()` function in `src/lib/ai/storyGenerator.ts` calculates confidence, and the `generateStory()` function returns it, but the value is not being persisted to the `remarks` table during batch generation.

Similarly, `model_id` is returned by `generateStory()` but is NULL for all 300 rows.

**Root cause:** The batch story generation script (`scripts/generate-stories.ts`) likely does not map the `confidence` and `modelId` fields from `GeneratedStory` to the remarks INSERT statement.

### 5.5 Word Count Compliance

The prompt specifies **"60 words MAX"** for story content.

| Range | Count | Percentage |
|-------|-------|------------|
| Under 60 words | 0 | 0% |
| 60-79 words | 36 | 12.0% |
| 80-99 words | 208 | 69.3% |
| 100-119 words | 55 | 18.3% |
| 120+ words | 1 | 0.3% |

| Metric | Value |
|--------|-------|
| Minimum | 66 words |
| Maximum | 121 words |
| Average | 90.5 words |
| Median | 90 words |

**Every single story exceeds the 60-word limit.** The average story is 50% over the limit. The LLM (gemma3:4b-it-qat) consistently ignores the word count constraint. This is a fundamental prompt compliance failure.

### 5.6 Teaser Quality Analysis

The prompt explicitly bans: "You need to...", "Trust me...", "This place is...", "Seriously..."

| Banned Phrase | Occurrences | Percentage |
|---------------|-------------|------------|
| "Seriously" | 259 | **86.3%** |
| "You need to" | 14 | 4.7% |
| "This place is" | 14 | 4.7% |
| "Trust me" | 0 | 0% |

**86.3% of teasers contain "Seriously"** -- the most explicitly banned word. The LLM is almost entirely ignoring the teaser ban list.

**Top 15 most-repeated teasers (verbatim):**

| Count | Teaser |
|-------|--------|
| 47 | "Seriously, you \*need\* to check this out." |
| 12 | "Seriously, you need to check this out." |
| 11 | "Seriously, you \*have\* to check this out." |
| 7 | "Seriously, this place is a gem." |
| 7 | "Seriously, you \*need\* to try this." |
| 6 | "Seriously, you \*have\* to check this place out." |
| 6 | "Seriously, you \*have\* to try this." |
| 5 | "Seriously, it's a gem." |
| 4 | "Seriously, you \*have\* to see this." |
| 4 | "Seriously, you \*need\* to check this place out." |
| 4 | "Seriously good meat, right here." |
| 3 | "Seriously, you won't believe this place." |
| 3 | "Seriously cool clothes, no fuss." |
| 3 | "Seriously good meat, no fuss." |
| 2 | "Seriously, you \*need\* to see this." |

The top teaser alone ("Seriously, you \*need\* to check this out.") accounts for 15.7% of all stories. The top 5 teasers account for 28%.

### 5.7 German Expression Analysis

The story generation prompt requests natural German expressions for Munich-set stories.

| Expression | Occurrences (across all stories) |
|------------|----------------------------------|
| gemutlich | 242 |
| Feierabend | 104 |
| Mahlzeit | 83 |
| Gemutlichkeit | 3 |
| Na | 1 |
| Doch | 0 |
| genau | 0 |
| Servus | 0 |
| Stammtisch | 0 |
| Prost | 0 |

**Per-story distribution of German expressions:**

| Expressions per story | Story count |
|----------------------|-------------|
| 0 expressions | 16 |
| 1 expression | 137 |
| 2 expressions | 145 |
| 3 expressions | 2 |

Only 3 of 10 German expressions are ever used meaningfully: "gemutlich" (in 80%+ of stories), "Feierabend" (35%), and "Mahlzeit" (28%). The model has latched onto "gemutlich" as its default German flavor word and uses it in nearly every story. Expressions like "Servus" (Munich greeting), "Prost" (cheers), "Stammtisch" (regulars' table), and "Doch" (quintessentially German) are never used.

### 5.8 Repetitive Pattern Analysis

Frequency of formulaic phrases across all 300 stories (content + teaser + local_tip):

| Pattern | Occurrences | Per-story avg |
|---------|-------------|---------------|
| "a real" | 362 | 1.21 |
| "you know" | 284 | 0.95 |
| "Okay, so" | 234 | 0.78 |
| "a little" | 214 | 0.71 |
| "Munich" in title | 143 | 47.7% of titles |
| "Gem" in title | 141 | 47.0% of titles |
| "a proper" | 134 | 0.45 |
| "honestly" | 126 | 0.42 |
| "tucked away" | 121 | 0.40 |
| "not flashy" | 97 | 0.32 |
| "Quiet" in title | 42 | 14.0% of titles |
| "really lovely" | 38 | 0.13 |
| "stepping into" | 36 | 0.12 |
| "Find" in title | 19 | 6.3% of titles |
| "definitely worth" | 19 | 0.06 |
| "I haven't actually" | 3 | -- |

**Template-like story structure:** Nearly every story follows this pattern:

1. Opens with "Okay, so [POI name]..."
2. Contains "you know?" as a filler
3. Uses "not flashy" or "tucked away" to describe the place
4. Includes "gemutlich" as the German flavor word
5. Ends with a compliment: "a real gem" / "a real find" / "a proper [X]"

**Example stories demonstrating template quality:**

**Galerie Daniel Blau (art):** "Galerie Daniel Blau is a really lovely little spot tucked away on Maximilianstrasse. It's not flashy, \*you know\*? It's more...refined. They've got a great selection of paintings -- mostly contemporary, but with a good range of styles."

**Graf Rumford (nightlife):** "Okay, so Graf Rumford isn't flashy, you know? It's... \*gemutlich\*. Really cozy. It's tucked away in the neighborhood, which is good because it's not overrun with tourists."

**Almwelt (shopping):** "Almwelt is... well, it's a little gem. It's not flashy, you know? More like a really well-curated collection of clothes tucked away in the neighborhood."

These three stories from different categories are structurally nearly identical. The voice, phrasing, and structure are indistinguishable across categories despite the category persona system.

### 5.9 Hallucination Analysis

**10 stories were generated for POIs with 0 keywords and 0 products.** These low-data stories are the most prone to fabrication.

**Confirmed hallucinations:**

1. **Feldherrnhalle (culture, 0 kw, 0 prod, no enrichment):** Story claims "It's where the Oathlanders swore their allegiance in 1918." The term "Oathlanders" does not exist. The Feldherrnhalle is historically associated with the Beer Hall Putsch of 1923. The LLM fabricated a non-existent historical event and group.

2. **Hotel Lux (services, 0 kw, 0 prod):** Story claims "It's got this really cool, almost Art Deco vibe -- very 1930s Munich" and mentions "the bartender, Klaus" and "Steaks Rossini." With zero data about this POI, the Art Deco style, the bartender's name, and the menu item are entirely fabricated.

3. **Fan-Shop Souvenirs (shopping, 0 kw, 0 prod):** Story claims "They mostly have officially licensed stuff -- you can find everything from Star Wars hoodies to that ridiculously detailed Harry Potter wand" and "maybe 100 square meters." Product inventory and store dimensions are fabricated.

4. **Neues Rathaus (architecture, 0 kw, 0 prod, no enrichment):** Story says "I haven't actually been \*inside\*" which is the honesty guideline working, but then claims "red sandstone" and "neo-Renaissance" style details that are not grounded in any provided data. (These happen to be factually correct for Neues Rathaus, but the model had no data to support them -- this is coincidental correctness, not grounding.)

5. **Roeckl (shopping, 0 kw, 0 prod):** "They specialize in purses, and honestly, the quality is really good." Roeckl is actually famous for gloves (since 1839), not purses. This is a factual error.

6. **Gmund (shopping, 0 kw, 0 prod):** Story describes "leather-bound journal" and "hand-pressed cards." Gmund is a paper company, but specific product claims are ungrounded.

### 5.10 Natural Voice Assessment

**Category persona differentiation: WEAK**

The prompt system includes 15 distinct category personas (food, history, art, etc.). However, analysis of stories across categories shows:

- The same verbal tics ("you know?", "honestly", "Okay, so") appear in every category.
- The same structural template is used regardless of persona.
- Food stories and shopping stories are nearly indistinguishable in voice.
- History stories use the same casual filler as nightlife stories.
- The persona system has negligible impact on the actual generated output.

**Markdown artifacts in stories:** Many stories contain markdown formatting (\*italics\*, \*\*bold\*\*) which should be plain text for a storytelling app. Examples: "\*gemutlich\*", "\*Feierabend\*", "\*Mahlzeit!\*", "\*you know\*".

### 5.11 Full Story Examples (per category)

**Architecture (2 stories, both 0 keywords/products):**

- **Neues Rathaus:** Title "Neues Rathaus -- Bavarian Grandeur", Teaser "Seriously, this place is a stunner.", 93 words. Opens with "Okay, I haven't actually been \*inside\*..." Contains ungrounded architectural claims.

- **Theatinerkirche:** Title "Theatinerkirche: A Quiet Beauty", Teaser "Seriously, this place is a gem.", 106 words. Opens with "Okay, so I haven't actually \*been\* there myself..." Ends with "\*Mahlzeit!\*" which is contextually inappropriate (Mahlzeit means "meal time" -- used as a greeting, but odd for a church).

**Food (66 stories, sample):**

- **Augustiner Klosterwirt:** Title "Augustiner's Kloster Charm", 82 words, 6 kw, 5 prod. Mentions "vegan and vegetarian options" -- possibly grounded in data, but template-heavy.

- **Blatt Salat:** Title "Blatt Salat -- A Gem!", 89 words, 6 kw, 5 prod. "It's tucked away in the neighborhood -- not a flashy place, but \*gemutlich\*, honestly."

**History (15 stories, sample):**

- **Berta Koppmair:** Title "Berta's Quiet Corner", 94 words, 4 kw, 0 prod. Claims "a woman who, during the war, hid Jewish children in her small bakery." This is a memorial/Stolperstein -- the specific claims about hiding children in a bakery need verification.

- **Fischbrunnen:** Title "Fischbrunnen: A Quiet Piece of History", 93 words, 1 kw, 0 prod. Claims "built back in 1954" -- the current fountain dates from 1954 (Richard Thiersch replica), this appears factually correct.

**Shopping (155 stories -- largest set):**

Stories are highly repetitive. A random sample of opening lines: "Okay, so [name] isn't flashy, you know?", "[Name] is a real little treasure.", "[Name] is... well, it's a little gem."

---

## 6. Bug Report

### 6.1 Critical Bugs

**BUG-001: Confidence and model_id not persisted to database**
- **Severity:** Critical
- **File:** `scripts/generate-stories.ts` (story insertion logic)
- **Description:** The `generateStory()` function in `src/lib/ai/storyGenerator.ts` returns `confidence` ("high"/"medium"/"low") and `modelId` fields, but all 300 remarks in the database have NULL for both `confidence` and `model_id` columns.
- **Impact:** Cannot assess story reliability. The UI cannot show confidence indicators. Traceability to the model version used is lost.
- **Evidence:** `SELECT COUNT(CASE WHEN confidence IS NOT NULL THEN 1 END) FROM remarks;` returns 0.
- **Reproduction:** Run `make generate-stories`, then query `SELECT confidence, model_id FROM remarks LIMIT 5;` -- all NULL.

**BUG-002: LLM ignores "Seriously" teaser ban -- 86.3% violation rate**
- **Severity:** Critical
- **File:** `src/lib/ai/storyGenerator.ts` (line ~280, prompt construction)
- **Description:** The prompt explicitly states `BANNED teasers: "You need to...", "Trust me...", "This place is...", "Seriously..."` but 259 of 300 teasers (86.3%) contain "Seriously." The gemma3:4b-it-qat model does not reliably follow negative instructions.
- **Impact:** Stories lack variety. User experience degraded by repetitive teasers. Brand voice is monotonous.
- **Evidence:** 47 stories share the exact teaser "Seriously, you \*need\* to check this out."
- **Recommended fix:** Add post-processing in `parseStoryResponse()` to detect and reject/regenerate teasers containing banned phrases, or use a different prompting strategy (provide only allowed patterns, not bans).

**BUG-003: Story content exceeds 60-word limit -- 100% violation rate**
- **Severity:** Critical
- **File:** `src/lib/ai/storyGenerator.ts` (line ~282, prompt)
- **Description:** Prompt says "STORY: 60 words MAX" but every story is 66-121 words. Average is 90.5 words (50% over limit).
- **Impact:** Stories are longer than designed, affecting audio duration calculations and UI layout.
- **Evidence:** `MIN(word_count) = 66`, which already exceeds the 60-word limit.
- **Recommended fix:** Add word count validation in `parseStoryResponse()` and truncate or regenerate. Alternatively, increase the limit to match actual output (80-100 words) if the longer format is preferred.

### 6.2 High Severity Issues

**BUG-004: 3 POIs have no enrichment source and are invisible to search**
- **Severity:** High
- **File:** `scripts/enrich-taxonomy.ts`
- **Description:** Neues Rathaus (architecture), Theatinerkirche St. Kajetan (architecture), and Feldherrnhalle (culture) have NULL enrichment source, 0 keywords, 0 products, no summary, no embedding, and are not indexed in Typesense. These are major Munich landmarks.
- **Impact:** Three of Munich's most iconic landmarks are completely invisible to search. Searching "Neues Rathaus" or "Marienplatz" will not find the city hall.
- **Root cause:** Likely these POIs have OSM tags that don't match any enrichment pipeline query group (e.g., `building=yes` without `amenity=*` or `shop=*` tags).

**BUG-005: Hallucinated content in low-data stories**
- **Severity:** High
- **File:** `src/lib/ai/storyGenerator.ts`
- **Description:** Stories for POIs with 0 keywords and 0 products contain fabricated specifics: invented historical events ("Oathlanders" at Feldherrnhalle), fabricated staff names ("Klaus" at Hotel Lux), wrong product claims (Roeckl described as purse shop instead of glove shop).
- **Impact:** User trust is damaged when stories contain verifiably false information.
- **Evidence:** 10 stories generated for 0-keyword/0-product POIs, at least 6 contain fabricated claims.

**BUG-006: Nature category has 0 POIs**
- **Severity:** High
- **File:** `scripts/seed-pois.ts` (OSM query groups)
- **Description:** The Nature category exists but has zero POIs. Munich has significant green spaces (Englischer Garten, Hofgarten, etc.) that should be seeded.
- **Impact:** "park", "garden", "nature" searches return irrelevant results. A core category is completely empty.

**BUG-007: "Kirche" (church) search returns kitchen stores**
- **Severity:** High
- **File:** `scripts/generate-embeddings.ts` / embedding model
- **Description:** Searching "Kirche" (German for church) returns WMF and Kustermann (kitchen/houseware stores) as top results. The embedding model (embeddinggemma:300m) appears to conflate German "Kirche" with English "kitchen" in vector space.
- **Impact:** German-language searches for churches are completely broken. The 3 actual churches (St. Peter, Frauenkirche, Sankt Michael) are not returned.

### 6.3 Medium Severity Issues

**BUG-008: locale field empty for all 300 remarks**
- **Severity:** Medium
- **File:** `scripts/generate-stories.ts`
- **Description:** The `locale` column in the remarks table is empty for all rows. The story generator detects locale but it is not being persisted.
- **Impact:** Cannot filter stories by language. Multi-language support is non-functional.

**BUG-009: Single-character queries return results**
- **Severity:** Medium
- **File:** `src/app/api/search/route.ts`
- **Description:** Queries "a" and "ab" return 11 results each. There should be a minimum query length validation.
- **Impact:** Wasted computation and confusing results for accidental/incomplete input.

**BUG-010: "clothes" and "shoes" return identical rankings**
- **Severity:** Medium
- **File:** Embedding model / `src/lib/search/semantic.ts`
- **Description:** Both queries return the same top 3 (J.G. Mayer, Ludwig Beck, Hartl) with identical scores, suggesting the embedding model cannot differentiate between clothing sub-categories.
- **Impact:** Users searching for specific product types get generic department store results.

**BUG-011: Story content contains markdown formatting**
- **Severity:** Medium
- **File:** `src/lib/ai/storyGenerator.ts` (`parseStoryResponse`)
- **Description:** Stories contain markdown artifacts: \*gemutlich\*, \*Feierabend\*, \*you know\*. These should be stripped to plain text.
- **Impact:** If rendered without markdown parsing, users see raw asterisks. If rendered with markdown parsing, the italics may not be desirable.

**BUG-012: Category persona system has negligible effect**
- **Severity:** Medium
- **File:** `src/lib/ai/storyGenerator.ts` (CATEGORY_PERSONAS)
- **Description:** Despite 15 distinct persona definitions, all stories use the same voice, fillers, and structure. Food, art, history, and shopping stories are indistinguishable in style.
- **Impact:** The category-specific storytelling experience, a key product differentiator, is not working.

### 6.4 Low Severity Issues

**BUG-013: "Mahlzeit!" used in church context**
- **Severity:** Low
- **Description:** The Theatinerkirche story ends with "\*Mahlzeit!\*" (a mealtime greeting), which is contextually inappropriate for a church description.
- **Impact:** Minor -- reads oddly to German speakers.

**BUG-014: Cold-start latency for first semantic search**
- **Severity:** Low
- **Description:** First semantic search query takes ~1,200ms vs ~70ms for subsequent queries.
- **Impact:** First user search after server restart is noticeably slow.

**BUG-015: "outdoor activities" returns stores, not activities**
- **Severity:** Low
- **Description:** Natural language query "outdoor activities" returns Mammut Store, Sporthaus Schuster, and Jack Wolfskin (outdoor gear retailers).
- **Impact:** Semantic search conflates "doing activities" with "buying activity equipment."

---

## 7. Recommendations

### 7.1 Immediate Fixes (Bugs)

1. **Fix confidence/model_id persistence (BUG-001):** Update `scripts/generate-stories.ts` to map `GeneratedStory.confidence` and `GeneratedStory.modelId` to the remarks INSERT. Backfill existing 300 stories if possible.

2. **Add teaser post-processing (BUG-002):** In `parseStoryResponse()`, add validation that strips or regenerates teasers containing banned phrases. Consider a regex-based filter as a safety net.

3. **Fix word count enforcement (BUG-003):** Either increase the prompt limit to 80-100 words (matching actual good output), or add truncation logic. The 4B model cannot reliably count words.

4. **Fix enrichment for 3 landmark POIs (BUG-004):** Manually add enrichment data for Neues Rathaus, Theatinerkirche, and Feldherrnhalle, or expand the seed-pois query groups to capture `historic=*` and `building=*` tagged POIs.

5. **Persist locale to remarks (BUG-008):** Map the detected locale to the INSERT statement.

### 7.2 Short-term Improvements

1. **Seed Nature category POIs (BUG-006):** Add `leisure=park`, `leisure=garden`, `landuse=forest` to the OSM seed query groups.

2. **Add minimum query length validation (BUG-009):** Reject queries under 2-3 characters with a user-friendly message.

3. **Strip markdown from story content (BUG-011):** Add a post-processing step in `parseStoryResponse()` to remove markdown formatting.

4. **Improve prompt engineering:** The gemma3:4b-it-qat model has fundamental issues with following negative instructions and word count limits. Consider: (a) Switching to a larger model for story generation. (b) Using few-shot examples in the prompt instead of instruction-only prompting. (c) Adding a quality gate that re-generates stories failing basic criteria.

5. **Increase story coverage:** At 22.4% coverage, most POIs have no stories. Prioritize generating stories for Food, Culture, and History categories.

### 7.3 Architecture Changes

1. **Add a story quality validation pipeline:** Post-generation checks for: teaser ban compliance, word count, hallucination indicators (specific claims without supporting data), and German expression variety.

2. **Consider German-language embedding model:** The embeddinggemma:300m model has German language confusion issues ("Kirche" -> kitchen). A multilingual or German-specific embedding model would improve search quality for German queries.

3. **Add a story regeneration mechanism:** For the 259 stories with "Seriously" teasers and the 10 stories with hallucinated content, provide a batch regeneration capability with improved prompts.

---

## 8. Test Evidence

### 8.1 Raw Search Results

Full search results for all 30 queries are documented in Section 4.2. Each query was run against `POST /api/search` with Munich center coordinates and 5km radius.

### 8.2 Story Samples

Story samples are included inline in Section 5.11. All 300 stories were analyzed programmatically; representative examples are quoted throughout Sections 5.6-5.9.

### 8.3 Database Queries Used

```sql
-- 1. POI count and category distribution
SELECT c.slug, c.name, COUNT(p.id) as count
FROM pois p JOIN categories c ON p.category_id = c.id
GROUP BY c.slug, c.name ORDER BY count DESC;

-- 2. Profile completeness
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN profile IS NOT NULL THEN 1 END) as has_profile,
  COUNT(CASE WHEN profile->>'summary' IS NOT NULL AND profile->>'summary' != '' THEN 1 END) as has_summary,
  COUNT(CASE WHEN jsonb_array_length(COALESCE(profile->'keywords', '[]'::jsonb)) > 0 THEN 1 END) as has_keywords,
  COUNT(CASE WHEN jsonb_array_length(COALESCE(profile->'products', '[]'::jsonb)) > 0 THEN 1 END) as has_products,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as has_embedding
FROM pois;

-- 3. Enrichment source distribution
SELECT profile->>'enrichmentSource' as source, COUNT(*)
FROM pois GROUP BY profile->>'enrichmentSource' ORDER BY count DESC;

-- 4. POIs with zero keywords by category
SELECT c.slug, COUNT(*)
FROM pois p JOIN categories c ON p.category_id = c.id
WHERE jsonb_array_length(COALESCE(p.profile->'keywords', '[]'::jsonb)) = 0
GROUP BY c.slug ORDER BY count DESC;

-- 5. Remark statistics
SELECT COUNT(*) as total_remarks,
  COUNT(CASE WHEN confidence IS NOT NULL THEN 1 END) as has_confidence,
  COUNT(CASE WHEN model_id IS NOT NULL THEN 1 END) as has_model_id
FROM remarks;

-- 6. Story distribution by category
SELECT c.slug, COUNT(r.id) as story_count
FROM remarks r JOIN pois p ON r.poi_id = p.id JOIN categories c ON p.category_id = c.id
GROUP BY c.slug ORDER BY story_count DESC;

-- 7. Full story export for analysis
SELECT r.title, r.teaser, r.content, r.local_tip, r.confidence, r.model_id,
  p.name as poi_name, c.slug as category,
  jsonb_array_length(COALESCE(p.profile->'keywords', '[]'::jsonb)) as kw_count,
  jsonb_array_length(COALESCE(p.profile->'products', '[]'::jsonb)) as prod_count,
  p.profile->>'enrichmentSource' as enrichment_src
FROM remarks r JOIN pois p ON r.poi_id = p.id JOIN categories c ON p.category_id = c.id
ORDER BY c.slug, p.name;

-- 8. Typesense collection info
-- curl -s http://localhost:8108/collections/pois -H 'X-TYPESENSE-API-KEY: obelisk_typesense_dev'

-- 9. Story coverage by category
SELECT c.slug, COUNT(p.id) as total_pois, COUNT(r.id) as stories,
  ROUND(COUNT(r.id)::numeric / NULLIF(COUNT(p.id), 0) * 100, 1) as coverage_pct
FROM pois p JOIN categories c ON p.category_id = c.id
LEFT JOIN remarks r ON r.poi_id = p.id
GROUP BY c.slug, c.name ORDER BY coverage_pct DESC;

-- 10. Unenriched POIs
SELECT p.name, c.slug, p.profile->>'enrichmentSource' as src
FROM pois p JOIN categories c ON p.category_id = c.id
WHERE p.profile->>'enrichmentSource' IS NULL OR p.profile->>'enrichmentSource' = '';

-- 11. Keyword/product statistics
SELECT AVG(jsonb_array_length(COALESCE(profile->'keywords', '[]'::jsonb))) as avg_kw,
  AVG(jsonb_array_length(COALESCE(profile->'products', '[]'::jsonb))) as avg_prod,
  MIN(jsonb_array_length(COALESCE(profile->'keywords', '[]'::jsonb))) as min_kw,
  MAX(jsonb_array_length(COALESCE(profile->'keywords', '[]'::jsonb))) as max_kw
FROM pois;

-- 12. Full list of zero-keyword POIs
SELECT p.name, c.slug,
  jsonb_array_length(COALESCE(p.profile->'keywords', '[]'::jsonb)) as kw,
  jsonb_array_length(COALESCE(p.profile->'products', '[]'::jsonb)) as prod,
  p.profile->>'enrichmentSource' as src
FROM pois p JOIN categories c ON p.category_id = c.id
WHERE jsonb_array_length(COALESCE(p.profile->'keywords', '[]'::jsonb)) = 0;
```

---

## Appendix A: Full Story Listing

300 stories across 13 categories (Views has 0). Due to size, only category counts and coverage are listed here. Full story data was exported to CSV for programmatic analysis.

| Category | Stories | Example POIs |
|----------|---------|-------------|
| Architecture | 2 | Neues Rathaus, Theatinerkirche St. Kajetan |
| Art | 8 | Argumente, Galerie Daniel Blau, Galerie Hegemann, MUCA |
| Culture | 18 | Comite-Hof, Elise-Aulinger-Brunnen, Feldherrnhalle |
| Education | 1 | Juristische Bibliothek im Rathaus |
| Food | 66 | Augustiner Klosterwirt, Blatt Salat, Cafe Aran |
| Health | 10 | Hechler, HNO an der Hofstatt, Logopaedie Horstmann-Neu |
| Hidden Gems | 2 | Spielplatz Hochbruckenstrasse, Zweite Stammstrecke Munchen |
| History | 15 | Berta Koppmair, Fanny Leimberg, Fischbrunnen |
| Nightlife | 9 | Augustiner Stehausschank, Graf Rumford, Heiliggeist 1 Bar |
| Services | 10 | Deutsche Bank, Hotel am Markt, Hotel Lux |
| Shopping | 155 | Adenauer & Co Strandhaus, Aenderei 3.0, Almwelt |
| Sports | 3 | Fitness First, Il Giardino Yoga, Kurt-Landauer-Platz |
| Transport | 1 | Nationaltheater |

## Appendix B: Search Query Results

All 30 search queries with full results are documented in Section 4.2-4.7. Summary:

- **30 queries tested** across 6 categories
- **22 PASS**, **4 FAIL**, **4 MARGINAL**
- **Failures:** "park" (no parks in DB), "Kirche" (embedding confusion), "outdoor activities" (returns stores), single-letter queries (no validation)
- **Average response time:** ~95ms (excluding cold-start outlier)
- **Typo tolerance overhead:** ~60ms per query (LLM parse fallback)

---

*Report generated 2026-02-26 from live database and API queries against commit `edb0371` on branch `improve-db-part-2`.*
