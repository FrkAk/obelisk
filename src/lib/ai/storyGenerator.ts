import { generateText } from "./ollama";
import { detectLocale, buildLanguagePrompt } from "./localization";
import type { LocaleInfo } from "./localization";
import type { Poi, Tag, PoiProfile, ContactInfo } from "@/types";

export interface StoryPoiContext {
  poi: Poi;
  categorySlug: string;
  categoryName: string;
  profile: PoiProfile | null;
  tags: Tag[];
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
  transport: {
    voice: "You're the friend who knows every bus line, metro connection, and shortcut through the city. You appreciate the engineering behind transit systems and know which stations have stories to tell.",
    perspective: "Focus on the transit experience - the connections, the architecture of the station, its role in the city's mobility. What makes this stop more than just a place to wait?",
    tipStyle: "Share a transit insider tip - best connections, off-peak times, or interesting features of this station.",
  },
  education: {
    voice: "You're the intellectually curious friend who loves campus walks and library visits. You know which institutions shaped the city's academic identity and where knowledge comes alive.",
    perspective: "Focus on the academic and intellectual significance - what's taught or researched here, who walked these halls, what makes this institution special.",
    tipStyle: "Share an education insider tip - public lectures, library access, campus tours, or notable spots to visit.",
  },
  health: {
    voice: "You're the wellness-minded friend who knows every spa, clinic, and healing spot in town. You value places that care for body and mind.",
    perspective: "Focus on the care and wellness aspect - what services are offered, the atmosphere, the history of healing at this location.",
    tipStyle: "Share a practical health tip - booking advice, what to expect, or hidden wellness features.",
  },
  sports: {
    voice: "You're the sports enthusiast who knows every pitch, pool, and arena. You live for match days and morning runs, and you know the stories behind the venues.",
    perspective: "Focus on the sporting experience - the atmosphere, the history of competitions here, what activities are available.",
    tipStyle: "Share a sports insider tip - best times to visit, equipment rental, or the best spot to watch a match.",
  },
  services: {
    voice: "You're the practical friend who knows how the city works. You've navigated every bureaucracy and know which service points have surprising histories.",
    perspective: "Focus on what makes this service point noteworthy beyond its function - its architecture, history, or role in the community.",
    tipStyle: "Share a practical tip - best times to avoid queues, online alternatives, or an interesting historical detail.",
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

/**
 * Scores POI data richness to determine story generation confidence level.
 * Based on JSONB profile completeness: keywords, products, summary, and tags.
 *
 * Args:
 *     ctx: Full POI context with JSONB profile and metadata.
 *
 * Returns:
 *     Confidence level: "high" (score >= 5), "medium" (>= 2), or "low".
 */
function assessConfidence(ctx: StoryPoiContext): "high" | "medium" | "low" {
  let score = 0;
  const profile = ctx.profile;

  if (profile) {
    if ((profile.keywords?.length ?? 0) >= 3) score += 2;
    else if ((profile.keywords?.length ?? 0) > 0) score += 1;

    if ((profile.products?.length ?? 0) >= 3) score += 2;
    else if ((profile.products?.length ?? 0) > 0) score += 1;

    if (profile.summary) score += 2;
    if (Object.keys(profile.attributes ?? {}).length > 0) score += 1;
  }

  if (ctx.tags.length > 0) score += 1;
  if (ctx.contactInfo != null) score += 1;
  if (ctx.poi.wikipediaUrl) score += 1;

  if (score >= 5) return "high";
  if (score >= 2) return "medium";
  return "low";
}

/**
 * Builds a metadata object summarizing the data sources used for story generation.
 *
 * Args:
 *     ctx: Full POI context with JSONB profile and metadata.
 *
 * Returns:
 *     Metadata record with profile stats, tag counts, and flags.
 */
function buildContextSources(ctx: StoryPoiContext): Record<string, unknown> {
  const profile = ctx.profile;
  return {
    categorySlug: ctx.categorySlug,
    keywordCount: profile?.keywords?.length ?? 0,
    productCount: profile?.products?.length ?? 0,
    hasSummary: !!profile?.summary,
    enrichmentSource: profile?.enrichmentSource ?? "none",
    attributeCount: Object.keys(profile?.attributes ?? {}).length,
    tagCount: ctx.tags.length,
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

/**
 * Builds a human-readable context string from a JSONB PoiProfile for the LLM prompt.
 * Formats keywords, products, summary, subtype, and attributes into a newline-separated string.
 *
 * Args:
 *     profile: JSONB profile data from the pois table.
 *
 * Returns:
 *     Newline-separated profile summary string for the LLM prompt.
 */
function buildProfileContext(profile: PoiProfile | null): string {
  if (!profile) return "No profile data available.";

  const parts: string[] = [];

  if (profile.subtype) parts.push(`Type: ${profile.subtype}`);
  if (profile.summary) parts.push(`Description: ${profile.summary}`);
  if (profile.keywords && profile.keywords.length > 0) parts.push(`Keywords: ${profile.keywords.join(", ")}`);
  if (profile.products && profile.products.length > 0) parts.push(`Products/Services: ${profile.products.join(", ")}`);

  for (const [key, value] of Object.entries(profile.attributes ?? {})) {
    if (value != null && value !== "") {
      if (Array.isArray(value)) {
        if (value.length > 0) parts.push(`${key}: ${value.join(", ")}`);
      } else {
        parts.push(`${key}: ${String(value)}`);
      }
    }
  }

  return parts.length > 0 ? parts.join("\n") : "Limited profile data available.";
}

/**
 * Builds the full LLM prompt for story generation using persona, profile, and locale.
 *
 * @param ctx - Full POI context with profile, tags, and contact info.
 * @param confidence - Data richness confidence level.
 * @param locale - Detected locale for language and cultural flavor.
 * @returns Assembled prompt string for the LLM.
 */
function buildPrompt(
  ctx: StoryPoiContext,
  confidence: "high" | "medium" | "low",
  locale: LocaleInfo,
): string {
  const persona = getPersona(ctx.categorySlug);
  const profileContext = buildProfileContext(ctx.profile);
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

GROUNDING: Only mention specific dishes, products, or services that appear in the STRUCTURED PROFILE DATA above. Do not invent menu items, nearby businesses, or events.

Write:
1. TITLE: Catchy, local-feeling (3-5 words)
2. TEASER: Hook that sounds personal (3-5 words).
   BANNED teasers: "You need to...", "Trust me...", "This place is...", "Seriously..."
   Good examples: "Munich's best-kept secret", "Where locals actually go", "Skip the tourist traps"
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
  const usedModel = model ?? (process.env.OLLAMA_MODEL || "gemma3:4b-it-qat");

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
