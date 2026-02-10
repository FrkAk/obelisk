import { generateText } from "./ollama";
import { detectLocale, buildLanguagePrompt } from "./localization";
import { profileCompleteness } from "./embeddingBuilder";
import type { LocaleInfo } from "./localization";
import type {
  Poi,
  Tag,
  FoodProfile,
  HistoryProfile,
  ArchitectureProfile,
  NatureProfile,
  ArtCultureProfile,
  NightlifeProfile,
  ShoppingProfile,
  ViewpointProfile,
  Cuisine,
  PoiDish,
  Dish,
  ContactInfo,
} from "@/types";

export type ProfileUnion =
  | FoodProfile
  | HistoryProfile
  | ArchitectureProfile
  | NatureProfile
  | ArtCultureProfile
  | NightlifeProfile
  | ShoppingProfile
  | ViewpointProfile
  | null;

export interface StoryPoiContext {
  poi: Poi;
  categorySlug: string;
  categoryName: string;
  profile: ProfileUnion;
  tags: Tag[];
  cuisines?: Cuisine[];
  dishes?: Array<PoiDish & { dish: Dish }>;
  contactInfo?: ContactInfo | null;
}

export interface GeneratedStory {
  title: string;
  teaser: string;
  content: string;
  localTip: string;
  durationSeconds: number;
  confidence: "high" | "medium" | "low";
  modelId: string;
  contextSources: Record<string, unknown>;
}

interface CategoryPersona {
  voice: string;
  perspective: string;
  tipStyle: string;
}

const CATEGORY_PERSONAS: Record<string, CategoryPersona> = {
  food: {
    voice: "You're a passionate foodie friend who lives for discovering amazing eats. You've tried every kitchen in town and know exactly what makes each place special. You speak with enthusiasm about flavors, atmospheres, and those little details only a true food lover notices.",
    perspective: "Focus on the culinary experience - the signature dishes, the vibe, who would love this place. Share it like you're recommending your favorite spot to a hungry friend.",
    tipStyle: "Share a foodie insider tip - best time to visit, what to order, or a secret menu item if mentioned.",
  },
  history: {
    voice: "You're that friend who makes history come alive - not the boring textbook kind, but the fascinating stories behind places. You know the tales that locals whisper about and can connect the past to the present in ways that make people see a place differently.",
    perspective: "Bring out the human stories and historical significance. What happened here? Why does it matter? Make history feel relevant and intriguing, not dusty.",
    tipStyle: "Share a historical insight or the best way to appreciate the historical significance of this place.",
  },
  art: {
    voice: "You're the artsy friend who sees beauty everywhere and knows the local creative scene inside out. You appreciate both classic masterpieces and street art, and you understand what makes a space culturally significant.",
    perspective: "Focus on the artistic and creative aspects - the aesthetic, the cultural value, what makes it visually or artistically special.",
    tipStyle: "Share an art lover's tip - best lighting time, hidden details to notice, or how to truly appreciate what's here.",
  },
  nature: {
    voice: "You're the outdoorsy friend who knows every trail, park, and green space. You find peace in nature and love sharing those special spots where the city fades away and you can breathe.",
    perspective: "Emphasize the natural beauty, the escape from urban life, the sensory experience. What sounds, smells, and sights make this place special?",
    tipStyle: "Share a nature lover's tip - best season to visit, what wildlife to look for, or the most peaceful spot.",
  },
  architecture: {
    voice: "You're the design-savvy friend who notices buildings others walk past. You appreciate the craftsmanship, the history of structures, and can explain why a facade or a doorway is actually remarkable.",
    perspective: "Highlight the architectural details, the style, the craftsmanship. What makes this structure stand out? What story does the building itself tell?",
    tipStyle: "Share an architecture tip - best angle to view it, interesting details to notice, or the best time for photos.",
  },
  views: {
    voice: "You're the friend with the camera who knows every scenic spot and golden hour location. You've watched countless sunsets and know exactly where to go for that perfect view.",
    perspective: "Paint the picture of what can be seen from here. What makes this viewpoint special? What's the experience of standing there?",
    tipStyle: "Share a photographer's tip - best time of day, weather conditions, or the perfect spot to stand.",
  },
  culture: {
    voice: "You're the cultured friend who's always first to know about performances, events, and cultural happenings. You appreciate traditions, celebrations, and the living culture of a place.",
    perspective: "Focus on the cultural significance, traditions, or performances. What cultural experience can someone have here?",
    tipStyle: "Share a culture insider's tip - what events to catch, local customs, or how to fully experience the culture.",
  },
  hidden: {
    voice: "You're the curious explorer friend who finds the places that aren't in any guidebook. You love the thrill of discovery and sharing those 'you won't believe what I found' moments.",
    perspective: "Emphasize the discovery aspect - why is this place special? What makes it a hidden gem worth seeking out?",
    tipStyle: "Share an explorer's tip - how to find it, what to look for, or why it's worth the detour.",
  },
  shopping: {
    voice: "You're the fashion-forward friend who knows every boutique, market, and hidden shop. You love finding unique items and know where to get the best deals.",
    perspective: "Focus on what makes this shop unique - the vibe, the selection, the experience.",
    tipStyle: "Share a shopper's tip - best time to visit for sales, unique items to look for, or nearby shops worth combining.",
  },
  nightlife: {
    voice: "You're the friend who knows every bar, club, and late-night spot. You know which places have the best cocktails, the liveliest crowds, and the hidden speakeasies.",
    perspective: "Focus on the atmosphere, the drinks, the crowd, and what makes this spot stand out after dark.",
    tipStyle: "Share a nightlife insider tip - best nights to go, signature drinks, or how to get past the door.",
  },
};

const DEFAULT_PERSONA: CategoryPersona = {
  voice: "You're a friendly local who knows the neighborhood well. You enjoy sharing interesting spots with visitors and friends.",
  perspective: "Share what makes this place worth visiting in a casual, friendly way.",
  tipStyle: "Share a practical local tip for visiting this place.",
};

function getPersona(categorySlug: string): CategoryPersona {
  return CATEGORY_PERSONAS[categorySlug] ?? DEFAULT_PERSONA;
}

function assessConfidence(ctx: StoryPoiContext): "high" | "medium" | "low" {
  const { ratio } = profileCompleteness(ctx.profile);
  const hasTags = ctx.tags.length > 0;
  const hasCuisines = (ctx.cuisines?.length ?? 0) > 0;
  const hasDishes = (ctx.dishes?.length ?? 0) > 0;
  const hasContact = ctx.contactInfo != null;

  let score = ratio * 5;
  if (hasTags) score += 1;
  if (hasCuisines) score += 1;
  if (hasDishes) score += 1;
  if (hasContact) score += 1;
  if (ctx.poi.wikipediaUrl) score += 1;

  if (score >= 5) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function buildContextSources(ctx: StoryPoiContext): Record<string, unknown> {
  const completeness = profileCompleteness(ctx.profile);
  return {
    profileType: ctx.categorySlug,
    profilePopulated: completeness.populated,
    profileTotal: completeness.total,
    profileRatio: Math.round(completeness.ratio * 100),
    tagCount: ctx.tags.length,
    cuisineCount: ctx.cuisines?.length ?? 0,
    dishCount: ctx.dishes?.length ?? 0,
    hasContactInfo: ctx.contactInfo != null,
    hasWikipedia: !!ctx.poi.wikipediaUrl,
  };
}

function buildHonestyGuidelines(confidence: "high" | "medium" | "low"): string {
  if (confidence === "low") {
    return `HONESTY REQUIREMENT: You have very limited information about this place. Be upfront about it:
- Say something like "I haven't checked this place out myself" or "I don't have much info on this one"
- DO NOT pretend you know things you don't
- DO NOT make up positive claims
- It's okay to say "might be worth checking out" instead of "you'll love it"`;
  }

  if (confidence === "medium") {
    return `HONESTY REQUIREMENT: You have some basic information but not a complete picture:
- Be genuine - share what you know, admit what you don't
- Don't oversell - phrases like "seems interesting" are better than "amazing"`;
  }

  return `HONESTY REQUIREMENT: You have good information to work with, but still:
- Only share what the data supports
- Be enthusiastic if warranted, but don't exaggerate
- Your reputation depends on being trustworthy, not just positive`;
}

function buildFoodContext(ctx: StoryPoiContext): string {
  const fp = ctx.profile as FoodProfile;
  if (!fp) return "No profile data available.";

  const parts: string[] = [];
  if (fp.establishmentType) parts.push(`Type: ${fp.establishmentType}`);
  if (fp.vibe) parts.push(`Vibe: ${fp.vibe}`);
  if (fp.ambiance) parts.push(`Ambiance: ${fp.ambiance}`);
  if (fp.noiseLevel) parts.push(`Noise level: ${fp.noiseLevel}`);
  if (fp.priceLevel) parts.push(`Price level: ${fp.priceLevel}/4`);
  if (fp.hasOutdoorSeating) parts.push("Has outdoor seating");
  if (fp.hasCommunalTables) parts.push("Has communal tables");
  if (fp.hasLiveMusic) parts.push("Has live music");
  if (fp.reservationPolicy) parts.push(`Reservation: ${fp.reservationPolicy}`);
  if (fp.kidFriendly) parts.push("Family-friendly");
  if (fp.michelinStars && fp.michelinStars > 0)
    parts.push(`${fp.michelinStars} Michelin star(s)`);
  if (fp.michelinBib) parts.push("Bib Gourmand");

  if (fp.servesBeer || fp.servesWine || fp.servesCocktails) {
    const drinks: string[] = [];
    if (fp.servesBeer) drinks.push("beer");
    if (fp.servesWine) drinks.push("wine");
    if (fp.servesCocktails) drinks.push("cocktails");
    parts.push(`Serves: ${drinks.join(", ")}`);
  }

  const dietaryFlags: string[] = [];
  if (fp.dietVegetarian === "yes" || fp.dietVegetarian === "only")
    dietaryFlags.push("vegetarian options");
  if (fp.dietVegan === "yes" || fp.dietVegan === "only")
    dietaryFlags.push("vegan options");
  if (fp.dietHalal === "yes") dietaryFlags.push("halal");
  if (dietaryFlags.length > 0) parts.push(`Dietary: ${dietaryFlags.join(", ")}`);

  if (ctx.cuisines && ctx.cuisines.length > 0) {
    parts.push(`Cuisine: ${ctx.cuisines.map((c) => c.name).join(", ")}`);
  }

  if (ctx.dishes && ctx.dishes.length > 0) {
    const signature = ctx.dishes
      .filter((d) => d.isSignature || d.isPopular)
      .map((d) => d.dish?.name ?? d.localName)
      .filter(Boolean)
      .slice(0, 5);
    if (signature.length > 0) parts.push(`Signature dishes: ${signature.join(", ")}`);

    const others = ctx.dishes
      .filter((d) => !d.isSignature && !d.isPopular)
      .map((d) => d.dish?.name ?? d.localName)
      .filter(Boolean)
      .slice(0, 5);
    if (others.length > 0) parts.push(`Menu items: ${others.join(", ")}`);
  }

  return parts.length > 0 ? parts.join("\n") : "Limited food profile data.";
}

function buildHistoryContext(ctx: StoryPoiContext): string {
  const hp = ctx.profile as HistoryProfile;
  if (!hp) return "No profile data available.";

  const parts: string[] = [];
  if (hp.subtype) parts.push(`Type: ${hp.subtype}`);
  if (hp.yearBuilt != null) parts.push(`Year built: ${hp.yearBuilt < 0 ? `${Math.abs(hp.yearBuilt)} BC` : hp.yearBuilt}`);
  if (hp.yearDestroyed != null) parts.push(`Year destroyed: ${hp.yearDestroyed}`);
  if (hp.historicalSignificance) parts.push(`Significance: ${hp.historicalSignificance}`);
  if (hp.keyFigures?.length) parts.push(`Key figures: ${hp.keyFigures.join(", ")}`);
  if (hp.keyEvents?.length) parts.push(`Key events: ${hp.keyEvents.join(", ")}`);
  if (hp.originalPurpose) parts.push(`Original purpose: ${hp.originalPurpose}`);
  if (hp.currentUse) parts.push(`Current use: ${hp.currentUse}`);
  if (hp.heritageLevel) parts.push(`Heritage level: ${hp.heritageLevel}`);
  if (hp.preservationStatus) parts.push(`Preservation: ${hp.preservationStatus}`);
  if (hp.inscription) parts.push(`Inscription: ${hp.inscription}`);

  return parts.length > 0 ? parts.join("\n") : "Limited history profile data.";
}

function buildArchitectureContext(ctx: StoryPoiContext): string {
  const ap = ctx.profile as ArchitectureProfile;
  if (!ap) return "No profile data available.";

  const parts: string[] = [];
  if (ap.subtype) parts.push(`Type: ${ap.subtype}`);
  if (ap.primaryStyle) parts.push(`Style: ${ap.primaryStyle}`);
  if (ap.architect) parts.push(`Architect: ${ap.architect}`);
  if (ap.yearBuilt != null) parts.push(`Built: ${ap.yearBuilt}`);
  if (ap.yearRenovated != null) parts.push(`Renovated: ${ap.yearRenovated}`);
  if (ap.heightMeters) parts.push(`Height: ${ap.heightMeters}m`);
  if (ap.buildingLevels) parts.push(`Levels: ${ap.buildingLevels}`);
  if (ap.constructionMaterials?.length)
    parts.push(`Materials: ${ap.constructionMaterials.join(", ")}`);
  if (ap.interiorHighlights?.length)
    parts.push(`Interior highlights: ${ap.interiorHighlights.join(", ")}`);
  if (ap.denomination) parts.push(`Denomination: ${ap.denomination}`);
  if (ap.isActiveWorship) parts.push("Active place of worship");
  if (ap.towerAccessible) parts.push("Tower is accessible to visitors");
  if (ap.notableFeatures) parts.push(`Notable: ${ap.notableFeatures}`);

  return parts.length > 0 ? parts.join("\n") : "Limited architecture profile data.";
}

function buildNatureContext(ctx: StoryPoiContext): string {
  const np = ctx.profile as NatureProfile;
  if (!np) return "No profile data available.";

  const parts: string[] = [];
  if (np.subtype) parts.push(`Type: ${np.subtype}`);
  if (np.areaHectares) parts.push(`Area: ${np.areaHectares} hectares`);
  if (np.trailLengthKm) parts.push(`Trail length: ${np.trailLengthKm}km`);
  if (np.trailDifficulty) parts.push(`Difficulty: ${np.trailDifficulty}`);
  if (np.elevationGainM) parts.push(`Elevation gain: ${np.elevationGainM}m`);
  if (np.floraHighlights?.length) parts.push(`Flora: ${np.floraHighlights.join(", ")}`);
  if (np.wildlifeHighlights?.length) parts.push(`Wildlife: ${np.wildlifeHighlights.join(", ")}`);
  if (np.facilities?.length) parts.push(`Facilities: ${np.facilities.join(", ")}`);

  const activities: string[] = [];
  if (np.picnicAllowed) activities.push("picnic");
  if (np.swimmingAllowed) activities.push("swimming");
  if (np.cyclingAllowed) activities.push("cycling");
  if (activities.length > 0) parts.push(`Activities: ${activities.join(", ")}`);

  if (np.notableFeatures) parts.push(`Notable: ${np.notableFeatures}`);

  return parts.length > 0 ? parts.join("\n") : "Limited nature profile data.";
}

function buildArtCultureContext(ctx: StoryPoiContext): string {
  const ac = ctx.profile as ArtCultureProfile;
  if (!ac) return "No profile data available.";

  const parts: string[] = [];
  if (ac.subtype) parts.push(`Type: ${ac.subtype}`);
  if (ac.collectionFocus) parts.push(`Collection: ${ac.collectionFocus}`);
  if (ac.genreFocus) parts.push(`Genre: ${ac.genreFocus}`);
  if (ac.notableWorks?.length) parts.push(`Notable works: ${ac.notableWorks.join(", ")}`);
  if (ac.notablePerformers?.length) parts.push(`Notable performers: ${ac.notablePerformers.join(", ")}`);
  if (ac.hasPermanentCollection) parts.push("Has permanent collection");
  if (ac.hasRotatingExhibitions) parts.push("Has rotating exhibitions");
  if (ac.guidedTours) parts.push("Guided tours available");
  if (ac.audioGuide) parts.push("Audio guide available");
  if (ac.avgVisitMinutes) parts.push(`Average visit: ${ac.avgVisitMinutes} minutes`);
  if (ac.foundedYear) parts.push(`Founded: ${ac.foundedYear}`);
  if (ac.vibe) parts.push(`Vibe: ${ac.vibe}`);

  return parts.length > 0 ? parts.join("\n") : "Limited art/culture profile data.";
}

function buildNightlifeContext(ctx: StoryPoiContext): string {
  const nl = ctx.profile as NightlifeProfile;
  if (!nl) return "No profile data available.";

  const parts: string[] = [];
  if (nl.subtype) parts.push(`Type: ${nl.subtype}`);
  if (nl.signatureDrinks?.length) parts.push(`Signature drinks: ${nl.signatureDrinks.join(", ")}`);
  if (nl.dressCode) parts.push(`Dress code: ${nl.dressCode}`);
  if (nl.coverCharge) parts.push(`Cover: ${nl.coverCurrency ?? "EUR"} ${nl.coverCharge}`);
  if (nl.peakHours) parts.push(`Peak hours: ${nl.peakHours}`);
  if (nl.ageDemographic) parts.push(`Crowd: ${nl.ageDemographic}`);
  if (nl.hasDancefloor) parts.push("Has dancefloor");
  if (nl.hasDj) parts.push("Has DJ");
  if (nl.hasLiveMusic) parts.push("Has live music");
  if (nl.outdoorArea) parts.push("Outdoor area");
  if (nl.capacity) parts.push(`Capacity: ${nl.capacity}`);
  if (nl.vibe) parts.push(`Vibe: ${nl.vibe}`);

  return parts.length > 0 ? parts.join("\n") : "Limited nightlife profile data.";
}

function buildShoppingContext(ctx: StoryPoiContext): string {
  const sp = ctx.profile as ShoppingProfile;
  if (!sp) return "No profile data available.";

  const parts: string[] = [];
  if (sp.subtype) parts.push(`Type: ${sp.subtype}`);
  if (sp.productHighlights?.length) parts.push(`Products: ${sp.productHighlights.join(", ")}`);
  if (sp.brands?.length) parts.push(`Brands: ${sp.brands.join(", ")}`);
  if (sp.isSecondhand) parts.push("Secondhand/vintage");
  if (sp.isLocalCrafts) parts.push("Local crafts");
  if (sp.isLuxury) parts.push("Luxury");
  if (sp.marketDays) parts.push(`Market days: ${sp.marketDays}`);
  if (sp.vibe) parts.push(`Vibe: ${sp.vibe}`);

  return parts.length > 0 ? parts.join("\n") : "Limited shopping profile data.";
}

function buildViewpointContext(ctx: StoryPoiContext): string {
  const vp = ctx.profile as ViewpointProfile;
  if (!vp) return "No profile data available.";

  const parts: string[] = [];
  if (vp.subtype) parts.push(`Type: ${vp.subtype}`);
  if (vp.elevationM) parts.push(`Elevation: ${vp.elevationM}m`);
  if (vp.viewDirection) parts.push(`View direction: ${vp.viewDirection}`);
  if (vp.visibleLandmarks?.length) parts.push(`Visible: ${vp.visibleLandmarks.join(", ")}`);
  if (vp.bestTime) parts.push(`Best time: ${vp.bestTime}`);
  if (vp.weatherDependent) parts.push("Weather dependent");
  if (vp.requiresClimb) parts.push("Requires climb");
  if (vp.stepsCount) parts.push(`Steps: ${vp.stepsCount}`);
  if (vp.photographyTips) parts.push(`Photo tips: ${vp.photographyTips}`);
  if (vp.crowdLevel) parts.push(`Crowds: ${vp.crowdLevel}`);

  return parts.length > 0 ? parts.join("\n") : "Limited viewpoint profile data.";
}

const CONTEXT_BUILDERS: Record<string, (ctx: StoryPoiContext) => string> = {
  food: buildFoodContext,
  history: buildHistoryContext,
  architecture: buildArchitectureContext,
  nature: buildNatureContext,
  art: buildArtCultureContext,
  culture: buildArtCultureContext,
  views: buildViewpointContext,
  nightlife: buildNightlifeContext,
  shopping: buildShoppingContext,
};

function buildProfileContextString(ctx: StoryPoiContext): string {
  const builder = CONTEXT_BUILDERS[ctx.categorySlug];
  if (builder) return builder(ctx);
  return "No profile data available.";
}

function buildPrompt(
  ctx: StoryPoiContext,
  confidence: "high" | "medium" | "low",
  locale: LocaleInfo,
): string {
  const persona = getPersona(ctx.categorySlug);
  const profileContext = buildProfileContextString(ctx);
  const honesty = buildHonestyGuidelines(confidence);
  const languagePrompt = buildLanguagePrompt(locale);
  const tagNames = ctx.tags.map((t) => t.name).join(", ");

  return `${persona.voice}

IMPORTANT - YOUR REPUTATION MATTERS: You're known for being honest and trustworthy. Friends come to you because you tell it like it is.

Place: ${ctx.poi.name}
Category: ${ctx.categoryName}
Address: ${ctx.poi.address ?? "the neighborhood"}
Tags: ${tagNames || "none"}

STRUCTURED PROFILE DATA:
${profileContext}

${honesty}

${languagePrompt}

${persona.perspective}

CRITICAL RULES FOR SOUNDING LOCAL:
- NEVER cite review scores, star ratings, or "X reviews" - locals don't talk like that
- NEVER quote website marketing copy or taglines
- DO talk about the vibe, atmosphere, what makes it special to YOU
- Sound like you're texting a friend, not writing a Tripadvisor review

Write:
1. TITLE: Catchy, local-feeling (3-5 words)
2. TEASER: Hook that sounds personal (3-5 words)
3. STORY: 60 words MAX. Talk like you've actually been there. Share the vibe, your honest take.
4. LOCAL_TIP: ${persona.tipStyle}

Format your response EXACTLY like this:
TITLE: [your title]
TEASER: [your teaser]
STORY: [your story]
LOCAL_TIP: [your tip]`;
}

function parseStoryResponse(response: string): {
  title: string;
  teaser: string;
  content: string;
  localTip: string;
  durationSeconds: number;
} {
  const titleMatch = response.match(/TITLE:\s*(.+?)(?=\nTEASER:|$)/is);
  const teaserMatch = response.match(/TEASER:\s*(.+?)(?=\nSTORY:|$)/is);
  const storyMatch = response.match(/STORY:\s*(.+?)(?=\nLOCAL_TIP:|$)/is);
  const tipMatch = response.match(/LOCAL_TIP:\s*(.+?)$/is);

  const content = storyMatch?.[1]?.trim() || response.slice(0, 300);
  const wordCount = content.split(/\s+/).length;
  const durationSeconds = Math.max(30, Math.min(90, Math.round(wordCount * 0.5 + 15)));

  return {
    title: (titleMatch?.[1]?.trim() || "A Hidden Story").slice(0, 100),
    teaser: (teaserMatch?.[1]?.trim() || "Tap to discover").slice(0, 100),
    content,
    localTip: tipMatch?.[1]?.trim() || "Ask locals for more stories!",
    durationSeconds,
  };
}

/**
 * Generates a story for a POI using structured profile data and category-specific persona.
 * Returns the story along with confidence scoring and context source metadata.
 *
 * Args:
 *     ctx: Full POI context with profile, tags, cuisines, dishes, and contact info.
 *     model: Ollama model ID to use (defaults to OLLAMA_MODEL env).
 *
 * Returns:
 *     Generated story with confidence level, model ID, and context sources.
 */
export async function generateStory(
  ctx: StoryPoiContext,
  model?: string,
): Promise<GeneratedStory> {
  const confidence = assessConfidence(ctx);
  const locale = await detectLocale(ctx.poi.address, ctx.poi.latitude, ctx.poi.longitude);
  const usedModel = model ?? (process.env.OLLAMA_MODEL || "gemma3:27b");

  console.log(`[storyGenerator] Generating for "${ctx.poi.name}" | confidence: ${confidence} | locale: ${locale.country}`);

  const prompt = buildPrompt(ctx, confidence, locale);
  const response = await generateText(prompt, usedModel);
  const parsed = parseStoryResponse(response);

  return {
    ...parsed,
    confidence,
    modelId: usedModel,
    contextSources: buildContextSources(ctx),
  };
}

/**
 * Generates stories for multiple POIs sequentially with a delay between each.
 *
 * Args:
 *     contexts: Array of story POI contexts.
 *     model: Ollama model ID.
 *     delayMs: Delay between requests in milliseconds.
 *
 * Returns:
 *     Array of generated stories with POI IDs.
 */
export async function generateStoriesBatch(
  contexts: Array<{ id: string; ctx: StoryPoiContext }>,
  model?: string,
  delayMs: number = 300,
): Promise<Array<{ poiId: string; story: GeneratedStory }>> {
  const results: Array<{ poiId: string; story: GeneratedStory }> = [];

  for (const { id, ctx } of contexts) {
    try {
      const story = await generateStory(ctx, model);
      results.push({ poiId: id, story });
      console.log(`[storyGenerator] Generated: ${ctx.poi.name}`);
    } catch (error) {
      console.error(
        `[storyGenerator] Failed for ${ctx.poi.name}:`,
        error instanceof Error ? error.message : error,
      );
    }

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
