# Obelisk

Created by: Furkan Akbulutlar
Created time: January 17, 2026 9:11 AM
Last edited by: Furkan Akbulutlar
Last updated time: February 26, 2026

## 1. What is Obelisk?

Obelisk is a **next-generation intelligent map** that deeply understands every place in the world. Unlike traditional maps that show you data and wait for you to search, Obelisk already knows what you need — and shows you before you ask.

Today's maps are transactional tools. Obelisk is building toward a **full daily-driver map replacement** — starting with what no other map has: genuine semantic understanding of places. Every café, monument, park, and hidden courtyard has a rich profile of what it is, what makes it special, and who it's right for. This intelligence powers everything: contextual discovery, ambient remarking, and eventually navigation, transit, and daily use.

**Core Philosophy:** Be the knowledgeable local friend everyone wishes they had in every city.

**One-liner:** *"Your local guide, anywhere in the world."*

**Long-term vision:** The map that understands places so well, you never pre-research anything again.

---

## 2. The Problem We're Solving

### Current Map Experience (Google Maps, Apple Maps)

- **Transactional**: Get from A to B as fast as possible
- **Search-dependent**: You must know what you're looking for
- **Sterile**: Shows data, not stories
- **Algorithmic sameness**: Everyone gets the same popular results
- **Overwhelming**: Too many options, no curation

### The Pre-Research Tax

Every outing requires homework. People spend hours researching before they go anywhere:

- Planning a holiday? Read 50 blog posts, compare 20 hotels, bookmark 30 restaurants
- Picking a dinner spot? Scroll through reviews, filter by rating, check photos, still unsure
- Need coffee? Open Google Maps, type "coffee," get 40 results sorted by ad spend

This research loop is exhausting, repetitive, and often wrong — because ratings and reviews don't capture what makes a place *right for you, right now*.

### The Human Reality

- People still ask friends and locals for recommendations
- The best discoveries are accidental, not searched
- Context matters more than ratings
- Remarks make places memorable
- Decision fatigue is real

### The Gap

Despite having the world's information in our pockets, we still feel like strangers in new places. Maps show us everything but understand nothing.

---

## 3. Our Unique Value Proposition

### The Intelligence Gap

Google Maps knows *where* places are. Obelisk knows *what* they are.

Every POI in Obelisk has a deep semantic profile — not just a name and address, but keywords, products, cultural context, brand data, and AI-generated summaries. This is the foundation everything else is built on: when the map truly understands every place, it can surface the right one without being asked.

### Google Maps vs Obelisk

| Aspect | Google Maps | Obelisk |
| --- | --- | --- |
| **Primary Goal** | Efficient navigation | Intelligent understanding + discovery |
| **Knowledge** | Business listings, user reviews | Deep semantic profiles, taxonomy, embeddings |
| **Mode** | Reactive (you search) | Proactive (it already knows) |
| **Content** | Business data, reviews | Remarks, context, local knowledge, semantic understanding |
| **Personalization** | Based on search history | Based on interests, context, time, and place understanding |
| **Discovery** | Sponsored results first | Best match based on genuine understanding |
| **Experience** | Look at screen, read reviews | Glance at map, trust the intelligence |
| **Long-term** | Navigation utility | Full daily-driver map with intelligence |

### Our Differentiators

1. **Semantic Understanding** - Every place has a deep profile: what it is, what makes it special, who it's for
2. **Zero-Friction Discovery** - The map shows you the right places before you search
3. **Ambient Remarking** - Remarks find you as you walk, powered by proximity intelligence
4. **Contextual Awareness** - Time, weather, your interests, your pace — everything factors in
5. **Audio-First** - Hands-free exploration, eyes on the world
6. **Emotional Connection** - Places have remarks, not just ratings

---

## 4. Core Features

### 4.1 Remarks (Primary Feature)

**The soul of Obelisk** - Contextual remarks that surface automatically as you explore.

**How it works:**

1. Walking near an interesting place triggers a subtle notification
2. A 3-5 word teaser appears: *"The Fountain's Secret"*
3. Tap to hear a 30-60 second remark narrated in conversational tone
4. Or keep walking—another remark will find you

**Types of Remarks:**

- **AI-Generated**: LLM creates remarks from OSM, Wikipedia, historical data, business webpage
- **User-Created**: Locals share their knowledge, create tours, add tips
- **Curated Tours**: Thematic walking routes (Architecture, Food, History, etc.)

**Content Tone:**

- Like a friend telling you a cool fact
- Casual, warm, occasionally humorous
- Never dry Wikipedia-style information

### 4.2 Capsules

**Digital time capsules locked to locations**

- Leave a message for a specific person at a specific place
- Unlock conditions: specific date, specific person arrives, anniversary
- Personal legacy: messages for future self, children, loved ones
- Creates emotional connection between people, places, and time

**Use cases:**

- Anniversary message that unlocks when partner visits "your spot"
- Message to future self at graduation location
- Family history stories at ancestral hometown

### 4.3 Moments

**Synchronized shared experiences**

- Listen to the same audio/remark with friends simultaneously
- Shared walking tours where everyone hears the same narration
- Focus on the world together, not your screens
- Creates bonding through shared discovery

### 4.4 Passages

**Truly personalized navigation**

**Accessibility Features:**

- Wheelchair-accessible routes
- Audio descriptions for visually impaired
- Quiet path suggestions for anxiety/sensory sensitivity
- Crowd level warnings

**Preference Learning:**

- Learns your interests over time (history, food, architecture, nature)
- Adapts remark density to your pace
- Suggests based on time of day, weather, mood

### 4.5 Echoes

**Context-aware audio experiences**

- Operatic themes approaching opera house
- Jazz near historic jazz venues
- Tranquil sounds in parks
- Era-appropriate music for historical sites

### 4.6 Frames

**Place-first social layer**

A full social experience where every post is pinned to a real place. Share photos, remarks, and recommendations from your travels. Follow explorers whose taste you trust, like posts that inspire you, build your own profile of places you've been. The feed isn't a timeline — it's the world map.

- Visit a place, post a Frame — photo, short text, your take on it
- Pinned to the exact location on the map
- Other users discover it when browsing the area, visiting, or following you
- Like, comment, follow — social mechanics people expect, but spatially organized
- Discovery is spatial — browse a neighborhood, see what people posted there
- Profiles are travel maps — a map of everywhere you've been and shared
- Connected to Obelisk's semantic understanding — Frames at a café appear alongside its AI-generated Remark

---

## 5. User Experience Design

### 5.1 First Impression (Onboarding)

**Goal:** Get users exploring within 60 seconds

1. **Open app** → Map centered on current location
2. **Immediate value** → Show 2-3 nearby Remarks pins
3. **Gentle prompt** → "Walk toward the fountain to discover its secret"
4. **First remark** → Delight within 2 minutes of opening

**No lengthy onboarding.** The product teaches itself through use.

### 5.2 Map Interface

**Primary View: The Intelligent Map**

```
┌─────────────────────────────────────────────────┐
│ STATUS BAR                                       │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌───────────────────────────┐       ┌────┐      │
│  │ 🔍 Search or ask Obelisk… │       │ ⚙️ │      │
│  └───────────────────────────┘       └────┘      │
│                                                   │
│              ○ History                            │
│     ○ Food        ○ Hidden                       │
│                                                   │
│           ⑫ ← cluster (12 POIs)                  │
│                    🔵                             │
│                   (you)      ○ Art                │
│        ○ Nature                                   │
│                         ○ Architecture            │
│              ○ Culture                            │
│                                                   │
│  ┌─ Bottom Sheet (glassmorphism) ──────────────┐ │
│  │  ┌────────────────────────────────────────┐  │ │
│  │  │       ─── drag handle (36×5px) ───     │  │ │
│  │  │                                        │  │ │
│  │  │  ┌────┐                                │  │ │
│  │  │  │ 🎭 │ "The Actor's Last Bow"         │  │ │
│  │  │  └────┘  150m · 45 sec · History       │  │ │
│  │  │                                        │  │ │
│  │  │  A forgotten theater once stood here…  │  │ │
│  │  │  [Tap to discover →]                   │  │ │
│  │  └────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────┐  ┌──────┐                    ┌──────┐  │
│  │  +   │  │  −   │                    │  ◎   │  │
│  │ zoom  │  │ zoom │                    │locate│  │
│  └──────┘  └──────┘                    └──────┘  │
│                                                   │
└─────────────────────────────────────────────────┘

Legend:
○    = Remark pin (color indicates category)
⑫   = Supercluster (expands on zoom/tap)
🔵   = User location (pulsing blue dot + accuracy ring)
⚙️   = Settings (opens in bottom sheet)
◎    = Locate button (center on user)
```

**Design Principles:**

- **Minimal chrome** — Map is the hero, UI recedes
- **Intelligent markers** — Color-coded by category, clustered at distance, detailed up close
- **Bottom sheet pattern** — All content in Apple Maps-style draggable sheet (story, POI, search, settings)
- **Glassmorphism** — Translucent surfaces with blur, never opaque overlays
- **Auto dark mode** — Switches with system preference

### 5.3 Story Experience

**Geofence Notification (50m proximity):**

```
┌─────────────────────────────────────────┐
│ ✨ "Hidden Brewery Tunnel"               │
│    50m away · Tap to discover            │
└─────────────────────────────────────────┘
← Slides up from bottom, auto-dismisses
← 2-min cooldown between notifications
← Max 5 per 30-min session
```

**Story Card (in bottom sheet):**

```
┌─────────────────────────────────────────┐
│       ─── drag handle ───               │
│                                         │
│  ┌────┐  The Hidden Brewery Tunnel      │
│  │ 🏛️ │  ━━━━━━━━━━━━━━━━━━━━━━━━━     │
│  └────┘  History · 45 sec · 50m away    │
│                                         │
│  In 1847, beneath this ordinary         │
│  cobblestone street, Augustinian        │
│  monks dug a secret network of          │
│  tunnels to store their famous…         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 💡 Local tip                    │    │
│  │ "Look for the small brass       │    │
│  │  plaque on the wall—most        │    │
│  │  tourists miss it completely."  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [📍 Navigate]  [🔄 Regenerate]         │
│  [▶ Listen]     [↗️ Share]               │
└─────────────────────────────────────────┘
← Navigate opens Google Maps directions
← Regenerate re-rolls story (20s cooldown)
← Listen placeholder (TTS planned)
```

### 5.4 Interaction Modes

**1. Ambient Mode (Default)**

- Passive discovery while walking
- Notifications appear when near interesting places
- Minimal interaction required

**2. Explore Mode**

- Actively browse the map for stories
- Filter by category (History, Food, Art, Hidden Gems)
- Plan routes for later

**3. Audio Mode**

- Hands-free, screen-off exploration
- Voice announces stories as you walk
- Earbuds recommended

**4. Tour Mode**

- Follow a curated or user-created tour
- Step-by-step guidance with stories
- Estimated time, distance shown

### 5.5 Audio Experience

**Why Audio-First:**

- Eyes stay on the world, not the screen
- More immersive storytelling
- Safer while walking
- Accessible to visually impaired

**Voice Characteristics:**

- Warm, conversational tone
- Gender-neutral option available
- Speed adjustable
- Multiple language support

---

## 6. How We Replace Google Maps

### 6.1 Strategy: Intelligence First, Utility Later

We don't try to out-feature Google Maps on day one. Instead, we build what they can't: **genuine understanding of every place.** Then we layer utility features on top of that intelligence.

```
Phase 1: Intelligence     → Deep semantic understanding, contextual discovery, stories
Phase 2: Daily companion  → Search, recommendations, personalization
Phase 3: Full utility     → Navigation, transit, driving, real-time data
Phase 4: Daily driver     → Complete Google Maps replacement
```

Google Maps has 20 years of utility features. We have something they don't: a knowledge layer that makes every interaction smarter. They optimize for getting you somewhere fast. We optimize for getting you to the *right* place.

### 6.2 Where We Win Today

| Need | Google Maps | Obelisk |
| --- | --- | --- |
| "What's interesting here?" | Shows popular places | Already knows, shows the best ones |
| "I want coffee" | 40 results sorted by ads | The right café for you, right now |
| "I'm bored, surprise me" | Not possible | Core feature |
| "I want to feel like a local" | Generic recommendations | Deep local knowledge per place |
| "Plan my evening" | You do the research | Intelligence does it for you |
| "Guide me without screens" | Requires constant looking | Audio-first |

### 6.3 Where Google Maps Still Wins (For Now)

Features we'll build over time but don't have yet:

- Turn-by-turn driving navigation
- Transit directions and schedules
- Traffic optimization
- Street View
- Business hours / live busyness data

---

## 7. Target Users & Personas

### Primary Personas

**1. The Curious Traveler**

- Visiting a new city
- Wants authentic experiences, not tourist traps
- Limited time, decision fatigue
- *"I want to feel like I discovered the real city"*

**2. The Urban Explorer**

- Lives in a city but wants to rediscover it
- Weekend wanderer
- Interested in history, architecture, culture
- *"There's so much I don't know about my own neighborhood"*

**3. The Memory Maker**

- Wants to create meaningful moments
- Uses Capsules for loved ones
- Values emotional connection to places
- *"I want to leave something meaningful behind"*

**4. The Accessibility Seeker**

- Mobility challenges, sensory sensitivities
- Needs adapted routes and guidance
- Underserved by current apps
- *"I want to explore without anxiety"*

### Secondary Personas

**5. The Remote Planner**

- Planning future trips from home
- Armchair traveler
- Creating wishlists and routes

**6. The Local Guide**

- Creates Remarks for their city
- Shares local knowledge
- Community contributor

---

## 8. Use Cases (Detailed)

### Use Case 1: Tourist First Day

**Scenario:** Marco arrives in Munich for a 3-day trip

**Without Obelisk:**

- Opens Google Maps, sees overwhelming options
- Reads 50 reviews to pick a restaurant
- Walks past interesting places without knowing
- Returns home having seen "the famous stuff"

**With Obelisk:**

- Opens Obelisk at hotel
- Sees 3 nearby Remarks within walking distance
- Walks toward Marienplatz, hears story about hidden courtyard
- Discovers local café through a Remark, not Tripadvisor
- Ends day feeling like he found "the real Munich"

### Use Case 2: Local Weekend Stroll

**Scenario:** Anna and Tom want a relaxed Saturday in their city

**Journey:**

1. Open Obelisk while having morning coffee
2. See a "Hidden Gems" tour in their neighborhood
3. Start walking, first Remark plays
4. Use Moments to listen together
5. Discover a courtyard they never knew existed
6. End at a café the app suggested—perfect vibe

### Use Case 3: Lunch Group Decision

**Scenario:** Work colleagues need lunch in 1 hour

**Journey:**

1. One person opens Obelisk
2. Asks: "Lunch for 5 people, 30 min walk max, under €15"
3. Obelisk suggests 3 options with quick context
4. Group picks one, follows audio navigation
5. Back at office on time

### Use Case 4: Anniversary Capsule

**Scenario:** David wants to surprise his wife on their 10th anniversary

**Journey:**

1. Creates a Capsule at the restaurant where they had their first date
2. Records a voice message and adds photos
3. Sets unlock condition: "When Sarah arrives on March 15th"
4. On their anniversary, they visit the restaurant
5. Sarah's phone notifies her of the Capsule
6. She hears David's message, sees their old photos

---

## 9. Technical Vision

### 9.1 Semantic Knowledge Layer (Built)

The foundation of Obelisk's intelligence. Every POI has a deep semantic profile:

- **Taxonomy enrichment** — OSM tags mapped to keywords, products, and categories via static taxonomy maps (Google Product Taxonomy + OSM taginfo + NSI brands)
- **Brand intelligence** — Wikidata integration provides brand-specific products, industry classification
- **LLM synthesis** — Ollama generates 2-3 sentence descriptions grounded in merged taxonomy data
- **Vector embeddings** — 768-dim embeddings via embeddinggemma for semantic similarity search
- **Structured profiles** — JSONB per POI: subtype, keywords, products, summary, attributes

This means Obelisk doesn't just know "there's a shop here" — it knows it's a women's clothing boutique specializing in sustainable fashion with handmade accessories.

### 9.2 Hybrid Search Engine (Built)

Two-engine search with Reciprocal Rank Fusion:

- **Typesense** — Keyword search with typo tolerance, geo-filtering, faceted filtering
- **pgvector** — Semantic similarity via cosine distance on 768-dim embeddings
- **Query parser** — 230+ fast-path patterns + LLM fallback for intent parsing
- **Fusion scoring** — RRF ranking, geo-penalization by distance, story-boost for enriched POIs

### 9.3 LLM-Powered Content Generation (Built)

- Stories generated from semantic profiles, OSM data, Wikipedia, historical sources
- 15 category-specific personas with distinct storytelling voices
- Tone and length adapted to context
- Multi-language generation (11 locale profiles with local expressions)
- On-demand generation + regeneration with version tracking

### 9.4 Context Engine (Partial)

**Built:**
- Location (GPS) + map viewport awareness
- Geofence proximity detection (500m preload, 100m queue, 50m trigger)
- Story fatigue prevention (2-min cooldown, max 5 per 30-min session)

**Planned:**
- Time of day, weather, user preferences
- Walking pace and direction analysis
- Previous interaction learning
- Optimal story timing

### 9.5 Audio Pipeline (Planned)

- Text-to-speech with natural voices (Piper TTS)
- Gyroscope-aware directional narration
- Pre-generated for nearby POIs, on-demand for personalized content
- Background playback and offline caching

### 9.6 Data Sources

- **OpenStreetMap** — POIs from local PBF extract, geometry, tags
- **Google Product Taxonomy** — Category/product classification (~6K categories)
- **Name Suggestion Index** — Brand recognition and OSM path mapping
- **Wikidata** — Brand data, industry classification, cultural context
- **OSM Taginfo** — Tag value distributions for enrichment
- **Wikipedia** — Historical facts and cultural context
- **Weather APIs** — Planned for context engine

---

## 10. MVP Scope & Current Status

### Phase 1: Core Discovery (COMPLETE — January 2026)

**Goal:** Prove the ambient remarking concept

**Features:**

- [x]  Interactive Mapbox GL JS map with current location + dark mode
- [x]  408 POIs seeded from Munich OSM extract, 100+ stories generated
- [x]  Remark pins with category colors + Supercluster clustering
- [x]  Story cards with glassmorphism UI in Apple Maps-style bottom sheet
- [x]  Geofence triggers (50m proximity, 2-min cooldown, max 5/30-min)
- [x]  On-demand story generation + regeneration via Ollama
- [x]  Multi-language story generation (11 locales)
- [ ]  Audio playback (deferred — Piper TTS integration planned)

**Success Metric:** Users discover 3+ stories per session

### Phase 2: Intelligence & Search (IN PROGRESS)

**Goal:** Build the semantic knowledge layer and reliable search

**Completed:**

- [x]  Taxonomy enrichment pipeline (OSM tags → keywords, products, summaries)
- [x]  Brand enrichment via Wikidata + Name Suggestion Index
- [x]  768-dim vector embeddings via embeddinggemma
- [x]  Typesense keyword search with typo tolerance and geo-filtering
- [x]  Hybrid 2-engine search (Typesense + pgvector) with RRF ranking
- [x]  230+ fast-path query parser + LLM fallback
- [x]  Autocomplete via Typesense prefix search

**In Progress:**

- [ ]  Search UI/UX overhaul (responsive glassmorphic results)
- [ ]  Viewport-aware search (search where user is looking, not just GPS)
- [ ]  Settings card (in-sheet, no page navigation)

**Planned:**

- [ ]  PWA support (service worker, offline, install prompt)
- [ ]  UI internationalization (i18n)
- [ ]  Audio playback + TTS pipeline
- [ ]  Explore Mode (guided walking tours)

### Phase 3: Daily Companion

**Goal:** Features that make Obelisk useful beyond exploration

- [ ]  User accounts + preferences sync
- [ ]  Bookmarking / saved places
- [ ]  User-created Remarks
- [ ]  Curated tours
- [ ]  Personalized recommendations based on learned interests
- [ ]  Frames (place-first social layer)

### Phase 4: Emotional Connection

- [ ]  Capsules (time-locked location messages)
- [ ]  Moments (synchronized shared experiences)
- [ ]  Social sharing

### Phase 5: Full Daily Driver

**Goal:** Replace Google Maps for daily use

- [ ]  Turn-by-turn navigation
- [ ]  Transit directions
- [ ]  Driving + traffic
- [ ]  Accessible routing + crowd warnings
- [ ]  Multi-city expansion

---

## 11. Success Metrics

### Engagement

- Time spent exploring (not just navigating)
- Stories listened to per session
- Return visits within 7 days

### Discovery

- Unique places visited after Remark
- User-reported "discoveries"
- Route deviations from straight path

### Emotional

- NPS score
- Capsule creation rate
- Moment sharing rate

### Growth

- User-created Remarks
- Organic sharing
- City coverage expansion

---

## 12. Design Language

### Visual Identity - Very Important

**Design Philosophy:** Modern iOS glassmorphism inspired by Apple Maps (iOS 26)

**Core Principles:**

- **Glassmorphism:** Translucent, frosted-glass surfaces with blur effects
- **Layered depth:** Multiple translucent layers creating visual hierarchy
- **Light & airy:** Soft, luminous aesthetic with generous whitespace
- **Fluid motion:** Smooth transitions and natural-feeling animations

**Primary Palette:**

- **Background:** Soft translucent white/gray with blur (`rgba(255,255,255,0.7)`)
- **Accent:** Vibrant coral/orange for discovery markers and CTAs
- **Secondary accents:** Soft blue, mint green, warm yellow for categories
- **Text:** Dark charcoal on light, soft white on dark mode

**Surface Treatment:**

- Frosted glass cards with 20-40px blur radius
- Subtle border highlights (`rgba(255,255,255,0.3)`)
- Soft drop shadows for elevation
- Rounded corners (16-24px radius)

**Typography:** SF Pro Display / Inter — clean, readable, system-native feel

**Iconography:** Filled, colorful icons with soft gradients (Apple Maps style)

### Voice & Tone

- Friendly local, not corporate guide
- Knowledgeable but not lecturing
- Occasionally witty, never corny
- Inclusive and warm

### Sound Design

- Subtle notification sounds (not intrusive)
- Ambient transitions
- Voice that feels like a friend

---

## 13. Competitive Landscape

| App | Focus | Our Advantage |
| --- | --- | --- |
| Google Maps | Navigation + business listings | We understand places semantically, not just list them |
| Apple Maps | Premium navigation UX | We have deeper place intelligence + storytelling |
| TripAdvisor | Reviews | We synthesize knowledge, not aggregate opinions |
| Airbnb Experiences | Guided tours | We're always-on, ambient, AI-powered |
| Detour/VoiceMap | Audio tours | We're infinite — every place gets a story, not just curated ones |
| Yelp | Business discovery | We know what places *are*, not just what people *say* about them |

---

## 14. Why Now?

1. **LLM Maturity** - Small local models (4B params) can generate quality stories and semantic understanding at zero API cost
2. **Embedding Models** - Lightweight embedding models enable semantic search on commodity hardware
3. **Open Data Richness** - OSM + Wikidata + taxonomy datasets provide enough structured data to build deep place profiles without proprietary sources
4. **TTS Quality** - Natural voices are finally good enough for conversational narration
5. **Mobile Audio** - Airpods/earbuds ubiquity makes audio-first interfaces viable
6. **Algorithm Fatigue** - People want authentic recommendations, not sponsored results
7. **Map Complacency** - Google Maps hasn't innovated on discovery in a decade — the space is ripe for disruption

---

## 15. The Obelisk Promise

> "Every street has a story. Every corner holds a secret. Every journey can become a discovery."

We're not building a better map. We're building a map that actually understands the world — and shows you exactly what you need, before you even ask.

---

## 16. Unique Technology: Geospatial-Aware Agent

### The Obelisk Agent

Unlike traditional map apps that wait for user queries, Obelisk features a **proactive geospatial AI agent** that understands location context and anticipates needs.

### 16.1 Proximity Intelligence (Remarks Engine)

**How it works (built):**

```
┌─────────────────────────────────────────────────────────┐
│                    USER WALKING                          │
│                         ↓                                │
│    ┌─────────────────────────────────────────────┐      │
│    │         GEOFENCE DETECTION (useGeofence)    │      │
│    │  • 500m radius: Pre-load story data         │      │
│    │  • 100m radius: Queue notification          │      │
│    │  •  50m radius: Trigger StoryNotification   │      │
│    └─────────────────────────────────────────────┘      │
│                         ↓                                │
│    ┌─────────────────────────────────────────────┐      │
│    │         COOLDOWN RULES (built)              │      │
│    │  • 2 min minimum between notifications      │      │
│    │  • Max 5 notifications per 30-min session   │      │
│    │  • Dismiss → 5 min local cooldown           │      │
│    └─────────────────────────────────────────────┘      │
│                         ↓                                │
│    ┌─────────────────────────────────────────────┐      │
│    │         NOTIFICATION (built)                │      │
│    │  • Toast slides up with teaser + distance   │      │
│    │  • Tap → opens StoryCard in bottom sheet    │      │
│    │  • Auto-dismiss after 8 seconds             │      │
│    └─────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Built:**

1. **Three-tier geofencing** — 500m preload, 100m queue, 50m trigger via Haversine distance
2. **Story fatigue prevention** — Fixed cooldown rules (2-min, max 5/30-min, dismiss penalty)
3. **Pre-loading** — Nearby remarks fetched in 5km radius, cached via React Query

**Planned (not yet built):**

1. **Predictive loading** — Analyze walking trajectory, pre-generate stories for likely path
2. **Contextual relevance** — Time-of-day awareness (morning: cafés, evening: restaurants)
3. **Interest matching** — Track category engagement, build preference profile over time
4. **Adaptive density** — Increase/decrease notification frequency based on user engagement

### 16.2 Intelligent Search (Conversational Discovery)

**Beyond keyword search** — Natural language understanding for complex needs.

**Search Capabilities:**

| Query Type | Example | How Obelisk Handles |
| --- | --- | --- |
| **Simple** | "coffee nearby" | Shows cafés with stories |
| **Contextual** | "quiet place to work" | Filters by ambiance, WiFi, noise level |
| **Complex** | "lunch for 5, outdoor seating, under €15, 20 min walk" | Multi-criteria search with route |
| **Discovery** | "surprise me with something historic" | Random story from history category |
| **Time-based** | "what's interesting on my way to the train station" | Stories along calculated route |

**Conversational Search Flow:**

```
┌─────────────────────────────────────────────────────────┐
│  User: "I have 2 hours before my flight, what should   │
│         I see near the airport?"                        │
│                                                         │
│  Obelisk Agent Processing:                              │
│  ├─ Parse intent: Time-constrained exploration          │
│  ├─ Extract: 2 hours, airport location                  │
│  ├─ Calculate: Walkable radius (~3km)                   │
│  ├─ Filter: Stories that fit time budget                │
│  └─ Rank: By user interests + uniqueness                │
│                                                         │
│  Response: "There's a hidden observation deck 15 min    │
│  walk from Terminal 2 with an incredible story about    │
│  the first commercial flight here. Plus a local bakery  │
│  that pilots swear by. Want me to create a route?"      │
└─────────────────────────────────────────────────────────┘
```

**Search UI (Current Implementation):**

```
┌───────────────────────────────────────┐
│ ┌───────────────────────────────────┐ │
│ │ 🔍 Search or ask Obelisk…         │ │
│ └───────────────────────────────────┘ │
│                                       │
│  Autocomplete (Typesense, <50ms):    │
│  ┌───────────────────────────────┐    │
│  │ Café Frischhut       340m     │    │
│  │ Café Glockenspiel    520m     │    │
│  │ Café Luitpold        800m     │    │
│  └───────────────────────────────┘    │
│                                       │
│  Full search results (hybrid):       │
│  ┌───────────────────────────────┐    │
│  │ 🍝 Café Frischhut    340m     │    │
│  │    Schmalznudeln · has story  │    │
│  ├───────────────────────────────┤    │
│  │ 🍝 Café Luitpold     800m     │    │
│  │    Historic café · no story   │    │
│  └───────────────────────────────┘    │
│                                       │
│  Planned additions:                   │
│  • Quick category filter pills       │
│  • Viewport-aware results            │
│  • Glassmorphic result cards         │
└───────────────────────────────────────┘
```

**Voice Search:**

- Hands-free querying while walking
- Natural conversation flow
- Follow-up questions supported
- *"What about somewhere with outdoor seating?"*

---

## 17. Detailed UI/UX Flows

### 17.1 App Launch Flow

**Current (no onboarding — straight to map):**

```
┌──────────────────────────────────────────────────────────────────┐
│                        APP LAUNCH                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. App opens → Map centered on Munich (default)                  │
│                                                                   │
│  2. Browser location prompt (if first visit)                      │
│     ┌─────────────────────────────────────┐                      │
│     │ localhost:3000 wants to know your    │                      │
│     │ location.   [Allow]  [Block]        │                      │
│     └─────────────────────────────────────┘                      │
│                                                                   │
│  3a. Location granted → Map centers on user, blue dot appears    │
│      → Nearby remark pins load (5km radius)                      │
│      → Geofencing activates                                       │
│                                                                   │
│  3b. Location denied → Map stays on Munich center                │
│      → Pins still visible, search still works                    │
│      → No geofence notifications                                 │
│                                                                   │
│  4. User can immediately:                                         │
│     • Tap any pin → Story card or POI card                       │
│     • Search → Hybrid results                                    │
│     • Walk around → Geofence triggers stories                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Planned onboarding (future):**

```
┌──────────────────────────────────────────────────────────────────┐
│  Screen 1: Welcome splash (2 sec)                                 │
│  Screen 2: Location permission (custom UI, not browser prompt)   │
│  Screen 3: Quick interests (optional, skippable)                  │
│            [🏛️ History] [🍝 Food] [🎨 Art] [🌳 Nature]          │
│            [🏗️ Architecture] [💎 Hidden Gems]                    │
│  Screen 4: Map with immediate value                               │
└──────────────────────────────────────────────────────────────────┘
```

### 17.2 Main Map Interface (Current Implementation)

```
┌───────────────────────────────────────────────────────────┐
│ STATUS BAR                                                 │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────┐               ┌────┐        │
│  │ 🔍 Search or ask Obelisk… │               │ ⚙️ │        │
│  └──────────────────────────┘               └────┘        │
│                                                             │
│                  ○ coral (history)                          │
│       ○ pink                ○ yellow                       │
│          (food)     ⑧         (hidden)                     │
│                   cluster                                   │
│                      🔵                                     │
│                     (you)         ○ blue                   │
│       ○ purple                     (arch.)                 │
│         (art)          ○ indigo                             │
│                          (culture)                          │
│                                                             │
│  ┌──────┐                                       ┌──────┐  │
│  │  +   │                                       │  ◎   │  │
│  │      │                                       │locate│  │
│  │  −   │                                       └──────┘  │
│  └──────┘                                                  │
│                                                             │
│  ┌─ Bottom Sheet ──────────────────────────────────────┐   │
│  │         ─── drag handle (36×5px pill) ───           │   │
│  │                                                      │   │
│  │  Sheet modes (one at a time):                       │   │
│  │  • "story"  → StoryCard (pin tap or geofence)      │   │
│  │  • "poi"    → POICard (external POI, no story yet) │   │
│  │  • "search" → SearchResults (after search query)   │   │
│  │  • "settings" → SettingsCard (planned)             │   │
│  │  • null     → Sheet hidden                          │   │
│  │                                                      │   │
│  │  Snap points: 35% (peek) · 55% (half) · 85% (full)│   │
│  │  Spring physics on drag release                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└───────────────────────────────────────────────────────────┘

Pin interactions:
  Tap pin (has story)  → Bottom sheet opens with StoryCard
  Tap pin (no story)   → Async lookup → POICard with "Generate Story" button
  Tap cluster          → Map zooms in to expand cluster
  Geofence trigger     → StoryNotification toast slides up
```

### 17.3 Story Discovery Flow (Current Implementation)

```
┌──────────────────────────────────────────────────────────────────┐
│                     STORY DISCOVERY FLOW                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Path A: Pin Tap (user taps a remark pin on map)                 │
│                                                                   │
│  Tap pin with story → sheetMode = "story"                        │
│  ┌─────────────────────────────────────┐                         │
│  │         ─── drag handle ───         │                         │
│  │                                     │                         │
│  │  ┌────┐ The Hidden Brewery Tunnel   │                         │
│  │  │ 🏛️ │ History · 45 sec · 50m     │                         │
│  │  └────┘                             │                         │
│  │                                     │                         │
│  │  In 1847, beneath this ordinary     │                         │
│  │  cobblestone street, Augustinian    │                         │
│  │  monks dug a secret network…        │                         │
│  │                                     │                         │
│  │  ┌───────────────────────────────┐  │                         │
│  │  │ 💡 Local tip                  │  │                         │
│  │  │ "Look for the small brass     │  │                         │
│  │  │  plaque on the wall…"         │  │                         │
│  │  └───────────────────────────────┘  │                         │
│  │                                     │                         │
│  │  [📍 Navigate]    [🔄 Regenerate]   │                         │
│  └─────────────────────────────────────┘                         │
│                                                                   │
│  Path B: Pin Tap (POI without story)                             │
│                                                                   │
│  Tap pin → async lookup → sheetMode = "poi"                     │
│  ┌─────────────────────────────────────┐                         │
│  │         ─── drag handle ───         │                         │
│  │                                     │                         │
│  │  ┌────┐ Café Frischhut             │                         │
│  │  │ 🍝 │ Food · 120m away           │                         │
│  │  └────┘                             │                         │
│  │                                     │                         │
│  │  Traditional Bavarian bakery known  │                         │
│  │  for Schmalznudeln since 1973…      │                         │
│  │  (from semantic profile summary)    │                         │
│  │                                     │                         │
│  │  [📍 Navigate]  [✨ Generate Story] │                         │
│  └─────────────────────────────────────┘                         │
│  Generate Story → calls Ollama → inserts remark → switches       │
│  to StoryCard with freshly generated story                       │
│                                                                   │
│  Path C: Geofence (proximity trigger at 50m)                     │
│                                                                   │
│  User walks within 50m of POI with story:                        │
│  ┌───────────────────────────────────────┐                       │
│  │ ✨ "Hidden Brewery Tunnel"             │  ← Toast slides up   │
│  │    50m away · Tap to discover          │  ← Auto-dismiss 8s   │
│  └───────────────────────────────────────┘                       │
│  Tap → opens StoryCard (same as Path A)                          │
│                                                                   │
│  Cooldown rules:                                                  │
│  • 2 min between notifications                                   │
│  • Max 5 per 30-min session                                      │
│  • Dismiss → 5 min local cooldown                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 17.4 Search Flow (Current Implementation)

```
┌──────────────────────────────────────────────────────────────────┐
│                        SEARCH FLOW                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User taps search bar → keyboard opens                        │
│                                                                   │
│  2. Typing → Typesense autocomplete (<50ms)                      │
│     ┌───────────────────────────────────────┐                    │
│     │ 🔍 "bakery near mari…"                │                    │
│     ├───────────────────────────────────────┤                    │
│     │ Rischart Backhaus         120m        │                    │
│     │ Café Frischhut            340m        │                    │
│     │ Hofpfisterei              510m        │                    │
│     └───────────────────────────────────────┘                    │
│                                                                   │
│  3. Submit → Hybrid search (Typesense + pgvector)                │
│     Query parser: 230+ fast-path patterns + LLM fallback        │
│     Results fused via Reciprocal Rank Fusion                     │
│     sheetMode = "search"                                         │
│                                                                   │
│  4. Results in bottom sheet:                                      │
│     ┌───────────────────────────────────────┐                    │
│     │         ─── drag handle ───           │                    │
│     │                                       │                    │
│     │  Results for "bakery near marienplatz" │                    │
│     │                                       │                    │
│     │  🍝 Rischart Backhaus      120m       │                    │
│     │     Traditional bakery · has story    │                    │
│     │                                       │                    │
│     │  🍝 Café Frischhut         340m       │                    │
│     │     Famous Schmalznudeln              │                    │
│     │                                       │                    │
│     │  🍝 Hofpfisterei           510m       │                    │
│     │     Organic bread bakery              │                    │
│     └───────────────────────────────────────┘                    │
│                                                                   │
│  5. Tap result → sheetMode switches to "story" or "poi"         │
│     Back button → returns to search results                      │
│                                                                   │
│  Pan map after search → "Search this area" button appears        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 17.5 Explore Mode (PLANNED — Not Yet Built)

```
┌─────────────────────────────────────────────────────────────┐
│                      EXPLORE MODE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User taps "Explore" → Obelisk scans surroundings           │
│  → LLM generates optimized walking route (4-8 stops)        │
│  → Audio-first guided experience                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🚶 Explore Munich          45 min · 1.8km          │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         │    │
│  │                                                      │    │
│  │  ●──────●──────🔵──────○──────○──────○              │    │
│  │  1      2     (you)    4      5      6              │    │
│  │                                                      │    │
│  │  Next: "The Hidden Courtyard" (200m)                │    │
│  │                                                      │    │
│  │  Categories: 🏛️ 🍝 💎 🏗️ 🎭 🌳                     │    │
│  │                                                      │    │
│  │  [Let's Go]  [Shuffle]  [Cancel]                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  See Plan.md P5 for full specification                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 17.6 Audio Mode (PLANNED — Not Yet Built)

```
┌─────────────────────────────────────────────────────────────┐
│                      AUDIO MODE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Floating mini player (glass-floating):                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🎧 "The Hidden Brewery Tunnel"                      │    │
│  │    ▶ ━━━━━━━━━○──── 0:23/0:45                      │    │
│  │    [⏸️ Pause]  [⏭️ Skip]  [🔊 Vol]                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Features:                                                   │
│  • Screen-off playback (background audio)                   │
│  • Gyroscope-aware directional narration                    │
│  • Pre-generated audio for nearby POIs (500m preload)       │
│  • Piper TTS with warm, conversational voice                │
│  • Seamless queue between stories (no silence gaps)         │
│                                                              │
│  Lock screen notification:                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🗿 OBELISK                                          │    │
│  │ "The Clockmaker's Workshop" — Tap to listen         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  See Plan.md P6 for full specification                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 17.7 Tour Mode (PLANNED — Not Yet Built)

```
┌─────────────────────────────────────────────────────────────┐
│                       TOUR MODE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Munich's Hidden Passages                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                  │
│  Stop 3 of 8 · 1.2km remaining · ~45 min                    │
│                                                              │
│  Map with route:                                             │
│  ●────●────🔵────○────○────○                                │
│  1    2   (you)  4    5    6                                │
│                                                              │
│  Current Stop:                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  3. The Secret Passage                              │    │
│  │     Behind this ordinary door lies a corridor       │    │
│  │     that once connected rival merchant houses…      │    │
│  │     [▶ Listen 60s]                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Next: "The Counting House" (350m)                          │
│  [⏮️ Previous]  [⏭️ Next Stop]  [End Tour]                  │
│                                                              │
│  See Plan.md P5 for full specification                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 18. Feature Prioritization & Roadmap

### 18.1 Phase 1 - "Prove the Magic" (COMPLETE — January 2026)

**Goal:** Validate that ambient remarking creates engagement

**Scope:** Single city (Munich)

| Feature | Status | Result |
| --- | --- | --- |
| Interactive Map (Mapbox GL JS) | DONE | Map loads < 2s, auto dark mode |
| Remark Pins + Supercluster | DONE | 408 POIs, 100+ stories, category colors |
| Story Cards (glassmorphism) | DONE | Bottom sheet with rich content |
| Geofence Triggers | DONE | 50m/100m/500m tiers, cooldown logic |
| Story Generation + Regeneration | DONE | On-demand via Ollama, version tracking |
| Multi-language Stories | DONE | 11 locale profiles |

**Tech Stack:**

- Next.js 16 + React 19
- Mapbox GL JS v3.18 + react-map-gl v8.1
- PostgreSQL 15 + pgvector + pg_trgm
- Ollama (gemma3:4b-it-qat)
- Drizzle ORM, Tailwind CSS v4, Framer Motion v12

### 18.2 Phase 2 - "Build Intelligence" (IN PROGRESS)

**Goal:** Deep semantic understanding of every place + reliable search

| Feature | Status |
| --- | --- |
| Taxonomy enrichment pipeline | DONE |
| Brand enrichment (Wikidata + NSI) | DONE |
| Vector embeddings (768-dim) | DONE |
| Typesense keyword search | DONE |
| Hybrid search (Typesense + pgvector + RRF) | DONE |
| 230+ fast-path query parser | DONE |
| Search UI/UX overhaul | IN PROGRESS |
| Viewport-aware search | IN PROGRESS |
| Settings card | NOT STARTED |
| PWA support | NOT STARTED |
| UI internationalization | NOT STARTED |
| Audio playback + TTS | NOT STARTED |
| Explore Mode (guided tours) | NOT STARTED |

**Added to stack:** Typesense v30.1, embeddinggemma:300m, Zod v4

### 18.3 Phase 3 - "Daily Companion"

**Goal:** Features that make Obelisk useful every day, not just for exploration

| Feature | Description |
| --- | --- |
| User accounts | Auth, profiles, preference sync |
| Bookmarks + saved places | Personal place collections |
| User-created Remarks | Local knowledge contributions |
| Curated tours | Thematic walking routes |
| Personalized recommendations | Learned interests + context-aware suggestions |
| Conversational search | Natural language queries with full intent understanding |
| Context engine | Time, weather, mood, pace — full contextual awareness |
| Frames | Place-first social layer — post, follow, like, spatially organized |

### 18.4 Phase 4 - "Emotional Connection"

**Goal:** Features that create lasting bonds between people and places

| Feature | Description |
| --- | --- |
| Capsules | Time-locked location messages |
| Moments | Synchronized shared listening |
| Social sharing | Share discoveries and routes |
| Ambient soundscapes | Context-aware audio experiences |

### 18.5 Phase 5 - "Full Daily Driver"

**Goal:** Replace Google Maps for daily use

| Feature | Description |
| --- | --- |
| Turn-by-turn navigation | Walking, driving, cycling |
| Transit directions | Public transport integration |
| Traffic + real-time data | Live conditions |
| Multi-city expansion | Beyond Munich |
| Accessible routing | Wheelchair-friendly, quiet paths, crowd warnings |
| Screen reader support | Full VoiceOver/TalkBack |

### 18.6 Strategic Path

```
Intelligence First                    Utility Later
─────────────────────────────────────────────────────────────
Phase 1 ✓   Phase 2 →    Phase 3       Phase 4      Phase 5
Stories      Semantic     Daily use     Emotional    Full map
Geofence     Search       Accounts      Capsules     Navigation
Map UI       Embeddings   Bookmarks     Moments      Transit
             Taxonomy     Tours         Social       Multi-city
             Audio        Context AI    Soundscapes  Accessibility
```

---

## 19. Brand Identity & Guidelines

### 19.1 Brand Essence

**Brand Name:** Obelisk

**Tagline:** *"Your local guide, anywhere."*

**Name Rationale:**

- An obelisk is an ancient monument that marked important places
- It represents permanence, guidance, and cultural significance
- The shape (↑) evokes direction and pointing toward discovery
- Historical connection to navigation and wayfinding

### 19.2 Brand Personality

| Attribute | Description | Voice Example |
| --- | --- | --- |
| **Friendly** | Like a knowledgeable friend, not a textbook | "Did you know this café was a speakeasy?" |
| **Curious** | Invites wonder and exploration | "There's something interesting around the corner..." |
| **Warm** | Welcoming, inclusive, never condescending | "Here's a local favorite most tourists miss" |
| **Trustworthy** | Reliable information, honest recommendations | "This spot gets crowded after 2pm" |
| **Playful** | Occasional wit, never forced humor | "The fountain has a secret. Well, had one." |

### 19.3 Visual Identity

**Design Philosophy:** iOS 26 Glassmorphism — Apple Maps inspired

**Logo Concept:**

- Minimal, elegant Obelisk silhouette
- Works on translucent surfaces
- App icon: 🗿 monument with soft gradient fill
- Adapts to light/dark mode with subtle glow

**Light Mode Palette:**

| Element | Value | Usage |
| --- | --- | --- |
| **Glass Surface** | `rgba(255,255,255,0.72)` | Cards, sheets, bottom bars |
| **Glass Border** | `rgba(255,255,255,0.5)` | Subtle edge highlights |
| **Blur Radius** | `20-40px` | Frosted glass effect |
| **Coral Orange** | `#FF6B4A` | Primary accent, markers, CTAs |
| **Sky Blue** | `#5AC8FA` | User location, navigation |
| **Mint Green** | `#34C759` | Nature, success states |
| **Warm Yellow** | `#FFD60A` | Favorites, highlights |
| **Soft Pink** | `#FF9F9F` | Food category |
| **Label Primary** | `#1C1C1E` | Headlines, primary text |
| **Label Secondary** | `#8E8E93` | Captions, metadata |

**Dark Mode Palette:**

| Element | Value | Usage |
| --- | --- | --- |
| **Glass Surface** | `rgba(30,30,30,0.75)` | Cards, sheets, bottom bars |
| **Glass Border** | `rgba(255,255,255,0.1)` | Subtle edge highlights |
| **Background** | `#000000` | True black for OLED |
| **Elevated Surface** | `#1C1C1E` | Secondary surfaces |
| **Coral Orange** | `#FF7F5C` | Primary accent (brighter for dark) |
| **Label Primary** | `#FFFFFF` | Headlines, primary text |
| **Label Secondary** | `#8E8E93` | Captions, metadata |

**Typography:**

| Usage | Font | Weight | Size |
| --- | --- | --- | --- |
| **Large Title** | SF Pro Display | Bold (700) | 34px |
| **Title 1** | SF Pro Display | Semibold (600) | 28px |
| **Title 2** | SF Pro Display | Semibold (600) | 22px |
| **Headline** | SF Pro Text | Semibold (600) | 17px |
| **Body** | SF Pro Text | Regular (400) | 17px |
| **Callout** | SF Pro Text | Regular (400) | 16px |
| **Subhead** | SF Pro Text | Regular (400) | 15px |
| **Footnote** | SF Pro Text | Regular (400) | 13px |
| **Caption** | SF Pro Text | Regular (400) | 12px |
| **Story Text** | New York (Serif) | Regular (400) | 19px |

*New York serif font for story narration — elegant, readable, Apple-native.*

### 19.4 Iconography

**Style:** SF Symbols + Custom (Apple Maps inspired)

**Characteristics:**

- Filled icons with soft color gradients
- Rounded, friendly shapes
- Vibrant category colors on white/dark backgrounds
- Consistent optical weight across sizes
- Multi-color variants for map markers

**Category Icons & Colors:**

| Category | Icon | Color |
| --- | --- | --- |
| **History** | Column/monument | Coral `#FF6B4A` |
| **Food** | Fork & knife | Soft Pink `#FF9F9F` |
| **Art** | Palette | Purple `#BF5AF2` |
| **Nature** | Leaf | Mint `#34C759` |
| **Architecture** | Building | Sky Blue `#5AC8FA` |
| **Hidden Gems** | Diamond/sparkle | Yellow `#FFD60A` |
| **Views** | Camera/eye | Teal `#64D2FF` |
| **Culture** | Masks | Indigo `#5E5CE6` |
| **Frames** | Camera/pin | Indigo `#5E5CE6` |

### 19.5 UI Components

**Glass Cards:**

- Background: `rgba(255,255,255,0.72)` with `backdrop-filter: blur(20px)`
- Border: `1px solid rgba(255,255,255,0.5)`
- Border radius: `16-24px` (larger = more prominent)
- Shadow: `0 8px 32px rgba(0,0,0,0.08)`
- Internal padding: `16-20px`

**Bottom Sheet (Apple Maps style):**

- Drag indicator: `36×5px` rounded pill, centered
- Snap points: Peek (25%), Half (50%), Full (90%)
- Spring animation on drag release
- Glass background with map visible beneath

**Buttons:**

| Type | Style |
| --- | --- |
| **Primary** | Coral gradient fill, white text, 12px radius, subtle shadow |
| **Secondary** | Glass surface, coral text, 12px radius |
| **Pill** | Glass surface, icon + label, fully rounded (capsule) |
| **Icon Only** | 44×44pt touch target, glass circle, SF Symbol |

**Map Pins:**

| State | Style |
| --- | --- |
| **Default** | Filled circle with category color, white icon, soft shadow |
| **Selected** | Larger scale (1.2×), bounced shadow, info card appears |
| **Visited** | Muted color (60% opacity), checkmark badge |
| **User Location** | Blue pulsing dot with accuracy ring, heading arrow |
| **Cluster** | Coral circle with count number, expands on tap |

**Search Bar:**

- Glass pill shape with SF Symbol magnifying glass
- Placeholder: "Search or ask Obelisk..."
- Expands to full-width on focus
- Recent searches appear in glass dropdown

### 19.6 Motion & Animation

**Core Principles:**

- **Fluid & natural:** Spring physics, never linear easing
- **Responsive:** Immediate feedback, no perceived lag
- **Contextual:** Motion reinforces spatial relationships
- **Subtle:** Enhance UX without distraction

**Animation Specifications:**

| Element | Animation | Timing |
| --- | --- | --- |
| **Bottom sheet** | Spring slide + blur fade | `spring(1, 100, 18)` |
| **Story card expand** | Scale up + position shift | `300ms ease-out` |
| **Map pin appear** | Drop + bounce | `400ms spring` |
| **Pin selection** | Scale pulse + shadow grow | `200ms ease-out` |
| **User location** | Continuous soft pulse | `2s infinite` |
| **Button press** | Scale down to 0.96 | `100ms ease-in` |
| **Glass blur** | Blur radius transition | `200ms ease-out` |
| **Category pills scroll** | Inertial scroll + snap | Physics-based |
| **Audio waveform** | Smooth amplitude bars | `60fps continuous` |

**Micro-interactions:**

- Haptic feedback on pin selection (light impact)
- Haptic on button press (soft tap)
- Haptic on story unlock (success notification)

**Specific Animations:**

| Element | Animation | Duration |
| --- | --- | --- |
| Story popup | Slide up + fade | 300ms |
| Card expand | Scale + fade | 250ms |
| Map pin appear | Pop + bounce | 400ms |
| User location | Gentle pulse | 2s loop |
| Audio progress | Smooth left-right | Continuous |

### 19.7 Voice & Tone (Written)

**Do:**

- Use active voice: "Walk toward the fountain"
- Be specific: "50m away" not "nearby"
- Add personality: "Here's something most tourists miss"
- Keep it short: 3-5 word teasers, 60-word stories

**Don't:**

- Sound like Wikipedia: ❌ "The structure was erected in 1847"
- Be vague: ❌ "There's something interesting here"
- Overuse exclamations: ❌ "Amazing! You won't believe this!"
- Be condescending: ❌ "You might not know this, but..."

**Example Transformations:**

| Before (Wikipedia) | After (Obelisk) |
| --- | --- |
| "The Viktualienmarkt is Munich's most popular market, established in 1807" | "This market has fed Münchners for over 200 years. The beer garden in the center? That's the real locals' secret." |
| "The Frauenkirche is a cathedral with two distinctive towers" | "See those onion-dome towers? Legend says the devil himself designed them—and he's still trapped in the entrance." |

### 19.8 Sound Identity

**Notification Sounds:**

- Soft, warm tones
- Not jarring or attention-grabbing
- Organic sounds (soft chime, gentle tap)
- Distinct but subtle

**Voice Narration:**

- Natural, conversational pace
- Warm mid-range tone
- Slight pauses for emphasis
- Not robotic or overly enthusiastic

---

## 20. Business Model

### 20.1 Revenue Strategy

**Primary Model: Freemium + Premium Subscription**

We offer core discovery features free to maximize adoption, with premium features for power users.

### 20.2 Tier Structure

| Tier | Price | Features |
| --- | --- | --- |
| **Free** | $0 | Basic discovery, 5 stories/day, standard audio |
| **Explorer** | $4.99/mo | Unlimited stories, offline mode, custom tours |
| **Guide** | $9.99/mo | All Explorer + Capsules, Moments, priority support |
| **Annual** | $49.99/yr | Guide features at 58% discount |

### 20.3 Free Tier (Core)

**Included:**

- Interactive map with location
- 5 Remark discoveries per day
- Story cards (text + audio)
- Basic search
- Category filters
- One saved bookmark

**Limitations:**

- Daily story limit (resets at midnight local)
- No offline mode
- No Capsules or Moments
- No custom tours
- Standard TTS voice only

### 20.4 Explorer Tier ($4.99/mo)

**Everything in Free, plus:**

- Unlimited story discoveries
- Offline mode (download for travel)
- Create and save custom tours
- Unlimited bookmarks
- Premium voice options
- Ad-free experience
- Early access to new features

### 20.5 Guide Tier ($9.99/mo)

**Everything in Explorer, plus:**

- Capsules (create 5/month)
- Moments (shared listening)
- Create and publish public Remarks
- Featured placement for creators
- Priority customer support
- Beta access to new cities

### 20.6 Additional Revenue Streams

**1. Partnerships (B2B)**

| Partner Type | Model |
| --- | --- |
| Tourism boards | Sponsored city content |
| Museums | Deep integration, ticket links |
| Hotels | White-label concierge version |
| Tour operators | Featured tour placement |

**2. Creator Economy**

| Feature | Revenue |
| --- | --- |
| Premium user-created tours | 70% to creator, 30% to Obelisk |
| Tipping for great Remarks | 85% to creator |
| Verified Local Guide badges | $4.99/month verification fee |

**3. Affiliate & Referrals**

| Source | Model |
| --- | --- |
| Restaurant bookings | Commission per reservation |
| Museum tickets | Affiliate percentage |
| Experience bookings | Revenue share |

### 20.7 Pricing Rationale

**Why $4.99/mo for Explorer:**

- Lower than Netflix/Spotify (impulse purchase)
- Higher than typical app subscriptions (perceived value)
- Accessible for travelers (high willingness to pay)
- Competitive with audio tour apps ($5-15 per tour)

**Why $9.99/mo for Guide:**

- Premium emotional features (Capsules worth it alone)
- Social features add stickiness
- Creators generate value for ecosystem
- Comparable to premium mapping/travel apps

### 20.8 Monetization Timeline

| Phase | Focus | Revenue Model |
| --- | --- | --- |
| MVP | Growth | Free only (no monetization) |
| Post-MVP | Validation | Freemium (Explorer tier) |
| Scale | Revenue | Full tier structure |
| Mature | Diversify | Partnerships + Creator economy |

### 20.9 Unit Economics (Target)

| Metric | Target |
| --- | --- |
| Free to Paid conversion | 5-8% |
| Monthly churn (paid) | <5% |
| Customer Acquisition Cost | <$5 |
| Lifetime Value (LTV) | >$50 |
| LTV:CAC ratio | >10:1 |

### 20.10 Growth Strategy

**Phase 1: City-by-City Launch**

1. Munich (pilot city, high tourist + local mix)
2. Berlin, Vienna (German-speaking expansion)
3. Amsterdam, Barcelona (European travelers)
4. New York, San Francisco (US entry)

**Phase 2: Viral Features**

- Social sharing ("Discover what I found!")
- Capsules create organic return visits
- User-created content builds library
- Tour creators promote their tours

**Phase 3: Partnerships**

- City tourism board partnerships
- Hotel concierge integrations
- Airline/travel app partnerships

### 20.11 Competitive Pricing Analysis

| App | Model | Price | Our Advantage |
| --- | --- | --- | --- |
| Google Maps | Free (ad-supported) | $0 | We offer depth, they offer breadth |
| VoiceMap | Per-tour purchase | $3-8/tour | We're unlimited subscription |
| Detour | Per-tour purchase | $5-10/tour | We're AI-powered, not pre-recorded |
| Rick Steves Audio | Per-city purchase | $8-15/city | We're ambient, not guided tour |

---

## 21. Summary

### What is Obelisk?

A next-generation intelligent map that deeply understands every place in the world. Starting with contextual discovery and ambient remarking, building toward a full daily-driver map replacement powered by semantic understanding.

### Core Differentiators

1. **Semantic Understanding** - Deep knowledge profiles for every place, not just names and ratings
2. **Zero-Friction Discovery** - The map shows you the right places before you search
3. **Ambient Remarking** - Remarks find you as you walk, powered by proximity intelligence
4. **Audio-First** - Eyes on the world, not the screen
5. **Intelligence-First Strategy** - Build understanding first, utility features follow
6. **Place-First Social** - Frames turns every post into a map pin, making discovery spatial

### Current Status (February 2026)

- **Phase 1 complete:** Interactive map, 408 POIs, 100+ stories, geofencing, glassmorphism UI
- **Phase 2 in progress:** Taxonomy enrichment, hybrid search, vector embeddings — all built. Search UX polish ongoing.
- **Single city:** Munich (expanding later)

### Strategic Path

Intelligence first → daily companion → full daily-driver map. Nail what no other map has (deep place understanding), then layer utility on top.

### Business Model

- Freemium with Explorer ($4.99/mo) and Guide ($9.99/mo) tiers
- Future: Partnerships, creator economy, affiliate revenue