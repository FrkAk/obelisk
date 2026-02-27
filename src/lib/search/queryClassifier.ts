import { embedTexts } from "@/lib/ai/embeddings";
import { createLogger } from "@/lib/logger";
import type { CategorySlug } from "@/types";
import type { SearchFilters } from "./types";

const log = createLogger("queryClassifier");

type LabelField = "category" | "cuisine" | "filter";

interface Label {
  text: string;
  field: LabelField;
  value: string;
}

interface ClassificationResult {
  category?: CategorySlug;
  cuisineTypes?: string[];
  filters: SearchFilters;
}

const CATEGORY_THRESHOLD = 0.65;
const CUISINE_THRESHOLD = 0.60;
const FILTER_THRESHOLD = 0.60;

const LABELS: Label[] = [
  // Categories
  { text: "historical site monument heritage landmark", field: "category", value: "history" },
  { text: "restaurant cafe food dining eating", field: "category", value: "food" },
  { text: "museum gallery art exhibition painting", field: "category", value: "art" },
  { text: "park garden forest lake nature trail", field: "category", value: "nature" },
  { text: "church castle building bridge tower architecture", field: "category", value: "architecture" },
  { text: "hidden gem secret local tip undiscovered", field: "category", value: "hidden" },
  { text: "viewpoint panorama overlook scenic rooftop", field: "category", value: "views" },
  { text: "theater concert opera cultural event festival", field: "category", value: "culture" },
  { text: "shop store mall market shopping boutique", field: "category", value: "shopping" },
  { text: "bar club pub nightlife party disco", field: "category", value: "nightlife" },
  { text: "gym fitness sport swimming pool stadium", field: "category", value: "sports" },
  { text: "hospital pharmacy doctor dentist health clinic", field: "category", value: "health" },
  { text: "train bus metro station taxi transport", field: "category", value: "transport" },
  { text: "university school library education kindergarten", field: "category", value: "education" },
  { text: "bank post office police toilet public service", field: "category", value: "services" },

  // Cuisines
  { text: "indian curry tandoori naan biryani masala", field: "cuisine", value: "indian" },
  { text: "sushi ramen japanese tempura miso udon", field: "cuisine", value: "japanese" },
  { text: "pizza pasta italian risotto gelato espresso", field: "cuisine", value: "italian" },
  { text: "taco burrito mexican nachos guacamole", field: "cuisine", value: "mexican" },
  { text: "dim sum wonton chinese noodles dumpling", field: "cuisine", value: "chinese" },
  { text: "pho banh mi vietnamese spring roll", field: "cuisine", value: "vietnamese" },
  { text: "souvlaki gyros greek feta moussaka", field: "cuisine", value: "greek" },
  { text: "kebab doner shawarma turkish lahmacun", field: "cuisine", value: "turkish" },
  { text: "falafel hummus middle eastern shawarma", field: "cuisine", value: "middle_eastern" },
  { text: "kimchi bibimbap korean bbq bulgogi", field: "cuisine", value: "korean" },
  { text: "croissant baguette french bistro crepe", field: "cuisine", value: "french" },
  { text: "tapas paella spanish sangria churros", field: "cuisine", value: "spanish" },
  { text: "schnitzel bratwurst pretzel german bavarian weisswurst", field: "cuisine", value: "german" },
  { text: "steak burger american bbq grill", field: "cuisine", value: "american" },
  { text: "pad thai curry thai green red", field: "cuisine", value: "thai" },
  { text: "kabuli pulao afghan bolani mantu", field: "cuisine", value: "afghan" },
  { text: "ghormeh sabzi persian iranian kebab", field: "cuisine", value: "persian" },
  { text: "kibbeh tabouleh lebanese mezze fattoush", field: "cuisine", value: "lebanese" },
  { text: "vegan plant based no meat dairy free", field: "cuisine", value: "vegan" },
  { text: "vegetarian no meat meatless veggie", field: "cuisine", value: "vegetarian" },
  { text: "coffee cafe latte cappuccino espresso", field: "cuisine", value: "cafe" },
  { text: "beer biergarten brew pub ale craft", field: "cuisine", value: "beer" },
  { text: "ice cream gelato frozen dessert sundae", field: "cuisine", value: "ice_cream" },
  { text: "bakery bread pastry croissant cake", field: "cuisine", value: "bakery" },

  // Filters
  { text: "wheelchair accessible disability ramp barrier free", field: "filter", value: "wheelchair" },
  { text: "dog friendly pets allowed animal", field: "filter", value: "dogFriendly" },
  { text: "outdoor seating terrace patio garden outside", field: "filter", value: "outdoor" },
  { text: "wifi internet connection wireless", field: "filter", value: "wifi" },
  { text: "free entry no admission fee gratis", field: "filter", value: "freeEntry" },
  { text: "quiet calm peaceful relaxing tranquil", field: "filter", value: "quiet" },
  { text: "parking car park garage lot", field: "filter", value: "parking" },
];

let labelEmbeddingsCache: { embeddings: number[][]; labels: Label[] } | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Lazily initializes label embeddings on first call. Cached forever.
 *
 * Returns:
 *     Resolved when label embeddings are ready.
 */
async function initLabelEmbeddings(): Promise<void> {
  if (labelEmbeddingsCache) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const texts = LABELS.map((l) => l.text);
      log.info(`Embedding ${texts.length} labels...`);
      const start = Date.now();
      const embeddings = await embedTexts(texts);
      log.info(`Labels embedded in ${Date.now() - start}ms`);
      labelEmbeddingsCache = { embeddings, labels: LABELS };
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Computes cosine similarity between two vectors.
 *
 * Args:
 *     a: First vector.
 *     b: Second vector.
 *
 * Returns:
 *     Cosine similarity score between -1 and 1.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Classifies a search query by embedding it and comparing against pre-embedded labels.
 *
 * Args:
 *     query: The user's search query string.
 *
 * Returns:
 *     Classification result with optional category, cuisine types, and filters.
 */
export async function classifyQuery(query: string): Promise<ClassificationResult> {
  await initLabelEmbeddings();

  const [queryEmbedding] = await embedTexts([query]);
  const { embeddings, labels } = labelEmbeddingsCache!;

  let bestCategory: { value: string; score: number } | null = null;
  let bestCuisine: { value: string; score: number } | null = null;
  const filters: SearchFilters = {};

  for (let i = 0; i < labels.length; i++) {
    const score = cosineSimilarity(queryEmbedding, embeddings[i]);
    const label = labels[i];

    switch (label.field) {
      case "category":
        if (score >= CATEGORY_THRESHOLD && (!bestCategory || score > bestCategory.score)) {
          bestCategory = { value: label.value, score };
        }
        break;
      case "cuisine":
        if (score >= CUISINE_THRESHOLD && (!bestCuisine || score > bestCuisine.score)) {
          bestCuisine = { value: label.value, score };
        }
        break;
      case "filter":
        if (score >= FILTER_THRESHOLD) {
          (filters as Record<string, boolean>)[label.value] = true;
        }
        break;
    }
  }

  if (bestCategory && bestCategory.value !== "food") {
    bestCuisine = null;
  }

  if (bestCategory) {
    log.info(`Category: ${bestCategory.value} (${bestCategory.score.toFixed(3)})`);
  }
  if (bestCuisine) {
    log.info(`Cuisine: ${bestCuisine.value} (${bestCuisine.score.toFixed(3)})`);
  }
  const activeFilters = Object.keys(filters);
  if (activeFilters.length > 0) {
    log.info(`Filters: ${activeFilters.join(", ")}`);
  }

  return {
    category: bestCategory?.value as CategorySlug | undefined,
    cuisineTypes: bestCuisine ? [bestCuisine.value] : undefined,
    filters,
  };
}
