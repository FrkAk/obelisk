Obelisk UI/UX Audit Report: Map & Discovery
This report details inconsistencies, bugs, and UX gaps identified during the systematic audit of the Obelisk Map and Discovery experience.

1. High Priority Inconsistencies
📍 London vs. Munich Default Context
Issue: The main map defaults to Munich (excellent for local storytelling), but the Create Remark wizard (StepMapStops.tsx) defaults to London.
UX Impact: Confusing for users who start creating a tour in Munich only to be warped to London when adding stops.
Code Reference: 
StepMapStops.tsx:L29-30
🕳️ Empty POI Drawer
Issue: Clicking a POI on the map opens a 
BottomSheet
, but it only displays the title and category. There is no storytelling content or interaction history.
UX Impact: Fails the "Ambient Discovery" vision where every walk is a rich discovery experience. Users see markers but gain no "human" insight from them.
Code Reference: 
map-container.tsx:L70-76
2. Technical Bugs & Performance
🧊 Hydration Mismatch
Issue: Console errors identify a React hydration mismatch. The 
Map
 component is rendered directly on the client without wait-for-mount protection.
Impact: Can lead to unstable UI, weird layout shifts, or broken event listeners.
Code Reference: 
map-container.tsx:L46
⚪ Blank Map Rendering
Issue: Intermittent "solid light-grey/white" map screens. Markers render, but tiles don't.
Potential Root Cause: Likely a race condition between MapLibre initialization and the isLoaded state, or a failure to load the external Voyager style JSON.
🖼️ Missing PWA Assets
Issue: 404 Not Found for icon-192.png.
Impact: Broken "Add to Home Screen" experience, contradicting the "Polished PWA" goal in the plan.
3. UX Gaps
🔍 Search Pill Contrast
Issue: The Search Pill uses a light glass styling. Against a blank map or bright tiles, the contrast is insufficient.
Recommendation: Increase background opacity or add a stronger shadow/border.
🗺️ Discovery Awareness
Issue: "Discovery Mode" (Ambient Discovery) is a core feature, but its toggle is hidden in the MapControls and users aren't guided on how it works.
Recommendation: Add a brief introductory tooltip or highlight when a user first interacts with the map.
4. User-Reported Critical Failures
🛠️ Search is Broken
Issue: The search functionality fails to return results or navigate correctly.
Investigation: Need to verify Nominatim API usage and state updates in SearchPill.tsx.
📍 Live Location Failure
Issue: The real-time user location marker is not working/updating.
Investigation: Check UserLocationMarker.tsx and the 
useGeolocation
 hook for permission or state synchronization bugs.
🍱 Content Depth (Google Maps Parity)
Issue: Map feels empty. Lacks rich business data (restaurants, reviews, detailed attraction info) maybe we should use openstreetmaps data to give more context, also we should have bussines reviews and ratings like google maps..
Vision Alignment: We need to enrich POIs with more than just basic categories to feel like a "proper map".
🎨 Aesthetic Inconsistency & "Clunky" Menus
Issue: Pop-up menus (bottom sheets/drawers) are too large, hide the map, and don't consistently follow the "Glass UI" theme.
Design Fix: Refine BottomSheet.tsx and related menus to be more "elegant and modern" (e.g., smaller footprints, better transparency, smoother transitions).
Animations are not smooth and not consistent.
🏷️ Vision & Use Case Alignment
Issue: "Obelisk Remarks" (the core differentiator) doesn't currently follow the ambient storytelling journey described in the vision.
Specific Use Cases Failing:
The Urban Explorer: Walking from Karlsplatz to Viktualienmarkt should trigger a subtle notification for "The Fountain's Secret". Currently, the user must look at the map and click a marker manually.
The Curious Planner: Exploring Munich from home should highlight "Discovery Zones" with AI-narrated stories. Current POIs are static and lack "ambient" curiosity.
New Requirement (Skeleton-to-Story): Clicking any place should initially show a card with "glassy shimmering lines" (skeleton state). Stories should only be generated on-demand when the user clicks to "glassy shimmering lines".
New Requirement (Historical Priority): Areas like Altstadt Munich must have significantly richer/better Remark data compared to generic spots.
Fix: Re-align discovery logic to trigger based on the user's "Journey Steps" and implement the "Shimmering Skeleton" UI.
5. Proposed Fixes 
Fix Functional Core: Prioritize fixing Search and Live Location.
Modernize Map UI: Switch to a more premium/custom map style; refine Glass UI components to be less intrusive.
Data Enrichment: Plan a pipeline/logic for richer POI data (comments, business details).
Journey-Based Discovery: Re-implement 
DiscoveryLayer
 to follow the specific walking scripts (e.g., Karlsplatz to Viktualienmarkt).