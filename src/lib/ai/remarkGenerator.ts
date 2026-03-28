import { generateText } from "./ollama";
import { detectLocale, buildLanguagePrompt } from "./localization";
import type { LocaleInfo } from "./localization";
import type { Poi, Tag, PoiProfile, ContactInfo } from "@/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("remarkGenerator");

export interface RemarkPoiContext {
  poi: Poi;
  categorySlug: string;
  categoryName: string;
  profile: PoiProfile | null;
  tags: Tag[];
  contactInfo?: ContactInfo | null;
}

export interface GeneratedRemark {
  title: string;
  teaser: string;
  content: string;
  localTip: string;
  durationSeconds: number;
  confidence: "high" | "medium" | "low";
  modelId: string;
}

interface CategoryPersona {
  voice: string;
  perspective: string;
  tipStyle: string;
}

const FOOD_CATEGORIES = new Set(["food", "nightlife"]);
const HISTORY_CATEGORIES = new Set(["history", "architecture"]);
const CULTURE_CATEGORIES = new Set(["culture", "education"]);
const NATURE_CATEGORIES = new Set(["nature"]);

/**
 * Extracts verified facts from OSM tags as a structured block for the LLM prompt.
 * Category-aware: extracts different tags based on what's relevant per category.
 *
 * @param osmTags - Raw OSM tags from the POI.
 * @param categorySlug - Category slug for context-aware extraction.
 * @returns Formatted "VERIFIED FACTS" block, or empty string if no useful tags found.
 */
function extractOsmFacts(
  osmTags: Record<string, string> | null,
  categorySlug: string,
): string {
  if (!osmTags || Object.keys(osmTags).length === 0) return "";

  const facts: string[] = [];

  const description = osmTags["description"] || osmTags["description:en"];
  if (description) facts.push(`Description: ${description}`);

  const startDate = osmTags["start_date"] || osmTags["year_of_construction"];
  if (startDate) facts.push(`Built: ${startDate}`);

  const oldName = osmTags["old_name"];
  if (oldName) facts.push(`Former name: ${oldName}`);

  if (osmTags["wikipedia"]) facts.push("Has Wikipedia article (notable topic)");

  if (FOOD_CATEGORIES.has(categorySlug)) {
    const cuisine = osmTags["cuisine"];
    if (cuisine) facts.push(`Cuisine: ${cuisine.replace(/;/g, ", ")}`);
    if (osmTags["outdoor_seating"] === "yes") facts.push("Has outdoor seating");
    if (osmTags["indoor_seating"] === "yes") facts.push("Has indoor seating");
    const dietVeg = osmTags["diet:vegetarian"];
    if (dietVeg === "yes" || dietVeg === "only") facts.push(`Vegetarian: ${dietVeg}`);
    const dietVegan = osmTags["diet:vegan"];
    if (dietVegan === "yes" || dietVegan === "only") facts.push(`Vegan: ${dietVegan}`);
    if (osmTags["takeaway"] === "yes") facts.push("Offers takeaway");
  }

  if (HISTORY_CATEGORIES.has(categorySlug)) {
    const inscription = osmTags["inscription"] || osmTags["inscription:en"];
    if (inscription) facts.push(`Inscription: "${inscription}"`);
    const architect = osmTags["architect"];
    if (architect) facts.push(`Architect: ${architect}`);
    if (osmTags["heritage"]) facts.push(`Heritage designation: ${osmTags["heritage"]}`);
    const memorial = osmTags["memorial"];
    if (memorial) facts.push(`Memorial type: ${memorial}`);
    const material = osmTags["material"];
    if (material) facts.push(`Material: ${material}`);
    const historic = osmTags["historic"];
    if (historic) facts.push(`Historic type: ${historic}`);
  }

  if (CULTURE_CATEGORIES.has(categorySlug)) {
    const religion = osmTags["religion"];
    if (religion) facts.push(`Religion: ${religion}`);
    const denomination = osmTags["denomination"];
    if (denomination) facts.push(`Denomination: ${denomination}`);
    const sport = osmTags["sport"];
    if (sport) facts.push(`Sport: ${sport}`);
  }

  if (NATURE_CATEGORIES.has(categorySlug)) {
    const natural = osmTags["natural"];
    if (natural) facts.push(`Natural type: ${natural}`);
    const elevation = osmTags["ele"];
    if (elevation) facts.push(`Elevation: ${elevation}m`);
  }

  if (facts.length === 0) return "";

  return `VERIFIED FACTS (from official records — these are TRUE):
${facts.map((f) => `- ${f}`).join("\n")}`;
}

/**
 * Builds a two-section data context: verified OSM facts and enrichment profile data.
 * Labels each section so the model knows which data to trust.
 *
 * @param profile - JSONB profile from enrichment pipeline.
 * @param osmTags - Raw OSM tags from the POI.
 * @param categorySlug - Category slug for OSM extraction.
 * @returns Combined data context string for the LLM prompt.
 */
function buildDataContext(
  profile: PoiProfile | null,
  osmTags: Record<string, string> | null,
  categorySlug: string,
): string {
  const sections: string[] = [];

  const osmFacts = extractOsmFacts(osmTags, categorySlug);
  if (osmFacts) sections.push(osmFacts);

  if (profile?.wikipediaSummary) {
    sections.push(`WIKIPEDIA (encyclopedic — factual and reliable):
${profile.wikipediaSummary}`);
  }

  if (profile?.websiteText) {
    sections.push(`WEBSITE CONTENT (from the business itself):
${profile.websiteText}`);
  }

  if (profile?.visualDescription) {
    sections.push(`VISUAL DESCRIPTION (from street-level photos):
${profile.visualDescription}`);
  }

  const profileParts: string[] = [];
  if (profile) {
    if (profile.subtype) profileParts.push(`Type: ${profile.subtype}`);
    if (profile.keywords && profile.keywords.length > 0)
      profileParts.push(`Keywords: ${profile.keywords.join(", ")}`);
    if (profile.products && profile.products.length > 0)
      profileParts.push(`Products/Services: ${profile.products.join(", ")}`);
    if (profile.summary) profileParts.push(`Summary: ${profile.summary}`);

    for (const [key, value] of Object.entries(profile.attributes ?? {})) {
      if (value != null && value !== "") {
        if (Array.isArray(value)) {
          if (value.length > 0) profileParts.push(`${key}: ${value.join(", ")}`);
        } else {
          profileParts.push(`${key}: ${String(value)}`);
        }
      }
    }
  }

  if (profileParts.length > 0) {
    sections.push(`PROFILE DATA:
${profileParts.join("\n")}`);
  }

  return sections.length > 0 ? sections.join("\n\n") : "No data available — write about what's visible and the atmosphere.";
}

const CATEGORY_PERSONAS: Record<string, CategoryPersona> = {
  food: {
    voice: "You eat here, not review here. Lead with what surprised you — the crowd, the ritual, the one dish everyone orders. Connect the food to the neighborhood.",
    perspective: "Who comes here and why? What would someone remember a week later?",
    tipStyle: "One thing to order or one time to visit.",
  },
  history: {
    voice: "You make the past feel close. Lead with the human story — who was here, what happened, why it still matters. Skip the textbook voice.",
    perspective: "What would someone miss if they walked past? What's the story these walls hold?",
    tipStyle: "How to actually experience the history — where to look, when to visit, what to notice.",
  },
  art: {
    voice: "You see what others miss. Lead with what caught your eye — a detail, a contrast, an unexpected feeling. Art is about looking, not lecturing.",
    perspective: "What makes this worth stopping for? What would you point out to a friend?",
    tipStyle: "Where to look, what to notice, best light or time.",
  },
  nature: {
    voice: "You know where the city disappears. Lead with the sensory shift — what changes when you step into this space. Sound, light, air.",
    perspective: "What does this place feel like? Why does someone need this escape?",
    tipStyle: "Best time, best route in, what to watch for.",
  },
  architecture: {
    voice: "You notice buildings others walk past. Lead with the detail that stops you — a doorway, a facade, a strange angle. Buildings tell stories through craft.",
    perspective: "What makes this structure remarkable? What story does the building tell?",
    tipStyle: "Where to stand, what detail to notice, best angle.",
  },
  views: {
    voice: "You know every rooftop and hilltop. Lead with what the view reveals — the skyline, the river, the Alps on a clear day. A view is a story about a city.",
    perspective: "What can someone see from here that they can't see anywhere else?",
    tipStyle: "Best time of day, best weather, where exactly to stand.",
  },
  culture: {
    voice: "You're first to every opening night. Lead with what the experience feels like — the energy, the crowd, the moment the lights dim.",
    perspective: "What cultural experience happens here? Why does it matter beyond entertainment?",
    tipStyle: "When to go, what to expect, how to get the most from it.",
  },
  hidden: {
    voice: "You find what guidebooks miss. Lead with how you discovered this place — the turn you took, the door you noticed. Discovery is the story.",
    perspective: "Why is this worth seeking out? What's the reward for those who find it?",
    tipStyle: "How to find it, what to look for, why it's easy to miss.",
  },
  shopping: {
    voice: "You know every Laden and Markt worth browsing. Lead with what makes this shop different from every other one — the selection, the owner, the vibe.",
    perspective: "What would someone find here that they won't find in a chain? Why browse instead of click?",
    tipStyle: "Best time to browse, what to look for, what most people miss.",
  },
  nightlife: {
    voice: "You know where the night gets interesting. Lead with the atmosphere — what you hear, see, and feel when you walk in.",
    perspective: "What's the crowd like? What makes this spot stand out after dark?",
    tipStyle: "Best night, what to drink, how to get in.",
  },
  transport: {
    voice: "You see stations as more than stops. Lead with what makes this one different — the architecture, the history, the hidden detail most commuters miss.",
    perspective: "What story does this station tell? Why should someone look up from their phone?",
    tipStyle: "What to notice, best time to appreciate it, connections worth knowing.",
  },
  education: {
    voice: "You love campus walks and quiet libraries. Lead with what this institution means to the city — who studied here, what was discovered, why the building matters.",
    perspective: "What's the intellectual or architectural significance? What's publicly accessible?",
    tipStyle: "What's open to visitors, when to go, what to see.",
  },
  health: {
    voice: "You know where care meets craft. Lead with what makes this place more than functional — the building, the history, the approach to wellness.",
    perspective: "What's notable beyond the service? Any architectural or historical significance?",
    tipStyle: "Practical info — how to access, what to expect, best approach.",
  },
  sports: {
    voice: "You know every pitch, pool, and arena. Lead with the atmosphere — match day energy, morning calm, the community around the sport.",
    perspective: "What's the sporting experience here? What's the history and energy?",
    tipStyle: "When to visit, what's accessible, where to watch.",
  },
  services: {
    voice: "You find the stories behind functional places. Lead with what makes this building or location noteworthy — the architecture, the history, the neighborhood role.",
    perspective: "What's interesting about this place beyond its function?",
    tipStyle: "Practical tip — best time, what to know, anything unexpected.",
  },
};

const DEFAULT_PERSONA: CategoryPersona = {
  voice: "You're a friendly local who knows the neighborhood well. Lead with what's interesting — the vibe, the detail, the reason to stop.",
  perspective: "What makes this place worth a moment of someone's time?",
  tipStyle: "One practical thing to know before visiting.",
};

/**
 * Returns the category-specific persona or the default fallback.
 *
 * @param categorySlug - Category slug key.
 * @returns Matching CategoryPersona.
 */
function getPersona(categorySlug: string): CategoryPersona {
  return CATEGORY_PERSONAS[categorySlug] ?? DEFAULT_PERSONA;
}

/**
 * Scores POI data richness to determine remark generation confidence level.
 * Based on JSONB profile completeness, OSM tags, and metadata.
 *
 * @param ctx - Full POI context with JSONB profile and metadata.
 * @returns Confidence level: "high" (score >= 5), "medium" (>= 2), or "low".
 */
export function assessConfidence(ctx: RemarkPoiContext): "high" | "medium" | "low" {
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
  if (ctx.profile?.visualDescription) score += 2;
  if (ctx.profile?.wikipediaSummary) score += 3;
  else if (ctx.poi.wikipediaUrl) score += 1;

  const osmTags = ctx.poi.osmTags;
  if (osmTags) {
    if (osmTags["description"] || osmTags["description:en"]) score += 2;
    if (osmTags["start_date"] || osmTags["year_of_construction"]) score += 1;
    if (osmTags["inscription"] || osmTags["inscription:en"]) score += 2;
  }

  if (score >= 5) return "high";
  if (score >= 2) return "medium";
  return "low";
}

/**
 * Returns a grounding guideline based on the enrichment data tier.
 * Falls back to confidence-based assessment when dataTier isn't set.
 *
 * @param dataTier - Data tier from enrichment pipeline.
 * @param confidence - Legacy confidence level as fallback.
 * @returns Grounding guideline string for the prompt.
 */
function buildGroundingGuideline(dataTier: string | undefined, confidence: "high" | "medium" | "low"): string {
  const tier = dataTier ?? confidence;
  if (tier === "rich" || tier === "high")
    return "GROUNDING: You have detailed data. Be concise and specific — use concrete details from the sources above. Do not invent what the data doesn't provide.";
  if (tier === "moderate" || tier === "medium")
    return "GROUNDING: You have some data. Be concise and specific — describe what the data supports. Skip topics the data doesn't cover — do not fill gaps.";
  return "GROUNDING: You have minimal data. Be concise — describe what's visible and the atmosphere, not what you imagine. Do not invent details.";
}

/**
 * Extracts the city name from a comma-separated address string.
 * Assumes second-to-last part is the city (after stripping leading postal codes).
 *
 * @param address - Comma-separated address string.
 * @returns City name, or null if address is too short or missing.
 */
export function extractCityFromAddress(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(",").map(p => p.trim());
  if (parts.length < 2) return null;
  return parts[parts.length - 2].replace(/^\d+\s*/, "") || null;
}

/**
 * Builds the full LLM prompt for remark generation using persona, data context, and locale.
 *
 * @param ctx - Full POI context with profile, tags, and OSM data.
 * @param confidence - Data richness confidence level.
 * @param locale - Detected locale for language and cultural flavor.
 * @returns Assembled prompt string for the LLM.
 */
function buildPrompt(
  ctx: RemarkPoiContext,
  confidence: "high" | "medium" | "low",
  locale: LocaleInfo,
): string {
  const persona = getPersona(ctx.categorySlug);
  const dataContext = buildDataContext(ctx.profile, ctx.poi.osmTags, ctx.categorySlug);
  const grounding = buildGroundingGuideline(ctx.profile?.dataTier, confidence);
  const languagePrompt = buildLanguagePrompt(locale);
  const tagNames = ctx.tags.map((t) => t.name).join(", ");
  const city = extractCityFromAddress(ctx.poi.address) ?? "the neighborhood";

  return `You are writing a short remark about a place in ${city}. ${persona.voice}

Place: ${ctx.poi.name}
Category: ${ctx.categoryName}
Address: ${ctx.poi.address ?? "the neighborhood"}
Tags: ${tagNames || "none"}

${dataContext}

${grounding}

${languagePrompt}

${persona.perspective}

WRITING CRAFT: Lead with what's surprising. Use contrast. Be specific about atmosphere — what you hear, see, smell.

OUTPUT RULES:
- Fill ONLY the four fields below. Nothing else.
- No introduction, no commentary, no sign-off, no questions to the reader.
- Plain text only — no markdown, no bullet points, no quotation marks around field values.
- Each field must start on its own line with the exact label shown.
- Be concise and vivid. Use concrete details from the data. Stop when you run out of facts.
- Do not invent menu items, dates, architects, or events.

TITLE: Catchy, local-feeling (3-5 words)
TEASER: Original short hook (3-7 words) specific to THIS place
REMARK: Concise, grounded, vivid
LOCAL_TIP: 1-3 sentences max. ${persona.tipStyle}`;
}

const BANNED_TEASERS = [
  "seriously",
  "you need to",
  "trust me",
  "this place is",
  "where locals actually",
  "a proper local",
  "munich's best-kept",
  "off the beaten",
  "worth the detour",
  "not in the guidebooks",
  "a neighborhood favorite",
  "the real deal",
];

const FALLBACK_TEASERS_BY_CATEGORY: Record<string, string[]> = {
  food: ["Taste this", "Fork-ready", "Table for one?", "Menu highlight"],
  history: ["Time-stamped", "Past meets present", "History underfoot", "Echoes remain"],
  shopping: ["Shelf life", "Browse this", "Find of the day", "Curated picks"],
  nightlife: ["After hours", "Night moves", "Late-night pick", "Dark horse"],
  art: ["Eye candy", "Canvas & more", "Gallery worthy", "Creative corner"],
  culture: ["Stage-side", "Scene stealer", "Curtain up", "Culture fix"],
  health: ["Self-care stop", "Wellness check", "Healing hands", "Care spot"],
  sports: ["Game on", "On the pitch", "Athletic pick", "Sweat spot"],
  nature: ["Green escape", "Fresh air fix", "Leaf it to us", "Nature break"],
  architecture: ["Built different", "Stone & story", "Design eye", "Facade first"],
  views: ["Eyes up", "View finder", "Scenic stop", "Panorama pick"],
  hidden: ["Stumble upon this", "Off-radar", "Detour worthy", "Secret spot"],
  education: ["Brain fuel", "Learn here", "Knowledge nook", "Study break"],
  services: ["Local essential", "City staple", "Need this", "Go-to spot"],
  transport: ["Hub life", "Transit gem", "Connection point", "On the move"],
};

const GENERIC_FALLBACKS = ["Tap to discover", "Check this out", "Spot this", "Local pick"];

/**
 * Selects a random fallback teaser from the category-specific pool.
 *
 * @param categorySlug - Category slug for pool selection.
 * @returns Random fallback teaser string.
 */
function getRandomFallbackTeaser(categorySlug: string): string {
  const pool = FALLBACK_TEASERS_BY_CATEGORY[categorySlug] ?? GENERIC_FALLBACKS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Strips markdown formatting from text (bold, italic, headers).
 *
 * @param text - Raw text possibly containing markdown.
 * @returns Plain text with markdown formatting removed.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1");
}

/**
 * Truncates text to a maximum word count at a sentence boundary.
 *
 * @param text - Text to truncate.
 * @param maxWords - Maximum number of words allowed.
 * @returns Truncated text ending at a sentence boundary.
 */
export function truncateAtSentence(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;

  const truncated = words.slice(0, maxWords).join(" ");
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
  );

  if (lastSentenceEnd > truncated.length * 0.4) {
    return truncated.slice(0, lastSentenceEnd + 1);
  }
  return truncated + ".";
}

const BANNED_CONTENT_PHRASES = [
  "you know?",
  "you know,",
  ", you know",
  "not flashy",
  "tucked away",
  "a real find",
  "a real gem",
  "a proper gem",
  "don't hesitate to ask",
  "don't be afraid to ask",
  "trust me,",
  "Trust me,",
];

/**
 * Strips banned filler phrases from LLM-generated content and cleans up whitespace.
 *
 * @param content - Raw content string from LLM output.
 * @returns Sanitized content with banned phrases removed and whitespace normalized.
 */
export function sanitizeContent(content: string): string {
  let result = content;
  for (const phrase of BANNED_CONTENT_PHRASES) {
    result = result.replaceAll(phrase, "");
  }
  return result.replace(/\s{2,}/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
}

/**
 * Sanitizes a teaser string by rejecting banned patterns and replacing with a category fallback.
 *
 * @param teaser - Raw teaser text from LLM output.
 * @param categorySlug - Category slug for fallback pool selection.
 * @returns Sanitized teaser, replaced with a random category fallback if banned.
 */
export function sanitizeTeaser(teaser: string, categorySlug: string): string {
  const lower = teaser.toLowerCase().trim();
  const isBanned = BANNED_TEASERS.some((b) => lower.startsWith(b));
  if (isBanned) {
    return getRandomFallbackTeaser(categorySlug);
  }
  return teaser;
}

/**
 * Parses structured TITLE/TEASER/REMARK/LOCAL_TIP from LLM response text.
 *
 * @param response - Raw LLM response string.
 * @param categorySlug - Category slug for teaser sanitization.
 * @returns Parsed and sanitized remark fields with computed duration.
 */
export function parseRemarkResponse(response: string, categorySlug: string): {
  title: string;
  teaser: string;
  content: string;
  localTip: string;
  durationSeconds: number;
} {
  const titleMatch = response.match(/TITLE:\s*(.+?)(?=\nTEASER:|$)/is);
  const teaserMatch = response.match(/TEASER:\s*(.+?)(?=\nREMARK:|$)/is);
  const remarkMatch = response.match(/REMARK:\s*(.+?)(?=\nLOCAL_TIP:|$)/is);
  const tipMatch = response.match(/LOCAL_TIP:\s*(.+?)$/is);

  const rawContent = stripMarkdown(remarkMatch?.[1]?.trim() || response.slice(0, 300));
  const cleanContent = sanitizeContent(rawContent);
  const content = truncateAtSentence(cleanContent, 100);
  const rawTeaser = stripMarkdown(teaserMatch?.[1]?.trim() || "Tap to discover");
  const teaser = sanitizeTeaser(rawTeaser, categorySlug);
  const rawTitle = stripMarkdown(titleMatch?.[1]?.trim() || "A Hidden Remark");
  const rawTip = stripMarkdown(tipMatch?.[1]?.trim() || "Ask locals for more!");
  const localTip = sanitizeContent(rawTip);

  const wordCount = content.split(/\s+/).length;
  const durationSeconds = Math.max(30, Math.min(90, Math.round(wordCount * 0.5 + 15)));

  return {
    title: rawTitle.slice(0, 100),
    teaser: teaser.slice(0, 100),
    content,
    localTip,
    durationSeconds,
  };
}

/**
 * Generates a remark for a POI using structured profile data, OSM facts, and category persona.
 * Returns null when the POI has insufficient data for reliable remark generation.
 *
 * @param ctx - Full POI context with profile, tags, OSM tags, and contact info.
 * @param model - Ollama model ID to use (defaults to OLLAMA_MODEL env).
 * @returns Generated remark with confidence level and model ID, or null if insufficient data.
 */
export async function generateRemark(
  ctx: RemarkPoiContext,
  model?: string,
): Promise<GeneratedRemark | null> {
  const confidence = assessConfidence(ctx);
  const hasKeywords = (ctx.profile?.keywords?.length ?? 0) > 0;
  const hasProducts = (ctx.profile?.products?.length ?? 0) > 0;

  if (confidence === "low" && !hasKeywords && !hasProducts) {
    log.info(`Skipping "${ctx.poi.name}" — insufficient data for reliable remark`);
    return null;
  }

  const locale = await detectLocale(ctx.poi.address, ctx.poi.latitude, ctx.poi.longitude);
  const usedModel = model ?? (process.env.OLLAMA_MODEL || "qwen3.5:9b");

  log.info(`Generating for "${ctx.poi.name}" | confidence: ${confidence} | locale: ${locale.country}`);

  const prompt = buildPrompt(ctx, confidence, locale);
  const response = await generateText(prompt, usedModel);
  const parsed = parseRemarkResponse(response, ctx.categorySlug);

  return {
    ...parsed,
    confidence,
    modelId: usedModel,
  };
}

/**
 * Generates remarks for multiple POIs sequentially with a delay between each.
 * Skips POIs where generateRemark returns null (insufficient data).
 *
 * @param contexts - Array of remark POI contexts.
 * @param model - Ollama model ID.
 * @param delayMs - Delay between requests in milliseconds.
 * @returns Array of generated remarks with POI IDs (excludes skipped POIs).
 */
export async function generateRemarksBatch(
  contexts: Array<{ id: string; ctx: RemarkPoiContext }>,
  model?: string,
  delayMs: number = 300,
): Promise<Array<{ poiId: string; remark: GeneratedRemark }>> {
  const results: Array<{ poiId: string; remark: GeneratedRemark }> = [];

  for (const { id, ctx } of contexts) {
    try {
      const remark = await generateRemark(ctx, model);
      if (!remark) {
        log.info(`Skipped: ${ctx.poi.name} (insufficient data)`);
        continue;
      }
      results.push({ poiId: id, remark });
      log.info(`Generated: ${ctx.poi.name}`);
    } catch (error) {
      log.error(
        `Failed for ${ctx.poi.name}:`,
        error instanceof Error ? error.message : error,
      );
    }

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
