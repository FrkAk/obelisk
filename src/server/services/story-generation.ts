import { eq, and } from "drizzle-orm";
import { db, pois, poiStories, type Poi, type PoiStory } from "@/lib/db";
import { getOllamaClient, OllamaError } from "@/lib/llm/client";
import {
  buildStoryPrompt,
  parseStoryResponse,
  createFallbackStory,
} from "@/lib/llm/prompts";

type StoryType = "discovery" | "historical" | "cultural" | "foodie" | "hidden";

interface GenerateStoryResult {
  story: PoiStory;
  wasGenerated: boolean;
}

/**
 * Retrieves an existing story or generates a new one for a POI.
 *
 * Args:
 *     poiId: The POI's unique identifier.
 *     storyType: The type of story to generate.
 *
 * Returns:
 *     The story and whether it was newly generated.
 *
 * Raises:
 *     Error: When the POI is not found.
 */
export async function getOrGenerateStory(
  poiId: string,
  storyType: StoryType = "discovery"
): Promise<GenerateStoryResult> {
  const existingStory = await db.query.poiStories.findFirst({
    where: and(eq(poiStories.poiId, poiId), eq(poiStories.storyType, storyType)),
  });

  if (existingStory) {
    return { story: existingStory, wasGenerated: false };
  }

  const poi = await db.query.pois.findFirst({
    where: eq(pois.id, poiId),
  });

  if (!poi) {
    throw new Error(`POI not found: ${poiId}`);
  }

  const newStory = await generateStoryForPoi(poi, storyType);
  return { story: newStory, wasGenerated: true };
}

/**
 * Generates a new story for a POI using LLM or fallback.
 *
 * Args:
 *     poi: The POI to generate a story for.
 *     storyType: The type of story to generate.
 *
 * Returns:
 *     The newly created story record.
 */
async function generateStoryForPoi(
  poi: Poi,
  storyType: StoryType
): Promise<PoiStory> {
  const ollama = getOllamaClient();
  let storyData: { title: string; teaser: string; content: string };

  const isHealthy = await ollama.isHealthy();

  if (isHealthy) {
    try {
      const prompt = buildStoryPrompt({ poi, storyType });
      const response = await ollama.generate(prompt);
      const parsed = parseStoryResponse(response);

      if (parsed) {
        storyData = parsed;
      } else {
        console.warn(`Failed to parse LLM response for POI ${poi.id}, using fallback`);
        storyData = createFallbackStory(poi);
      }
    } catch (error) {
      if (error instanceof OllamaError) {
        console.warn(`Ollama error for POI ${poi.id}: ${error.message}, using fallback`);
      } else {
        console.error(`Unexpected error generating story for POI ${poi.id}:`, error);
      }
      storyData = createFallbackStory(poi);
    }
  } else {
    console.warn(`Ollama unavailable for POI ${poi.id}, using fallback`);
    storyData = createFallbackStory(poi);
  }

  const [newStory] = await db
    .insert(poiStories)
    .values({
      poiId: poi.id,
      storyType,
      title: storyData.title,
      teaser: storyData.teaser,
      content: storyData.content,
    })
    .returning();

  return newStory;
}

/**
 * Regenerates a story for a POI, replacing the existing one.
 *
 * Args:
 *     poiId: The POI's unique identifier.
 *     storyType: The type of story to regenerate.
 *
 * Returns:
 *     The newly generated story.
 *
 * Raises:
 *     Error: When the POI is not found.
 */
export async function regenerateStory(
  poiId: string,
  storyType: StoryType = "discovery"
): Promise<PoiStory> {
  const poi = await db.query.pois.findFirst({
    where: eq(pois.id, poiId),
  });

  if (!poi) {
    throw new Error(`POI not found: ${poiId}`);
  }

  await db
    .delete(poiStories)
    .where(and(eq(poiStories.poiId, poiId), eq(poiStories.storyType, storyType)));

  return generateStoryForPoi(poi, storyType);
}
