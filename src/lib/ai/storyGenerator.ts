import { generateText } from "./ollama";
import { detectLocale, buildLanguagePrompt } from "./localization";
import type { LocaleInfo } from "./localization";
import type { WebsiteContent } from "@/lib/web/scraper";
import type { WebSearchContext } from "@/lib/web/webSearch";

interface PoiContext {
  name: string;
  categoryName: string;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  wikipediaUrl?: string | null;
  osmTags?: Record<string, string> | null;
}

interface EnhancedPoiContext extends PoiContext {
  websiteContent?: WebsiteContent | null;
  webSearchContext?: WebSearchContext | null;
}

interface GeneratedStory {
  title: string;
  teaser: string;
  content: string;
  localTip: string;
  durationSeconds: number;
}

interface CategoryPersona {
  voice: string;
  perspective: string;
  tipStyle: string;
}

interface ConfidenceSignals {
  level: "high" | "medium" | "low";
  hasWebsite: boolean;
  hasPhone: boolean;
  hasOpeningHours: boolean;
  hasRichContent: boolean;
  hasWebSearchResults: boolean;
  hasScrapedWebContent: boolean;
  concerns: string[];
}

function assessConfidence(
  osmTags?: Record<string, string> | null,
  websiteContent?: WebsiteContent | null,
  webSearchContext?: WebSearchContext | null
): ConfidenceSignals {
  const concerns: string[] = [];

  const hasWebsite = !!(
    osmTags?.website ||
    osmTags?.["contact:website"] ||
    (websiteContent && !websiteContent.error)
  );
  const hasPhone = !!(osmTags?.phone || osmTags?.["contact:phone"] || osmTags?.["contact:mobile"]);
  const hasOpeningHours = !!osmTags?.opening_hours;
  const hasRichContent = !!(
    websiteContent &&
    !websiteContent.error &&
    websiteContent.mainContent &&
    websiteContent.mainContent.length > 100
  );
  const hasWebSearchResults = !!(webSearchContext && webSearchContext.results.length > 0);
  const hasScrapedWebContent = !!(
    webSearchContext &&
    webSearchContext.scrapedContent &&
    webSearchContext.scrapedContent.length > 0
  );

  if (!hasWebsite) concerns.push("no website found");
  if (!hasPhone) concerns.push("no contact info");
  if (!hasOpeningHours) concerns.push("hours unknown");

  let score = 0;
  if (hasWebsite) score += 2;
  if (hasPhone) score += 1;
  if (hasOpeningHours) score += 1;
  if (hasRichContent) score += 2;
  if (hasWebSearchResults) score += 2;
  if (hasScrapedWebContent) score += 1;

  let level: "high" | "medium" | "low";
  if (score >= 4) level = "high";
  else if (score >= 2) level = "medium";
  else level = "low";

  return { level, hasWebsite, hasPhone, hasOpeningHours, hasRichContent, hasWebSearchResults, hasScrapedWebContent, concerns };
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
    perspective: "Focus on the artistic and creative aspects - the aesthetic, the cultural value, what makes it visually or artistically special. Speak like you're sharing a gallery discovery.",
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
};

const DEFAULT_PERSONA: CategoryPersona = {
  voice: "You're a friendly local who knows the neighborhood well. You enjoy sharing interesting spots with visitors and friends.",
  perspective: "Share what makes this place worth visiting in a casual, friendly way.",
  tipStyle: "Share a practical local tip for visiting this place.",
};

function getPersonaForCategory(categoryName: string): CategoryPersona {
  const normalized = categoryName.toLowerCase();

  if (normalized.includes("food") || normalized.includes("cafe") || normalized.includes("restaurant") || normalized.includes("bar")) {
    return CATEGORY_PERSONAS.food;
  }
  if (normalized.includes("history") || normalized.includes("historic")) {
    return CATEGORY_PERSONAS.history;
  }
  if (normalized.includes("art") || normalized.includes("museum") || normalized.includes("gallery")) {
    return CATEGORY_PERSONAS.art;
  }
  if (normalized.includes("nature") || normalized.includes("park") || normalized.includes("garden")) {
    return CATEGORY_PERSONAS.nature;
  }
  if (normalized.includes("architecture") || normalized.includes("building")) {
    return CATEGORY_PERSONAS.architecture;
  }
  if (normalized.includes("view") || normalized.includes("scenic")) {
    return CATEGORY_PERSONAS.views;
  }
  if (normalized.includes("culture") || normalized.includes("theatre") || normalized.includes("theater")) {
    return CATEGORY_PERSONAS.culture;
  }
  if (normalized.includes("hidden")) {
    return CATEGORY_PERSONAS.hidden;
  }

  return CATEGORY_PERSONAS[normalized] || DEFAULT_PERSONA;
}

function buildHonestyGuidelines(confidence: ConfidenceSignals): string {
  if (confidence.level === "low") {
    return `HONESTY REQUIREMENT: You have very limited information about this place. Be upfront about it:
- Say something like "I haven't checked this place out myself" or "I don't have much info on this one"
- DO NOT pretend you know things you don't
- DO NOT make up positive claims
- It's okay to say "might be worth checking out" instead of "you'll love it"
- If you can't recommend it confidently, say so
- Concerns to mention: ${confidence.concerns.join(", ")}`;
  }

  if (confidence.level === "medium") {
    return `HONESTY REQUIREMENT: You have some basic information but not a complete picture:
- Be genuine - share what you know, admit what you don't
- Don't oversell - phrases like "seems interesting" are better than "amazing"
- If there are gaps in info, acknowledge them naturally
- A good friend doesn't hype up places they haven't properly vetted`;
  }

  return `HONESTY REQUIREMENT: You have good information to work with, but still:
- Only share what the data supports
- Be enthusiastic if warranted, but don't exaggerate
- If something seems off or concerning, mention it
- Your reputation depends on being trustworthy, not just positive`;
}

function buildBasicPrompt(poi: PoiContext, additionalInfo: string, confidence: ConfidenceSignals, locale: LocaleInfo): string {
  const persona = getPersonaForCategory(poi.categoryName);
  const honestyGuidelines = buildHonestyGuidelines(confidence);
  const languagePrompt = buildLanguagePrompt(locale);

  return `${persona.voice}

IMPORTANT - YOUR REPUTATION MATTERS: You're known for being honest and trustworthy. Friends come to you because you tell it like it is - you don't recommend places you haven't vetted, and you're upfront when you don't know something.

Place: {name}
Category: {category}
Address: {address}
Additional info: {info}

${honestyGuidelines}

${languagePrompt}

${persona.perspective}

Write:
1. TITLE: A honest title - intriguing but not misleading (3-5 words)
2. TEASER: A hook that reflects your actual knowledge level (3-5 words)
3. STORY: A 40-word honest take in your voice. If you lack info, say so naturally. Don't fake enthusiasm. A real friend would say "I haven't been here yet, but..." rather than pretending to know.
4. LOCAL_TIP: ${persona.tipStyle} - but only if you actually have useful advice. If not, give a general tip or say to check their website/call ahead.

Format your response EXACTLY like this:
TITLE: [your title]
TEASER: [your teaser]
STORY: [your story]
LOCAL_TIP: [your tip]`
    .replace("{name}", poi.name)
    .replace("{category}", poi.categoryName)
    .replace("{address}", poi.address || "the neighborhood")
    .replace("{info}", additionalInfo);
}

function buildEnhancedPrompt(
  poi: EnhancedPoiContext,
  websiteInfo: string,
  webResearchInfo: string,
  additionalInfo: string,
  confidence: ConfidenceSignals,
  locale: LocaleInfo
): string {
  const persona = getPersonaForCategory(poi.categoryName);
  const honestyGuidelines = buildHonestyGuidelines(confidence);
  const languagePrompt = buildLanguagePrompt(locale);

  return `${persona.voice}

You're a LOCAL who actually lives here. You speak from personal experience and neighborhood knowledge, NOT like a travel website or review aggregator.

Place: {name}
Category: {category}
Address: {address}

BACKGROUND INFO (use to inform your perspective, but DON'T quote directly):
{websiteInfo}
{webResearch}
{info}

${honestyGuidelines}

${languagePrompt}

${persona.perspective}

CRITICAL RULES FOR SOUNDING LOCAL:
- NEVER cite review scores, star ratings, or "X reviews" - locals don't talk like that
- NEVER quote website marketing copy or taglines
- DO talk about the vibe, atmosphere, what makes it special to YOU
- DO mention specific things you'd notice walking in (decor, smell, crowd)
- DO share personal opinions: "I love...", "Not my favorite but...", "My friends swear by..."
- Sound like you're texting a friend, not writing a Tripadvisor review

Write:
1. TITLE: Catchy, local-feeling (3-5 words)
2. TEASER: Hook that sounds personal (3-5 words)
3. STORY: 60 words MAX. Talk like you've actually been there. Share the vibe, your honest take, what you'd tell a friend visiting.
4. LOCAL_TIP: ${persona.tipStyle}

Format your response EXACTLY like this:
TITLE: [your title]
TEASER: [your teaser]
STORY: [your story]
LOCAL_TIP: [your tip]`
    .replace("{name}", poi.name)
    .replace("{category}", poi.categoryName)
    .replace("{address}", poi.address || "the neighborhood")
    .replace("{websiteInfo}", websiteInfo)
    .replace("{webResearch}", webResearchInfo)
    .replace("{info}", additionalInfo);
}

/**
 * Generates a story for a POI using the LLM with category-specific persona.
 * Includes honesty assessment based on available data.
 *
 * Args:
 *     poi: Context about the POI.
 *
 * Returns:
 *     The generated story with title, teaser, content, and local tip.
 */
export async function generateStory(poi: PoiContext): Promise<GeneratedStory> {
  const additionalInfo = buildAdditionalInfo(poi.osmTags);
  const confidence = assessConfidence(poi.osmTags, null);
  const locale = await detectLocale(poi.address, poi.latitude, poi.longitude);

  console.log(`[storyGenerator] Confidence for "${poi.name}": ${confidence.level} (concerns: ${confidence.concerns.join(", ") || "none"})`);
  console.log(`[storyGenerator] Locale: ${locale.country} (${locale.language})`);

  const prompt = buildBasicPrompt(poi, additionalInfo, confidence, locale);

  const response = await generateText(prompt);
  return parseStoryResponse(response);
}

/**
 * Generates an enhanced story for a POI using website content, web search, and category-specific persona.
 * Includes honesty assessment based on available data.
 *
 * Args:
 *     poi: Context about the POI including optional website content and web search context.
 *
 * Returns:
 *     The generated story with title, teaser, content, and local tip.
 */
export async function generateEnhancedStory(poi: EnhancedPoiContext): Promise<GeneratedStory> {
  const additionalInfo = buildAdditionalInfo(poi.osmTags);
  const confidence = assessConfidence(poi.osmTags, poi.websiteContent, poi.webSearchContext);
  const locale = await detectLocale(poi.address, poi.latitude, poi.longitude);

  console.log(`[storyGenerator] Confidence for "${poi.name}": ${confidence.level} (concerns: ${confidence.concerns.join(", ") || "none"})`);
  console.log(`[storyGenerator] Locale: ${locale.country} (${locale.language})`);
  console.log(`[storyGenerator] Web search: ${confidence.hasWebSearchResults ? "yes" : "no"}, Scraped: ${confidence.hasScrapedWebContent ? "yes" : "no"}`);

  const hasWebsiteInfo = poi.websiteContent &&
    !poi.websiteContent.error &&
    (poi.websiteContent.title || poi.websiteContent.description || poi.websiteContent.mainContent);

  const hasWebResearch = poi.webSearchContext && poi.webSearchContext.results.length > 0;

  if (!hasWebsiteInfo && !hasWebResearch) {
    const prompt = buildBasicPrompt(poi, additionalInfo, confidence, locale);
    const response = await generateText(prompt);
    return parseStoryResponse(response);
  }

  const websiteInfo = hasWebsiteInfo
    ? buildWebsiteInfoString(poi.websiteContent!)
    : "No website info available";

  const webResearchInfo = hasWebResearch
    ? buildWebResearchString(poi.webSearchContext!)
    : "No web research available";

  const prompt = buildEnhancedPrompt(poi, websiteInfo, webResearchInfo, additionalInfo, confidence, locale);

  const response = await generateText(prompt);
  return parseStoryResponse(response);
}

function buildAdditionalInfo(osmTags?: Record<string, string> | null): string {
  if (!osmTags) return "No additional info";

  const relevantTags = Object.entries(osmTags)
    .filter(([key]) => !key.startsWith("addr:") && key !== "name" && !key.startsWith("contact:"))
    .map(([key, value]) => `${key}: ${value}`)
    .slice(0, 5);

  return relevantTags.length > 0 ? relevantTags.join(", ") : "No additional info";
}

function buildWebsiteInfoString(content: WebsiteContent): string {
  const parts: string[] = [];

  if (content.title) {
    parts.push(`Title: ${content.title}`);
  }
  if (content.description) {
    parts.push(`Description: ${content.description}`);
  }
  if (content.mainContent) {
    parts.push(`Content: ${content.mainContent}`);
  }

  return parts.length > 0 ? parts.join("\n") : "No website info available";
}

const MAX_SNIPPET_LENGTH = 150;
const MAX_SCRAPED_LENGTH = 200;
const MAX_SEARCH_RESULTS = 3;

function buildWebResearchString(context: WebSearchContext): string {
  const parts: string[] = [];

  if (context.results.length > 0) {
    const snippets = context.results
      .slice(0, MAX_SEARCH_RESULTS)
      .map((r) => {
        const truncatedSnippet = r.snippet.length > MAX_SNIPPET_LENGTH
          ? r.snippet.slice(0, MAX_SNIPPET_LENGTH) + "..."
          : r.snippet;
        return `- ${r.title.slice(0, 50)}: ${truncatedSnippet}`;
      })
      .join("\n");
    parts.push(`Web search results:\n${snippets}`);
  }

  if (context.scrapedContent && context.scrapedContent.length > 0) {
    const scraped = context.scrapedContent
      .slice(0, 2)
      .filter((s) => s.content)
      .map((s) => {
        const title = (s.title || s.url).slice(0, 40);
        const content = s.content!.slice(0, MAX_SCRAPED_LENGTH);
        return `From ${title}: ${content}...`;
      })
      .join("\n");
    parts.push(`\nDetailed content:\n${scraped}`);
  }

  return parts.length > 0 ? parts.join("\n") : "No web research available";
}

function parseStoryResponse(response: string): GeneratedStory {
  const titleMatch = response.match(/TITLE:\s*(.+?)(?=\nTEASER:|$)/is);
  const teaserMatch = response.match(/TEASER:\s*(.+?)(?=\nSTORY:|$)/is);
  const storyMatch = response.match(/STORY:\s*(.+?)(?=\nLOCAL_TIP:|$)/is);
  const tipMatch = response.match(/LOCAL_TIP:\s*(.+?)$/is);

  const content = storyMatch?.[1]?.trim() || response.slice(0, 300);
  const wordCount = content.split(/\s+/).length;
  const durationSeconds = Math.max(30, Math.min(90, Math.round(wordCount * 0.5 + 15)));

  const title = (titleMatch?.[1]?.trim() || "A Hidden Story").slice(0, 100);
  const teaser = (teaserMatch?.[1]?.trim() || "Tap to discover").slice(0, 100);

  return {
    title,
    teaser,
    content,
    localTip: tipMatch?.[1]?.trim() || "Ask locals for more stories!",
    durationSeconds,
  };
}

/**
 * Generates stories for multiple POIs with rate limiting.
 *
 * Args:
 *     pois: Array of POI contexts.
 *     delayMs: Delay between requests in milliseconds.
 *
 * Returns:
 *     Array of generated stories with POI IDs.
 */
export async function generateStoriesBatch(
  poisWithIds: Array<{ id: string; poi: PoiContext }>,
  delayMs: number = 1000
): Promise<Array<{ poiId: string; story: GeneratedStory }>> {
  const results: Array<{ poiId: string; story: GeneratedStory }> = [];

  for (const { id, poi } of poisWithIds) {
    try {
      const story = await generateStory(poi);
      results.push({ poiId: id, story });
      console.log(`Generated story for: ${poi.name}`);
    } catch (error) {
      console.error(`Failed to generate story for ${poi.name}:`, error);
    }

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
