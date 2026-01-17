# Obelisk Implementation Audit Report

**Date:** 2026-01-17
**Tester:** Claude (Browser Automation)
**Environment:** Docker (app, postgres, ollama containers)

---

## Executive Summary

Overall, the Obelisk application is **functional** but has **significant UI/UX issues** that need addressing. The glassmorphic design system is partially implemented - some components follow it well (cards, bottom sheet) while others deviate significantly (map controls, discover button, pins).

| Category | Status | Notes |
| -------- | ------ | ----- |
| Mapbox Integration | PARTIAL | Controls don't follow glass UI |
| Search Functionality | FAIL | Doesn't support viewport-based search |
| Card Components | PASS | Story/POI cards display correctly |
| Button UI Consistency | FAIL | Multiple components inconsistent |
| Map Pins UI | FAIL | Don't follow glassmorphic style |
| Overall UI/UX | PARTIAL | Good animations, but UX issues |

**Revised Grade: C+** - Functional but needs UI/UX refinement

---

## 1. Button UI Consistency Audit

### GlassButton Component Analysis (`src/components/ui/GlassButton.tsx`)

**Defined Sizes:**
| Size | Padding | Font Size | Border Radius |
|------|---------|-----------|---------------|
| sm | px-3 py-1.5 | text-[13px] | rounded-lg |
| md | px-4 py-2.5 | text-[15px] | rounded-xl |
| lg | px-5 py-3 | text-[17px] | rounded-2xl |

**Defined Variants:**
- `primary`: Coral gradient (#FF6B4A to #E5593B), white text, shadow
- `secondary`: Glass background, coral text, glass border
- `ghost`: Transparent background

**Animation:** Hover scale 1.02, tap scale 0.97

### Component-by-Component Audit

#### StoryCard Buttons - MOSTLY CONSISTENT
- **Listen button:** `variant="secondary"`, `size="lg"`, `fullWidth` - Uses GlassButton
- **Navigate button:** `variant="primary"` (default), `size="lg"`, `fullWidth` - Uses GlassButton
- Icon + text alignment correct with `gap-2.5`

#### POICard Buttons - MOSTLY CONSISTENT
- **Navigate button:** `variant="primary"`, `size="md"`, `fullWidth` - Uses GlassButton
- **Website button:** `variant="secondary"`, `size="md"` - Uses GlassButton
- **"Nearby story" button:** Custom implementation - NOT using GlassButton
  - Uses: `p-3 rounded-xl glass-thin hover:bg-black/5`
  - **Recommendation:** Consider using GlassButton for consistency

#### DiscoverButton - INCONSISTENT
- **Location:** `src/components/map/DiscoverButton.tsx`
- **Issue:** Custom implementation instead of GlassButton
- **Current styling:**
  - `px-6 py-4 rounded-full` (not matching any GlassButton size)
  - Same coral gradient as GlassButton primary
  - `text-[15px]` matches md size
- **Loading state:** Uses `glass-thick px-5 py-3.5 rounded-full` - different from button
- **Has:** Pulse animation (unique to this button - acceptable)
- **Recommendation:** Consider refactoring to use GlassButton with custom wrapper

#### SearchBar Clear Button - INCONSISTENT
- **Location:** `src/components/search/SearchBar.tsx`
- **Issue:** Custom implementation
- **Current styling:** `p-1 rounded-full hover:bg-black/5`
- **Note:** This is an icon-only button, may be intentionally different
- **Recommendation:** Could use GlassButton `variant="ghost"` `size="sm"`

#### QuickFilter Pills - DIFFERENT BY DESIGN
- **Location:** `src/components/search/QuickFilter.tsx`
- **Styling:** `px-3.5 py-2 rounded-full text-[14px]`
- **Active state:** Category-specific gradient, white text, shadow
- **Inactive state:** `glass-thin`, category color text
- **Animation:** Same as GlassButton (scale 1.02/0.95)
- **Assessment:** Intentionally different from buttons - this is filter UI, not action buttons

#### BottomSheet - N/A
- Uses drag handle pill, no close button
- Closes via overlay tap or drag gesture

### Button Consistency Summary

| Component | Uses GlassButton | Consistent Sizing | Consistent Styling |
|-----------|-----------------|-------------------|-------------------|
| StoryCard | Yes | Yes (lg) | Yes |
| POICard (main) | Yes | Yes (md) | Yes |
| POICard (nearby) | No | N/A | Partial |
| DiscoverButton | No | No | Partial |
| SearchBar clear | No | N/A | N/A (icon button) |
| QuickFilters | No | N/A | Intentional |

---

## 2. Mapbox Integration

### Test Results

| Test | Status | Notes |
|------|--------|-------|
| Custom style loads | PASS | Map renders with custom style from env |
| Map renders without errors | PASS | No console errors from Mapbox |
| Zoom controls | PASS | +/- buttons functional |
| Pan/drag | PASS | Map draggable |
| POI pins render | PASS | Multiple pin types (colors by category) |
| User location marker | PASS | Blue dot shows current location |
| Compass/North indicator | PASS | Shows "N" at bottom left |

### Pin Colors Observed
- **Coral/Orange:** Architecture/Buildings
- **Purple:** History/Culture
- **Blue:** Various
- **Yellow (warning):** Special markers

---

## 3. Search Functionality

### Test Results

| Test | Status | Notes |
|------|--------|-------|
| SearchBar renders | PASS | Glass styling, placeholder text |
| Search input | PASS | Text entry works |
| Search submission | PASS | Enter triggers search |
| Loading state | PASS | Spinner in search bar, skeleton cards |
| API response | PASS | Returns 200 status |
| Results display | PASS | AI summary + story cards |
| Clear button | PASS | Clears search, resets state |
| Quick filters work | PASS | Category selection triggers search |
| Empty state | PASS | "No results found" message |

### Performance Note
- Search API took ~36 seconds on test query "coffee"
- This is LLM processing time (expected with local Ollama)

### Search Results UI
- AI-generated summary with emoji
- "STORIES (X)" section header
- Compact story cards with title, location, description, duration, distance, category pill

---

## 4. Card Components

### StoryCard - PASS

**Elements tested:**
- Category pill (colored by category)
- Duration display ("1m 7s · 1 min read")
- Title (large, semibold)
- Story content (serif font, good readability)
- Local Tip section (coral accent bar)
- Listen button (secondary variant)
- Navigate button (primary variant)

**Styling:**
- Consistent glassmorphic design
- Good typography hierarchy
- Proper spacing

### POICard - NOT FULLY TESTED
- Requires external POI search results
- Code review shows proper GlassButton usage

### Search Result Cards - PASS
- Compact card layout
- Shows: title, location, description, duration, distance, category
- Clickable to expand to full StoryCard

---

## 5. Overall UI/UX

### Glassmorphic Design System - PASS
- Consistent glass backgrounds across components
- Proper blur effects
- Subtle borders and shadows
- Works in both light context (over map)

### Animations - PASS
- BottomSheet spring animations smooth
- Button hover/tap micro-interactions
- Card entry animations (fade + slide)
- Loading skeleton pulse effect

### BottomSheet - PASS
- Multiple snap points (25%, 50%, 90%)
- Drag-to-dismiss works
- Overlay tap closes sheet
- Handle pill shows draggable state

### Loading States - PASS
- Search spinner in search bar
- Skeleton cards during load
- "Discover Stories" shows progress text

### Empty States - PASS
- "No results found" with icon
- Helpful suggestion text

---

## 6. Issues Found

### Critical Issues

1. **Search doesn't support region of interest**
   - Current: Search uses user's GPS location only
   - Expected: Search should use map viewport center when user drags to different area
   - Impact: User cannot explore/search areas they're not physically in
   - Fix: Track map viewport bounds, use center point for search when map is dragged

2. **Obelisk Remarks don't update based on map viewport**
   - Current: Remarks only load around user's GPS location
   - Expected: Remarks should reload when user pans/zooms to different area
   - Impact: Users exploring different regions don't see relevant stories
   - Fix: Add viewport change listener, fetch remarks for visible area

3. **Map POI areas (OpenStreetMap) not clickable**
   - Current: Only Obelisk remark pins are interactive
   - Expected: Should be able to click underlying map POIs (cafes, museums, etc.) to search/get info
   - Impact: Misses opportunity to integrate with existing map data
   - Fix: Add Mapbox click handler for POI features, trigger search or show info

### Medium Issues

1. **Zoom/Location controls don't follow glass UI**
   - Current: Default Mapbox controls (dark, solid background)
   - Expected: Glassmorphic styling matching rest of UI
   - Fix: Create custom GlassMapControls component

2. **Discover Stories button doesn't follow glass UI**
   - Current: Solid coral button, rounded-full, not glassmorphic
   - Expected: Should use glass styling with coral accent
   - Placement: Floating at bottom center looks disconnected
   - Fix: Use GlassButton secondary with coral gradient text, or integrate into bottom nav

3. **Remark pins don't match map UI style**
   - Current: Solid colored markers with house icon
   - Expected: Glassmorphic pins or more refined marker design
   - Fix: Design custom glass-style map markers

4. **Search bar and category pills visual issues**
   - Search bar: Glass styling is ok but could be more refined
   - Category pills: Inconsistent sizing, colors clash with map
   - Active state: Solid gradient feels heavy over map background
   - Fix: Refine glass effects, use more subtle active states

5. **Search Performance:** 36+ seconds for LLM-powered search
   - Could show better progress feedback (percentage, steps)

### Minor Issues

1. **DiscoverButton not using GlassButton:** Custom implementation creates potential for style drift
2. **POICard "nearby story" button:** Custom implementation instead of GlassButton
3. **SearchBar clear button:** Custom implementation
4. **Missing icon-192.png:** 404 errors in console for PWA icon

---

## 7. Detailed Recommendations

### High Priority (Critical UX)

1. **Implement viewport-based search**
   ```
   - Track map bounds on moveend event
   - Update search location to map center (not GPS)
   - Add visual indicator when searching different area
   - Consider "Search this area" button pattern
   ```

2. **Implement viewport-based remarks loading**
   ```
   - Fetch remarks on map moveend/zoomend
   - Debounce requests to avoid spam
   - Cache loaded remarks by region
   - Show loading indicator on map
   ```

3. **Add OpenStreetMap POI interaction**
   ```
   - Handle Mapbox click events on POI layer
   - Show quick info popup for clicked POI
   - Option to search/navigate to POI
   - Integrate with Obelisk search
   ```

### Medium Priority (UI Consistency)

4. **Create GlassMapControls component**
   ```
   - Custom zoom +/- buttons with glass styling
   - Custom location button with glass styling
   - Match GlassButton sizing and animation
   ```

5. **Redesign DiscoverButton**
   ```
   - Use GlassButton as base
   - Or create dedicated glass FAB component
   - Better visual placement (bottom nav?)
   ```

6. **Redesign map markers**
   ```
   - Glass-style pins with category colors
   - Subtle shadow/glow effects
   - Consistent with overall aesthetic
   ```

### Lower Priority

7. Refactor remaining custom buttons to use GlassButton
8. Add PWA icons
9. Improve search progress feedback

---

## 8. Test Screenshots Summary

1. **Initial state:** Map with POI pins, search bar, quick filters, Discover button
2. **Story notification:** "A column holds secrets..." popup
3. **StoryCard expanded:** Full story with Listen/Navigate buttons
4. **Search results:** AI summary + story cards with skeleton loading
5. **Quick filter active:** History pill selected (coral gradient)
6. **Empty state:** "No results found" message
7. **Remark pin click:** Opens story in bottom sheet (working)

---

## 9. Conclusion

The Obelisk application has a solid foundation but requires significant work on:

1. **UX Flow:** Search and remarks must support viewport-based exploration, not just GPS location
2. **UI Consistency:** Map controls, Discover button, pins, and category pills need to follow glassmorphic design
3. **Map Integration:** OpenStreetMap POIs should be interactive

**What works well:**
- StoryCard and POICard components
- BottomSheet with snap points
- Animations and transitions
- LLM-powered search (when it completes)

**What needs improvement:**
- Viewport-based search/remarks (Critical)
- Glassmorphic styling on map elements (Medium)
- Button component consistency (Medium)
- OSM POI interactivity (Medium)

**Revised Grade: C+**

The application needs UX refinement before production release. Core features function but the exploration experience is limited by GPS-only search.
