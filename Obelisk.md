# Obelisk

Created by: Furkan Akbulutlar
Created time: January 17, 2026 9:11 AM
Last edited by: Furkan Akbulutlar
Last updated time: January 17, 2026 9:58 AM

## 1. What is Obelisk?

Obelisk is a **contextual discovery platform** that transforms navigation into a deeply human experience. Unlike traditional maps that optimize for efficiency, Obelisk optimizes for **meaningful exploration**.

**Core Philosophy:** Be the knowledgeable local friend everyone wishes they had in every city.

**One-liner:** *"Your local guide, anywhere in the world."*

---

## 2. The Problem We're Solving

### Current Map Experience (Google Maps, Apple Maps)

- **Transactional**: Get from A to B as fast as possible
- **Search-dependent**: You must know what you're looking for
- **Sterile**: Shows data, not stories
- **Algorithmic sameness**: Everyone gets the same popular results
- **Overwhelming**: Too many options, no curation

### The Human Reality

- People still ask friends and locals for recommendations
- The best discoveries are accidental, not searched
- Context matters more than ratings
- Stories make places memorable
- Decision fatigue is real

### The Gap

Despite having the world's information in our pockets, we still feel like strangers in new places.

---

## 3. Our Unique Value Proposition

### Google Maps vs Obelisk

| Aspect | Google Maps | Obelisk |
| --- | --- | --- |
| **Primary Goal** | Efficient navigation | Meaningful discovery |
| **Mode** | Reactive (you search) | Proactive (it finds you) |
| **Content** | Business data, reviews | Business data, reviews plus Stories, context, local knowledge |
| **Tone** | Corporate, neutral | Friendly local friend |
| **Personalization** | Based on search history | Based on interests & context |
| **Discovery** | Sponsored results first | Authentic hidden gems |
| **Experience** | Look at screen | Listen and explore |

### Our Differentiators

1. **Ambient Discovery** - Stories find you, you don't search for them
2. **Contextual Storytelling** - LLM-powered narratives that adapt to time, weather, your interests
3. **Audio-First** - Hands-free exploration, eyes on the world
4. **Human Curation** - Local knowledge from real people, not algorithms
5. **Emotional Connection** - Places have stories, not just ratings

---

## 4. Core Features

### 4.1 Remarks (Primary Feature)

**The soul of Obelisk** - Contextual stories that surface automatically as you explore.

**How it works:**

1. Walking near an interesting place triggers a subtle notification
2. A 3-5 word teaser appears: *"The Fountain's Secret"*
3. Tap to hear a 30-60 second story narrated in conversational tone
4. Or keep walking—another story will find you

**Types of Remarks:**

- **AI-Generated**: LLM creates stories from OSM, Wikipedia, historical data, business webpage
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

- Listen to the same audio/story with friends simultaneously
- Shared walking tours where everyone hears the same narration
- Focus on the world together, not your screens
- Creates bonding through shared discovery

### 4.4 Adaptive Guidance

**Truly personalized navigation**

**Accessibility Features:**

- Wheelchair-accessible routes
- Audio descriptions for visually impaired
- Quiet path suggestions for anxiety/sensory sensitivity
- Crowd level warnings

**Preference Learning:**

- Learns your interests over time (history, food, architecture, nature)
- Adapts story density to your pace
- Suggests based on time of day, weather, mood

### 4.5 Ambient Soundscapes

**Context-aware audio experiences**

- Operatic themes approaching opera house
- Jazz near historic jazz venues
- Tranquil sounds in parks
- Era-appropriate music for historical sites

---

## 5. User Experience Design

### 5.1 First Impression (Onboarding)

**Goal:** Get users exploring within 60 seconds

1. **Open app** → Map centered on current location
2. **Immediate value** → Show 2-3 nearby Remarks pins
3. **Gentle prompt** → "Walk toward the fountain to discover its secret"
4. **First story** → Delight within 2 minutes of opening

**No lengthy onboarding.** The product teaches itself through use.

### 5.2 Map Interface

**Primary View: The Living Map**

```
┌─────────────────────────────────────┐
│  [🔍 Search]              [👤 Profile]│
│                                     │
│         ○ ← Remark pin              │
│              ○                      │
│    🔵 (you)     ○                   │
│                                     │
│              ○                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🎭 "The Actor's Last Bow"   │    │
│  │ 150m away · 45 sec story    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [🎧 Audio Mode]    [📍 Explore]    │
└─────────────────────────────────────┘
```

**Design Principles:**

- **Minimal chrome** - Map is the hero
- **Subtle markers** - Don't clutter the view
- **Contextual UI** - Controls appear when needed
- **Dark mode default** - Easy on eyes, battery efficient

### 5.3 Story Experience

**Popup Notification (ambient mode):**

```
┌─────────────────────────────────┐
│ ✨ "Hidden Brewery Tunnel"      │
│    Tap to discover              │
└─────────────────────────────────┘
```

**Story Card (expanded):**

```
┌─────────────────────────────────┐
│ [Image of location]             │
│                                 │
│ The Hidden Brewery Tunnel       │
│                                 │
│ In 1847, beneath this ordinary  │
│ street, monks dug a secret...   │
│                                 │
│ [▶ Listen 45s]  [📍 Navigate]   │
│                                 │
│ 💡 Local tip: Best visited at   │
│    sunset when the light...     │
└─────────────────────────────────┘
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

## 6. How We Beat Google Maps

### 6.1 Where We Don't Compete

We **don't** try to replace Google Maps for:

- Turn-by-turn driving navigation
- Traffic optimization
- Commercial search ("pizza near me")

### 6.2 Where We Win

| Need | Google Maps | Obelisk |
| --- | --- | --- |
| "What's interesting here?" | Shows popular places | Tells you stories |
| "I'm bored, surprise me" | Not possible | Core feature |
| "I want to feel like a local" | Generic recommendations | Local knowledge |
| "Guide me without screens" | Requires constant looking | Audio-first |
| "Make this walk memorable" | Just navigation | Stories & soundscapes |

### 6.3 Complementary, Not Replacement

Obelisk works **alongside** Google Maps:

- Use Google to get there
- Use Obelisk to experience it

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

### 9.1 LLM-Powered Content Generation

- Stories generated from OSM data, Wikipedia, historical sources, business webpage
- Tone and length adapted to context
- Personalized based on user interests
- Real-time generation for fresh content

### 9.2 Context Engine

**Inputs:**

- Location (GPS)
- Time of day
- Weather
- User preferences
- Walking pace
- Previous interactions

**Outputs:**

- Which Remarks to surface
- Optimal story timing
- Route suggestions
- Ambient audio selection

### 9.3 Audio Pipeline

- Text-to-speech with natural voices
- Pre-generated for popular Remarks
- On-demand generation for personalized content
- Offline caching for spotty connectivity

### 9.4 Data Sources

- OpenStreetMap (POIs, geometry)
- Wikipedia/Wikidata and official webpages (historical facts)
- User-generated content (local knowledge)
- Reddit, business webpage
- Public historical archives
- Weather APIs

---

## 10. MVP Scope

### Phase 1: Core Discovery (MVP)

**Goal:** Prove the ambient storytelling concept

**Features:**

- [ ]  Interactive modern map with current location
- [ ]  Remark pins on map (AI-generated)
- [ ]  Story cards with text + audio
- [ ]  Basic personalization (interests)
- [ ]  Modern UI with glassmorphism and outstanding UX
- [ ]  Audio playback

**Success Metric:** Users discover 3+ stories per session

### Phase 2: Community

**Features:**

- [ ]  User accounts
- [ ]  User-created Remarks
- [ ]  Bookmarking/favorites
- [ ]  Curated tours

### Phase 3: Connection

**Features:**

- [ ]  Capsules
- [ ]  Moments (shared listening)
- [ ]  Social sharing

### Phase 4: Accessibility

**Features:**

- [ ]  Accessible routing
- [ ]  Crowd warnings
- [ ]  Sensory adaptations

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
| Google Maps | Navigation | We focus on experience |
| TripAdvisor | Reviews | We tell stories |
| Airbnb Experiences | Guided tours | We're always-on, ambient |
| Detour/VoiceMap | Audio tours | We're AI-powered, infinite |
| Yelp | Business discovery | We're context-aware |

---

## 14. Why Now?

1. **LLM Maturity** - GPT-5 level models enable quality storytelling
2. **TTS Quality** - Natural voices are finally good enough
3. **Mobile Audio** - Airpods/earbuds ubiquity
4. **Travel Recovery** - Post-COVID travel boom
5. **Algorithm Fatigue** - People want authentic, not sponsored

---

## 15. The Obelisk Promise

> "Every street has a story. Every corner holds a secret. Every journey can become a discovery."
> 

We're not building a better map. We're building a better way to experience the world.

---

## 16. Unique Technology: Geospatial-Aware Agent

### The Obelisk Agent

Unlike traditional map apps that wait for user queries, Obelisk features a **proactive geospatial AI agent** that understands location context and anticipates needs.

### 16.1 Proximity Intelligence (Remarks Engine)

**How it works:**

```
┌─────────────────────────────────────────────────────────┐
│                    USER WALKING                          │
│                         ↓                                │
│    ┌─────────────────────────────────────────────┐      │
│    │         GEOFENCE DETECTION                   │      │
│    │  • 500m radius: Pre-load stories             │      │
│    │  • 100m radius: Queue notification           │      │
│    │  •  50m radius: Trigger Remark popup         │      │
│    └─────────────────────────────────────────────┘      │
│                         ↓                                │
│    ┌─────────────────────────────────────────────┐      │
│    │         CONTEXT EVALUATION                   │      │
│    │  • User's walking direction                  │      │
│    │  • Time since last Remark                    │      │
│    │  • User's interest profile                   │      │
│    │  • Story relevance score                     │      │
│    └─────────────────────────────────────────────┘      │
│                         ↓                                │
│    ┌─────────────────────────────────────────────┐      │
│    │         INTELLIGENT SURFACING                │      │
│    │  • Only show if relevance > threshold        │      │
│    │  • Respect "story fatigue" cooldown          │      │
│    │  • Prioritize by user preferences            │      │
│    └─────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Key Intelligence Features:**

1. **Predictive Loading**
- Analyzes walking trajectory
- Pre-generates stories for likely path
- Caches audio before user arrives
1. **Story Fatigue Prevention**
- Learns optimal notification frequency per user
- Avoids overwhelming with too many popups
- Increases density when user is engaged
1. **Contextual Relevance**
- Morning: Cafés, breakfast spots
- Evening: Restaurants, bars, sunset viewpoints
- Weekend: Leisure activities, parks
- Rainy: Indoor attractions, covered passages
1. **Interest Matching**
- Tracks which story categories user engages with
- Builds preference profile over time
- Surfaces more of what they love

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

**Search UI:**

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Ask Obelisk anything...      │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Quick filters:                     │
│  [☕ Café] [🏛️ History] [🌳 Nature] │
│  [🍝 Food] [🎭 Culture] [💎 Hidden] │
│                                     │
│  Recent:                            │
│  • "quiet reading spots"            │
│  • "best sunset view"               │
└─────────────────────────────────────┘
```

**Voice Search:**

- Hands-free querying while walking
- Natural conversation flow
- Follow-up questions supported
- *"What about somewhere with outdoor seating?"*

---

## 17. Detailed UI/UX Flows

### 17.1 App Launch Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        FIRST LAUNCH                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Screen 1: Welcome (2 sec)                                        │
│  ┌─────────────────────────────────────┐                         │
│  │                                     │                         │
│  │         🗿 OBELISK                  │                         │
│  │                                     │                         │
│  │    Your local guide, anywhere      │                         │
│  │                                     │                         │
│  └─────────────────────────────────────┘                         │
│                         ↓                                         │
│  Screen 2: Location Permission                                    │
│  ┌─────────────────────────────────────┐                         │
│  │                                     │                         │
│  │    📍 Enable Location               │                         │
│  │                                     │                         │
│  │    Obelisk needs your location     │                         │
│  │    to discover stories around you   │                         │
│  │                                     │                         │
│  │    [Enable Location]                │                         │
│  │    [Browse without location]        │                         │
│  └─────────────────────────────────────┘                         │
│                         ↓                                         │
│  Screen 3: Quick Interests (optional, skippable)                  │
│  ┌─────────────────────────────────────┐                         │
│  │                                     │                         │
│  │    What sparks your curiosity?      │                         │
│  │                                     │                         │
│  │    [🏛️ History]  [🍝 Food]         │                         │
│  │    [🎨 Art]      [🌳 Nature]        │                         │
│  │    [🏗️ Architecture] [💎 Hidden]   │                         │
│  │                                     │                         │
│  │    [Skip for now →]                 │                         │
│  └─────────────────────────────────────┘                         │
│                         ↓                                         │
│  Screen 4: Map (main app)                                         │
│  → Immediately shows 2-3 nearby Remarks                           │
│  → First story within 2 min walking distance highlighted          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 17.2 Main Map Interface (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│ STATUS BAR                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐              ┌────┐               │
│  │🔍 Ask Obelisk...     │              │ 👤 │               │
│  └──────────────────────┘              └────┘               │
│                                                              │
│                    ○ "The Watchmaker's Secret"              │
│                         ○                                    │
│           ○                      ○                          │
│                    🔵                                        │
│                   (you)     ○                               │
│         ○                                                    │
│                         ○                                    │
│              ○                     ○                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ┌────┐                                              │    │
│  │  │ 🎭 │  "The Actor's Last Bow"                     │    │
│  │  └────┘  150m · 45 sec · History                    │    │
│  │                                                      │    │
│  │  A forgotten theater once stood here where...       │    │
│  │  [Tap to discover →]                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 🎧 Audio    │  │ 📍 Explore  │  │ 🗺️ Tours    │         │
│  │    Mode     │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Legend:
○ = Remark pin (color indicates category)
🔵 = User location
```

### 17.3 Story Discovery Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     STORY DISCOVERY FLOW                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  State 1: Ambient Notification (user approaches POI)              │
│  ┌─────────────────────────────────────┐                         │
│  │                                     │                         │
│  │     [Map continues visible]         │                         │
│  │                                     │                         │
│  │  ┌───────────────────────────────┐  │                         │
│  │  │ ✨ "Hidden Brewery Tunnel"    │  │  ← Slides up            │
│  │  │    Tap to discover            │  │    from bottom          │
│  │  └───────────────────────────────┘  │                         │
│  └─────────────────────────────────────┘                         │
│                         ↓ tap                                     │
│  State 2: Story Card (expanded)                                   │
│  ┌─────────────────────────────────────┐                         │
│  │  ┌───────────────────────────────┐  │                         │
│  │  │     [Location Image]          │  │                         │
│  │  │                               │  │                         │
│  │  └───────────────────────────────┘  │                         │
│  │                                     │                         │
│  │  The Hidden Brewery Tunnel          │                         │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━       │                         │
│  │  🏛️ History · 45 sec · 50m away    │                         │
│  │                                     │                         │
│  │  In 1847, beneath this ordinary     │                         │
│  │  cobblestone street, Augustinian    │                         │
│  │  monks dug a secret network of      │                         │
│  │  tunnels to store their famous...   │                         │
│  │                                     │                         │
│  │  [▶ Listen]  [📍 Take me there]    │                         │
│  │                                     │                         │
│  │  ───────────────────────────────    │                         │
│  │  💡 Local tip                       │                         │
│  │  "Look for the small brass plaque   │                         │
│  │   on the wall—most tourists miss    │                         │
│  │   it completely."                   │                         │
│  │                                     │                         │
│  │  [⭐ Save]  [↗️ Share]              │                         │
│  └─────────────────────────────────────┘                         │
│                         ↓ listen                                  │
│  State 3: Audio Playing                                           │
│  ┌─────────────────────────────────────┐                         │
│  │                                     │                         │
│  │     [Map visible, can walk]         │                         │
│  │                                     │                         │
│  │  ┌───────────────────────────────┐  │                         │
│  │  │ 🎧 The Hidden Brewery Tunnel  │  │                         │
│  │  │    ▶ ━━━━━━━━━○──── 0:23/0:45│  │                         │
│  │  │    [⏸️]  [⏭️ Skip]            │  │                         │
│  │  └───────────────────────────────┘  │                         │
│  └─────────────────────────────────────┘                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 17.4 Explore Mode

```
┌─────────────────────────────────────────────────────────────┐
│                      EXPLORE MODE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │🔍 Search places, stories, or ask anything...        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Categories:                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │🏛️      │ │🍝      │ │🎨      │ │🌳      │               │
│  │History │ │Food    │ │Art     │ │Nature  │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │🏗️      │ │💎      │ │📸      │ │🎭      │               │
│  │Archi.  │ │Hidden  │ │Views   │ │Culture │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
│                                                              │
│  Nearby Stories (12):                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🏛️  The Fountain's Secret           150m · 30s     │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ 💎  Hidden Courtyard Garden          200m · 45s     │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ 🍝  Where Locals Eat Lunch           300m · 20s     │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ 🏗️  The Crooked Building             450m · 60s     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Featured Tour:                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🚶 "Munich's Hidden Passages"                      │    │
│  │     8 stories · 2.3km · ~90 min                     │    │
│  │     [Start Tour →]                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 17.5 Audio Mode (Hands-Free)

```
┌─────────────────────────────────────────────────────────────┐
│                      AUDIO MODE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Screen can be locked - audio continues]                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │              🎧 AUDIO MODE ACTIVE                   │    │
│  │                                                      │    │
│  │         Stories will play as you walk               │    │
│  │                                                      │    │
│  │              ┌─────────────────┐                    │    │
│  │              │    🔊 ON        │                    │    │
│  │              └─────────────────┘                    │    │
│  │                                                      │    │
│  │  ─────────────────────────────────────────────      │    │
│  │                                                      │    │
│  │  Currently near: 3 stories                          │    │
│  │  Next story in: ~200m                               │    │
│  │                                                      │    │
│  │  ─────────────────────────────────────────────      │    │
│  │                                                      │    │
│  │  Settings:                                          │    │
│  │  Story frequency    [○○○●○] Medium                  │    │
│  │  Voice speed        [○○●○○] Normal                  │    │
│  │  Categories         [All ▼]                         │    │
│  │                                                      │    │
│  │              [Exit Audio Mode]                      │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Lock screen notification when story available:              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🗿 OBELISK                                          │    │
│  │ "The Clockmaker's Workshop" - Tap to listen         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 17.6 Tour Mode

```
┌─────────────────────────────────────────────────────────────┐
│                       TOUR MODE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Munich's Hidden Passages                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                  │
│  Stop 3 of 8 · 1.2km remaining · ~45 min                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │              [MAP WITH ROUTE]                       │    │
│  │                                                      │    │
│  │          ●────●────🔵────○────○                     │    │
│  │          1    2    3    4    5                      │    │
│  │               (you)                                  │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Current Stop:                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  3. The Secret Passage                              │    │
│  │     ─────────────────────────                       │    │
│  │     Behind this ordinary door lies a corridor       │    │
│  │     that once connected rival merchant houses...    │    │
│  │                                                      │    │
│  │     [▶ Listen 60s]                                  │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Next: "The Counting House" (350m)                          │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐                       │
│  │ ⏮️ Previous   │  │ ⏭️ Next Stop  │                       │
│  └───────────────┘  └───────────────┘                       │
│                                                              │
│  [End Tour]                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 18. Feature Prioritization & Roadmap

### 18.1 MVP (Phase 1) - "Prove the Magic"

**Goal:** Validate that ambient storytelling creates engagement

**Timeline:** 8-12 weeks

**Scope:** Single city (Munich)

| Priority | Feature | Description | Success Metric |
| --- | --- | --- | --- |
| P0 | Interactive Map | MapLibre-based map with user location | Map loads < 2s |
| P0 | Remark Pins | Display POI markers on map | 50+ Remarks in Munich |
| P0 | Story Cards | Text-based story display | Avg read time > 30s |
| P0 | Geofence Triggers | Popup when near POI | Trigger accuracy > 90% |
| P1 | Basic Search | Keyword search for places | Search used > 1x/session |
| P1 | Category Filters | Filter by History, Food, etc. | 40% use filters |
| P2 | Audio Playback | TTS for stories | 60%+ users try audio |
| P2 | Explore Mode | Browse map for stories | Discover 3+ stories/session |

**MVP Tech Stack:**

- Next.js 15 + React
- MapLibre GL JS
- PostgreSQL + PostGIS
- Self-hosted LLM (Ollama)
- Self-hosted TTS (Piper)

### 18.2 Phase 2 - "Build Community"

**Goal:** User-generated content & retention

**Timeline:** 6-8 weeks after MVP

| Priority | Feature | Description |
| --- | --- | --- |
| P0 | User Accounts | Auth, profiles, preferences |
| P0 | Save/Bookmark | Save favorite Remarks |
| P1 | User-Created Remarks | Submit local knowledge |
| P1 | Curated Tours | Thematic walking routes |
| P2 | Preference Learning | Track interests over time |
| P2 | Personalized Feed | Stories ranked by preference |

### 18.3 Phase 3 - "Intelligent Assistant"

**Goal:** Conversational discovery & advanced AI

**Timeline:** 8-10 weeks after Phase 2

| Priority | Feature | Description |
| --- | --- | --- |
| P0 | Conversational Search | Natural language queries |
| P0 | Context-Aware Suggestions | Time, weather, mood-based |
| P1 | Voice Search | Hands-free queries |
| P1 | Route-Based Discovery | Stories along planned path |
| P2 | Predictive Loading | Pre-generate likely stories |
| P2 | Ambient Soundscapes | Context-aware music |

### 18.4 Phase 4 - "Deep Connection"

**Goal:** Emotional features & social

**Timeline:** 10-12 weeks after Phase 3

| Priority | Feature | Description |
| --- | --- | --- |
| P0 | Capsules | Time-locked location messages |
| P1 | Moments | Synchronized shared experiences |
| P1 | Social Sharing | Share Remarks & routes |
| P2 | Friend Activity | See what friends discovered |

### 18.5 Phase 5 - "For Everyone"

**Goal:** Accessibility & inclusivity

**Timeline:** 8-10 weeks after Phase 4

| Priority | Feature | Description |
| --- | --- | --- |
| P0 | Accessible Routes | Wheelchair-friendly paths |
| P0 | Screen Reader Support | Full VoiceOver/TalkBack |
| P1 | Crowd Warnings | Avoid busy areas |
| P1 | Sensory Adaptations | Quiet routes, low-stim mode |
| P2 | Multi-Language | Support 10+ languages |

---

### 18.6 Feature Dependency Map

```
┌─────────────────┐
│   Interactive   │
│      Map        │
└────────┬────────┘
         │
┌─────────────────┼─────────────────┐
│                 │                 │
▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Remark    │   │  Geofence   │   │   Basic     │
│    Pins     │   │  Triggers   │   │   Search    │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Story     │   │   Audio     │   │ Conversational│
│   Cards     │   │  Playback   │   │   Search    │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └────────────┬────┴─────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │  User Accounts  │
          └────────┬────────┘
                   │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Bookmarks  │ │User Remarks │ │ Preferences │
└─────────────┘ └─────────────┘ └─────────────┘
         │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Tours     │ │  Capsules   │ │   Moments   │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

### 18.7 MVP Build Order

```
Week 1-2:   Map + Location
Week 3-4:   Database + POI data import
Week 5-6:   Remark pins + Story cards
Week 7-8:   Geofence triggers + Proximity detection
Week 9-10:  Audio playback + TTS integration
Week 11-12: Search + Filters + Polish
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

A geospatial-aware discovery platform that transforms exploration into meaningful human experiences through ambient storytelling, intelligent search, and emotional connection to places.

### Core Differentiators

1. **Proactive Discovery** - Stories find you, you don't search
2. **Geospatial AI Agent** - Context-aware, predictive, personalized
3. **Audio-First** - Eyes on the world, not the screen
4. **Emotional Features** - Capsules and Moments create lasting connections

### MVP Focus

- Single city (Munich)
- Core ambient discovery (Remarks)
- Map + Stories + Audio + Basic Search
- Prove the magic of contextual storytelling

### Business Model

- Freemium with Explorer ($4.99/mo) and Guide ($9.99/mo) tiers
- Future: Partnerships, creator economy, affiliate revenue