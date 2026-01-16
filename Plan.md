# Obelisk - Implementation Plan

A next-generation map application transforming navigation into a human experience.

---

## Tech Stack (2026 Best Practices, Self-Hosted)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 15+ (App Router) | RSC, excellent DX, PWA support |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Fast iteration, accessible components |
| **State** | TanStack Query + Zustand | Server state + minimal client state |
| **Backend** | Hono + tRPC | Ultrafast, type-safe, runs anywhere |
| **Database** | PostgreSQL 16 + PostGIS | Industry-standard geospatial |
| **ORM** | Drizzle ORM | Type-safe, minimal overhead |
| **Auth** | Lucia Auth | Self-hosted, flexible, modern |
| **Maps** | MapLibre GL JS + react-map-gl | Open-source, GPU-accelerated |
| **Real-time** | WebSocket (Hono/native) | Self-hosted, low latency |
| **Storage** | Local filesystem | Simple file storage (public/uploads/) |
| **LLM** | Ollama / vLLM | Self-hosted AI for content generation |
| **TTS** | Coqui TTS / Piper | Self-hosted natural voice synthesis |
| **Deployment** | Docker + Docker Compose | Portable, reproducible |

---

## AI Integration

### Self-Hosted LLM (Ollama / vLLM)

**Purpose:**
- Summarize place descriptions and reviews
- Generate tour narratives and storytelling content
- Create personalized recommendations
- Auto-generate remark descriptions from stops

**Stack:**
- **Ollama** for development (easy setup, runs Llama 3, Mistral, etc.)
- **vLLM** for production (high-throughput inference server)
- Models: Llama 3.1 8B/70B, Mistral 7B, or similar

**Integration:**
```
obelisk-api <-> LLM Service (Ollama/vLLM) <-> GPU Server
```

### Self-Hosted Text-to-Speech (Coqui TTS / Piper)

**Purpose:**
- Generate natural AI voices for tour narration
- Create audio content for capsules
- Dynamic storytelling as users explore

**Stack:**
- **Piper** (fast, lightweight, good quality)
- **Coqui TTS** (more voice options, slower)
- **XTTS** (voice cloning capabilities - future)

**Integration:**
- Async audio generation queue
- Cache generated audio locally
- Stream audio for real-time narration

---

## Project Structure

```
obelisk/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/               # Protected routes
│   │   │   ├── capsules/
│   │   │   ├── moments/
│   │   │   ├── profile/
│   │   │   └── remarks/
│   │   ├── (public)/             # Public routes
│   │   │   └── explore/
│   │   ├── api/trpc/[trpc]/      # tRPC handler
│   │   ├── layout.tsx
│   │   └── page.tsx              # Map home
│   ├── components/
│   │   ├── map/                  # Map components
│   │   ├── audio/                # Audio player
│   │   ├── remarks/              # Tour components
│   │   ├── capsules/             # Time capsule components
│   │   ├── moments/              # Real-time components
│   │   └── ui/                   # shadcn/ui components
│   ├── hooks/                    # Custom hooks
│   ├── lib/
│   │   ├── db/                   # Drizzle schema + client
│   │   ├── auth/                 # Lucia setup
│   │   ├── llm/                  # LLM client (Ollama/vLLM)
│   │   ├── tts/                  # TTS client (Piper/Coqui)
│   │   └── trpc/                 # tRPC client
│   ├── server/
│   │   ├── routers/              # tRPC routers
│   │   └── services/             # Business logic
│   └── stores/                   # Zustand stores
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml        # Includes Ollama, Piper, PostgreSQL
├── drizzle/                      # Migrations
├── Plan.md                       # This file
├── CLAUDE.md                     # Claude memory file
└── package.json
```

---

## Code Standards

### Documentation

- **Google-style docstrings** for all functions, classes, and modules
- **No inline comments** except for genuinely complex algorithms
- Code should be self-documenting through clear naming

### Example Docstring (TypeScript/JSDoc)

```typescript
/**
 * Calculates the distance between two geographic coordinates using the Haversine formula.
 *
 * Args:
 *     lat1: Latitude of the first point in degrees.
 *     lon1: Longitude of the first point in degrees.
 *     lat2: Latitude of the second point in degrees.
 *     lon2: Longitude of the second point in degrees.
 *
 * Returns:
 *     The distance between the two points in meters.
 *
 * Example:
 *     const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // ... implementation
}
```

### Design Principles

- **SOLID** principles throughout
- **DRY** - Don't Repeat Yourself
- **KISS** - Keep It Simple
- **Composition over Inheritance**
- **Dependency Injection** where appropriate
- **Single Responsibility** - each module does one thing well

### Clean Code Practices

- Meaningful variable and function names
- Small, focused functions (< 20 lines preferred)
- Early returns to reduce nesting
- Type safety everywhere (strict TypeScript)
- Error handling with custom error types
- Consistent file and folder naming (kebab-case)

---

## Phase 1: Foundation (MVP)

**Goal:** Interactive map with auth and basic exploration

### Tasks

1. **Project Setup**
   - Initialize Next.js 15 with TypeScript (strict mode)
   - Configure Tailwind CSS 4 + shadcn/ui
   - Set up ESLint, Prettier
   - Create Docker Compose (PostgreSQL + PostGIS, Ollama, Piper)

2. **Database**
   - Configure Drizzle ORM with PostGIS
   - Create base schema: `users` table
   - Set up migrations

3. **Authentication**
   - Integrate Lucia Auth
   - Sign up / Sign in pages
   - Session management
   - Protected route middleware

4. **Map Integration**
   - Set up MapLibre GL JS with react-map-gl
   - Basic map controls (zoom, pan, locate me)
   - Geolocation hook with permission handling
   - Location search (Nominatim or Photon - free)

5. **User Profile**
   - Basic profile page
   - Preferences storage (JSONB)

### Deliverable
User can sign in, see an interactive map, search locations, and set preferences.

---

## Phase 2: Obelisk Remarks

**Goal:** LLM-powered contextual discovery with automatic proximity storytelling

Remarks is the **core differentiator** of Obelisk. Unlike traditional navigation apps that only show directions, Remarks transforms every walk into a rich discovery experience by automatically surfacing contextual stories and insights about interesting places nearby.

### Two Modes of Operation

1. **Automatic Discovery (Core Feature)**
   - LLM-powered proximity pop-ups when user is near interesting places
   - Contextual storytelling generated on-demand based on POI data
   - Personalized recommendations based on user interests
   - No user action required - stories surface automatically

2. **User-Created Remarks (Secondary Feature)**
   - Human-curated tours for sharing local knowledge
   - Multi-stop guided experiences with audio
   - Community-driven content layer

### Use Cases

**Urban Explorer (Walking in Munich)**
> You're walking from Karlsplatz toward Viktualienmarkt. Without searching or opening any menus, a subtle notification appears: "The Fountain's Secret" - you're passing a historic fountain with a hidden story. Tap to hear a 30-second narration, or keep walking and another story finds you near the market entrance.

**Curious Planner (Remote Exploration)**
> You're planning a trip to Munich from home. Open the map, explore areas of interest, and tap on highlighted zones to hear AI-generated stories about neighborhoods, hidden gems, and local context - all before you arrive.

### Database Schema
```sql
-- POI data source (enriched from OpenStreetMap, Wikipedia, etc.)
CREATE TABLE pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id BIGINT,
  name TEXT NOT NULL,
  location GEOMETRY(POINT, 4326) NOT NULL,
  category TEXT[],
  tags JSONB DEFAULT '{}',
  wikipedia_url TEXT,
  description_raw TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LLM-generated stories for POIs (cached)
CREATE TABLE poi_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id UUID REFERENCES pois(id) ON DELETE CASCADE,
  story_type TEXT NOT NULL, -- 'brief', 'detailed', 'historical', 'fun_fact'
  title TEXT NOT NULL,
  teaser TEXT NOT NULL, -- 3-5 word hook for notification
  content TEXT NOT NULL,
  audio_url TEXT,
  language TEXT DEFAULT 'en',
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interaction tracking for personalization
CREATE TABLE poi_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  poi_id UUID REFERENCES pois(id),
  interaction_type TEXT NOT NULL, -- 'viewed', 'listened', 'dismissed', 'saved'
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-created remarks (existing schema)
CREATE TABLE remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  center_point GEOMETRY(POINT, 4326),
  category TEXT[],
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE remark_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remark_id UUID REFERENCES remarks(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  location GEOMETRY(POINT, 4326) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  ai_generated_audio_url TEXT,
  images TEXT[]
);

CREATE INDEX idx_pois_location ON pois USING GIST(location);
CREATE INDEX idx_poi_stories_poi ON poi_stories(poi_id);
CREATE INDEX idx_remarks_center ON remarks USING GIST(center_point);
CREATE INDEX idx_stops_location ON remark_stops USING GIST(location);
```

### Tasks

1. **POI Data Pipeline**
   - Import POI data from OpenStreetMap via Overpass API
   - Enrich with Wikipedia/Wikidata descriptions
   - Categorize by type (historical, cultural, nature, food, etc.)
   - Periodic sync for updates

2. **LLM Story Generation**
   - Generate contextual stories from POI data
   - Multiple story types: brief teaser, detailed history, fun facts
   - Cache generated content in `poi_stories` table
   - Queue-based generation for efficiency

3. **Proximity Detection System**
   - Background location monitoring (with user permission)
   - Efficient nearby POI queries (PostGIS `ST_DWithin`)
   - Smart notification throttling (don't overwhelm)
   - "Discovery mode" toggle for active exploration

4. **Personalization Engine**
   - Track user interactions with stories
   - Learn preferences (historical vs food vs nature)
   - Adjust story selection based on interests
   - Time-of-day awareness (café in morning, bar at night)

5. **Story Delivery UI**
   - Subtle notification popup (3-5 word teaser)
   - Expandable story card with audio option
   - "Save for later" functionality
   - Dismiss without penalty to algorithm

6. **User-Created Remarks** (Already Implemented)
   - Multi-step creator wizard
   - Map-based stop placement
   - Audio recording/upload for stops
   - Community discovery and ratings

7. **TTS Integration**
   - Convert stories to natural speech on-demand
   - Cache generated audio
   - Multiple voice options

### Deliverable
Users experience automatic contextual discovery as they explore, with LLM-generated stories surfacing naturally based on proximity and interests. User-created remarks complement the system with human-curated local knowledge.

---

## Phase 3: Obelisk Capsules

**Goal:** Location-locked digital time capsules

### Database Schema
```sql
CREATE TABLE capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id),
  location GEOMETRY(POINT, 4326) NOT NULL,
  unlock_radius_meters INTEGER DEFAULT 50,
  title TEXT NOT NULL,
  content_encrypted BYTEA,
  unlock_type TEXT NOT NULL,
  unlock_date TIMESTAMPTZ,
  status TEXT DEFAULT 'sealed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE capsule_recipients (
  capsule_id UUID REFERENCES capsules(id),
  recipient_id UUID REFERENCES users(id),
  opened BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (capsule_id, recipient_id)
);
```

### Tasks

1. **Capsule Creation**
   - Location picker on map
   - Content entry (text, image, audio)
   - **AI enhancement** - LLM can help write heartfelt messages
   - **AI voice option** - convert text to personal voice message
   - Set unlock conditions (date, recipient, both)
   - Client-side encryption before storage

2. **Capsule Discovery**
   - Show nearby capsules user can access
   - Proximity detection for unlock eligibility

3. **Capsule Unlock**
   - Verify location (within radius)
   - Verify date/recipient conditions
   - Decrypt and display content

### Deliverable
Users can create and unlock location-locked time capsules with AI-enhanced content.

---

## Phase 4: Audio-First Experience

**Goal:** Immersive audio throughout the app

### Tasks

1. **Global Audio Player**
   - Persistent bottom player component
   - Background playback (PWA)
   - Queue management (Zustand store)

2. **Guided Tours**
   - Auto-advance audio at stops
   - Proximity triggers
   - Screen-off navigation mode

3. **Dynamic Storytelling**
   - **Real-time AI narration** - generate contextual stories as user explores
   - Stream TTS audio for immediate playback
   - Mood-based voice selection

4. **Audio Upload Pipeline**
   - Compression/transcoding
   - Upload progress
   - Offline caching (service worker)

### Deliverable
Full audio-first experience with AI-powered dynamic storytelling.

---

## Phase 5: Obelisk Moments

**Goal:** Real-time synchronized experiences

### Tasks

1. **WebSocket Server**
   - Hono WebSocket handler
   - Room-based channels (per moment)
   - Presence tracking

2. **Moment Flow**
   - Create moment (optionally from a Remark)
   - Generate invite link/code
   - Join moment

3. **Real-time Sync**
   - Broadcast participant locations
   - Synchronized audio playback
   - Simple in-moment chat

### Deliverable
Friends can share synchronized location experiences in real-time.

---

## Phase 6: Accessibility & Polish

**Goal:** Inclusive experience for all users

### Tasks

1. **Accessibility Modes**
   - Mobility: wheelchair-accessible routes
   - Vision: high contrast, screen reader optimization
   - Hearing: visual alternatives, transcripts for AI audio
   - Social anxiety: crowd indicators

2. **PWA Optimization**
   - Offline map tile caching
   - Install prompts
   - Push notifications (optional)

3. **Performance**
   - Lazy loading
   - Image optimization
   - Bundle analysis

### Deliverable
Accessible, polished PWA ready for users.

---

## Key Files to Create First

| File | Purpose |
|------|---------|
| `docker-compose.yml` | PostgreSQL, PostGIS, Ollama, Piper |
| `src/lib/db/schema.ts` | Drizzle schema with PostGIS types |
| `src/lib/auth/lucia.ts` | Lucia Auth configuration |
| `src/lib/llm/client.ts` | Ollama/vLLM client |
| `src/lib/tts/client.ts` | Piper/Coqui TTS client |
| `src/components/map/map-container.tsx` | Main map component |
| `src/hooks/use-geolocation.ts` | Geolocation with permissions |
| `src/server/routers/remarks.ts` | Core tRPC router |
| `src/stores/audio-store.ts` | Global audio player state |

---

## Verification Plan

After each phase:

1. **Manual Testing**
   - Walk through user flows end-to-end
   - Test on mobile viewport
   - Test with location mocking
   - Verify AI generation quality

2. **Automated Testing**
   - Vitest for unit tests (hooks, utilities)
   - Playwright for E2E flows

3. **Performance Checks**
   - Lighthouse scores (target: 90+ PWA)
   - Map rendering performance
   - API response times
   - LLM/TTS latency

---

## Next Steps After Approval

1. Create CLAUDE.md memory file with coding standards
2. Initialize Next.js project with TypeScript
3. Set up Docker Compose for all services
4. Configure Drizzle ORM and create initial migration
5. Implement Lucia Auth
6. Integrate MapLibre
7. Set up LLM and TTS clients
