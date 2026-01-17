import { generateText } from "./ollama";

interface PoiContext {
  name: string;
  categoryName: string;
  address?: string | null;
  wikipediaUrl?: string | null;
  osmTags?: Record<string, string> | null;
}

interface GeneratedStory {
  title: string;
  teaser: string;
  content: string;
  localTip: string;
  durationSeconds: number;
}

const STORY_PROMPT_TEMPLATE = `You are a friendly local guide in Munich, Germany. Write an engaging, conversational story about a place. Be warm and interesting, like a friend sharing a cool fact. Never sound like Wikipedia.

Place: {name}
Category: {category}
Address: {address}
Additional info: {info}

Write a story with:
1. TITLE: A catchy, intriguing title (3-5 words, mysterious or playful)
2. TEASER: A hook that makes people want to learn more (3-5 words)
3. STORY: A 60-word engaging narrative. Include interesting history, local secrets, or fun facts. Be conversational, warm, occasionally witty. No dry facts.
4. LOCAL_TIP: A practical insider tip (1-2 sentences) that a local would know

Format your response EXACTLY like this:
TITLE: [your title]
TEASER: [your teaser]
STORY: [your story]
LOCAL_TIP: [your tip]`;

/**
 * Generates a story for a POI using the LLM.
 *
 * Args:
 *     poi: Context about the POI.
 *
 * Returns:
 *     The generated story with title, teaser, content, and local tip.
 */
export async function generateStory(poi: PoiContext): Promise<GeneratedStory> {
  const additionalInfo = poi.osmTags
    ? Object.entries(poi.osmTags)
        .filter(([key]) => !key.startsWith("addr:") && key !== "name")
        .map(([key, value]) => `${key}: ${value}`)
        .slice(0, 5)
        .join(", ")
    : "No additional info";

  const prompt = STORY_PROMPT_TEMPLATE
    .replace("{name}", poi.name)
    .replace("{category}", poi.categoryName)
    .replace("{address}", poi.address || "Munich, Germany")
    .replace("{info}", additionalInfo);

  const response = await generateText(prompt);
  return parseStoryResponse(response);
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
