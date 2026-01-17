import type { Poi } from "@/lib/db/schema";

type StoryType = "discovery" | "historical" | "cultural" | "foodie" | "hidden";

interface StoryPromptContext {
  poi: Poi;
  storyType: StoryType;
}

const STORY_TYPE_GUIDANCE: Record<StoryType, string> = {
  discovery:
    "Create an intriguing discovery story that makes the reader curious about this place. Focus on what makes it unique or surprising.",
  historical:
    "Focus on the historical significance and past events. Transport the reader back in time.",
  cultural:
    "Highlight the cultural significance, traditions, and community aspects of this place.",
  foodie:
    "Focus on culinary aspects, local flavors, and food traditions associated with this place.",
  hidden:
    "Reveal a lesser-known fact or hidden aspect that most visitors would miss.",
};

/**
 * Generates a prompt for story generation from POI data.
 *
 * Args:
 *     context: The POI and story type context.
 *
 * Returns:
 *     A formatted prompt string for the LLM.
 */
export function buildStoryPrompt(context: StoryPromptContext): string {
  const { poi, storyType } = context;
  const guidance = STORY_TYPE_GUIDANCE[storyType];

  const infoLines: string[] = [];

  if (poi.categories?.length) {
    infoLines.push(`Categories: ${poi.categories.join(", ")}`);
  }

  if (poi.address) {
    infoLines.push(`Address: ${poi.address}`);
  }

  if (poi.cuisine?.length) {
    infoLines.push(`Cuisine: ${poi.cuisine.join(", ")}`);
  }

  if (poi.openingHours) {
    infoLines.push(`Hours: ${poi.openingHours}`);
  }

  if (poi.operator) {
    infoLines.push(`Operated by: ${poi.operator}`);
  }

  if (poi.tags && Object.keys(poi.tags).length > 0) {
    const relevantTags = Object.entries(poi.tags)
      .filter(([k]) => !["name", "addr:street", "addr:housenumber", "addr:postcode", "addr:city"].includes(k))
      .slice(0, 10)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    if (relevantTags) {
      infoLines.push(`Details: ${relevantTags}`);
    }
  }

  if (poi.wikipediaUrl) {
    infoLines.push(`Wikipedia: ${poi.wikipediaUrl}`);
  }

  if (poi.descriptionRaw) {
    infoLines.push(`Background: ${poi.descriptionRaw}`);
  }

  return `You are a storyteller creating brief, engaging narratives about places for a navigation app.

PLACE INFORMATION:
Name: ${poi.name}
Location: ${poi.latitude}, ${poi.longitude}
${infoLines.join("\n")}

TASK:
${guidance}

OUTPUT FORMAT:
Respond with EXACTLY this JSON structure (no markdown, no extra text):
{
  "title": "A catchy 3-5 word title",
  "teaser": "A 3-5 word hook that creates curiosity",
  "content": "A 2-3 sentence engaging story (50-80 words)"
}

GUIDELINES:
- Be concise and engaging
- Use present tense for immediacy
- Create a sense of discovery
- Avoid generic descriptions
- Make it feel personal and local

Generate the story now:`;
}

interface ParsedStory {
  title: string;
  teaser: string;
  content: string;
}

/**
 * Parses the LLM response into a structured story object.
 *
 * Args:
 *     response: The raw LLM response string.
 *
 * Returns:
 *     A parsed story object or null if parsing fails.
 */
export function parseStoryResponse(response: string): ParsedStory | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedStory;

    if (!parsed.title || !parsed.teaser || !parsed.content) {
      return null;
    }

    return {
      title: parsed.title.trim(),
      teaser: parsed.teaser.trim(),
      content: parsed.content.trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Creates a fallback story when LLM is unavailable.
 *
 * Args:
 *     poi: The POI to create a fallback story for.
 *
 * Returns:
 *     A basic story generated from POI data.
 */
export function createFallbackStory(poi: Poi): ParsedStory {
  const category = poi.categories?.[0] || "place";

  return {
    title: poi.name,
    teaser: `Discover this ${category}`,
    content:
      poi.descriptionRaw?.slice(0, 200) ||
      `${poi.name} is a notable ${category} in this area. Explore it to learn more about what makes it special.`,
  };
}
