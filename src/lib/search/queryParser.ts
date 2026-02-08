import { generateText, SEARCH_MODEL } from "@/lib/ai/ollama";
import type { ParsedIntent, SearchQueryType, SearchFilters, SearchMode } from "./types";
import type { CategorySlug } from "@/types";

const QUERY_PARSE_PROMPT = `You are a search query parser for a Munich discovery app. Classify the query and extract structured intent.

Modes:
- "name": Query refers to a specific place by name (e.g., "Marienplatz", "Zara", "Hofbräuhaus")
- "keyword": Query describes a type/category of place (e.g., "pizza", "quiet cafe", "museum")
- "conversational": Query is a natural language request (e.g., "I want a cozy place for coffee", "where can I find good burgers")

Categories: history, food, art, nature, architecture, hidden, views, culture, shopping, nightlife, sports, health, transport, education, services
Filters: outdoor (bool), budget (number), partySize (number), openNow (bool), wifi (bool), quiet (bool)

Output ONLY a JSON object on a single line:
{"mode":"name|keyword|conversational","placeName":"string or null","category":"slug or null","cuisineTypes":["array"],"filters":{},"keywords":["array"],"type":"simple|contextual|complex|discovery|route"}

Examples:
Query: "Marienplatz"
{"mode":"name","placeName":"Marienplatz","category":null,"cuisineTypes":[],"filters":{},"keywords":["marienplatz"],"type":"simple"}

Query: "pizza"
{"mode":"keyword","placeName":null,"category":"food","cuisineTypes":["pizza"],"filters":{},"keywords":["pizza","restaurant"],"type":"simple"}

Query: "I want hamburger but find me a cafe first, I need espresso"
{"mode":"conversational","placeName":null,"category":"food","cuisineTypes":["cafe","coffee"],"filters":{},"keywords":["cafe","coffee","espresso"],"type":"contextual"}

Query: "quiet café with wifi"
{"mode":"keyword","placeName":null,"category":"food","cuisineTypes":["cafe"],"filters":{"wifi":true,"quiet":true},"keywords":["cafe","coffee"],"type":"contextual"}

Query: "Zara"
{"mode":"name","placeName":"Zara","category":null,"cuisineTypes":[],"filters":{},"keywords":["zara"],"type":"simple"}

Query: "lunch for 5, outdoor, under €15"
{"mode":"keyword","placeName":null,"category":"food","cuisineTypes":[],"filters":{"outdoor":true,"budget":15,"partySize":5},"keywords":["lunch","restaurant"],"type":"complex"}

Query: "beer"
{"mode":"keyword","placeName":null,"category":"food","cuisineTypes":[],"filters":{},"keywords":["beer","biergarten","bar"],"type":"simple"}

Query: "swimming pool"
{"mode":"keyword","placeName":null,"category":"sports","cuisineTypes":[],"filters":{},"keywords":["swimming pool","swimming"],"type":"simple"}

Query: "tennis"
{"mode":"keyword","placeName":null,"category":"sports","cuisineTypes":[],"filters":{},"keywords":["tennis"],"type":"simple"}

Now parse this query:
Query: "{{QUERY}}"`;

const DEFAULT_INTENT: ParsedIntent = {
  type: "simple",
  mode: "keyword",
  filters: {},
  keywords: [],
};

/**
 * Parses a natural language search query into structured intent.
 *
 * Args:
 *     query: The user's search query in natural language.
 *
 * Returns:
 *     Structured intent with type, mode, category, filters, and keywords.
 */
export async function parseQueryIntent(query: string): Promise<ParsedIntent> {
  if (!query.trim()) {
    return DEFAULT_INTENT;
  }

  const discoveryMatch = /^\s*(surprise\s+me|discover|explore|random|anything)\b/i;
  if (discoveryMatch.test(query)) {
    console.log(`[queryParser] Discovery fast-path: "${query}"`);
    return {
      type: "discovery",
      mode: "keyword",
      filters: {},
      keywords: [query.toLowerCase().trim()],
    };
  }

  const FAST_PATH_MAP: Record<string, ParsedIntent> = {
    pizza: { type: "simple", mode: "keyword", category: "food", filters: {}, keywords: ["pizza", "restaurant"], cuisineTypes: ["pizza"] },
    beer: { type: "simple", mode: "keyword", category: "food", filters: {}, keywords: ["beer", "biergarten", "bar"] },
    coffee: { type: "simple", mode: "keyword", category: "food", filters: {}, keywords: ["cafe", "coffee"] },
    cafe: { type: "simple", mode: "keyword", category: "food", filters: {}, keywords: ["cafe", "coffee"] },
    café: { type: "simple", mode: "keyword", category: "food", filters: {}, keywords: ["cafe", "coffee"] },
    museum: { type: "simple", mode: "keyword", category: "art", filters: {}, keywords: ["museum"] },
    park: { type: "simple", mode: "keyword", category: "nature", filters: {}, keywords: ["park"] },
    restaurant: { type: "simple", mode: "keyword", category: "food", filters: {}, keywords: ["restaurant"] },
    bar: { type: "simple", mode: "keyword", category: "nightlife", filters: {}, keywords: ["bar", "pub"] },
    pub: { type: "simple", mode: "keyword", category: "nightlife", filters: {}, keywords: ["bar", "pub"] },
    church: { type: "simple", mode: "keyword", category: "architecture", filters: {}, keywords: ["church"] },
    metro: { type: "simple", mode: "keyword", category: "transport", filters: {}, keywords: ["subway"] },
    subway: { type: "simple", mode: "keyword", category: "transport", filters: {}, keywords: ["subway"] },
    cinema: { type: "simple", mode: "keyword", category: "culture", filters: {}, keywords: ["cinema"] },
    movie: { type: "simple", mode: "keyword", category: "culture", filters: {}, keywords: ["cinema"] },
    kino: { type: "simple", mode: "keyword", category: "culture", filters: {}, keywords: ["cinema"] },
    "swimming pool": { type: "simple", mode: "keyword", category: "sports", filters: {}, keywords: ["swimming pool", "swimming"] },
    pool: { type: "simple", mode: "keyword", category: "sports", filters: {}, keywords: ["swimming pool", "swimming"] },
    schwimmbad: { type: "simple", mode: "keyword", category: "sports", filters: {}, keywords: ["swimming pool", "swimming"] },
    tennis: { type: "simple", mode: "keyword", category: "sports", filters: {}, keywords: ["tennis", "sports_centre"] },
    gym: { type: "simple", mode: "keyword", category: "sports", filters: {}, keywords: ["fitness_centre", "gym"] },
    fitness: { type: "simple", mode: "keyword", category: "sports", filters: {}, keywords: ["fitness_centre", "gym"] },
  };

  const normalizedQuery = query.trim().toLowerCase();
  const fastPathResult = FAST_PATH_MAP[normalizedQuery];
  if (fastPathResult) {
    console.log(`[queryParser] Fast-path: "${query}"`);
    return fastPathResult;
  }

  try {
    const prompt = QUERY_PARSE_PROMPT.replace("{{QUERY}}", query);
    const response = await generateText(prompt, SEARCH_MODEL, {
      temperature: 0.1,
      num_predict: 100,
    });
    console.log(`[queryParser] LLM raw response: ${response}`);

    const extracted = extractJsonFromResponse(response);
    if (!extracted) {
      console.log(`[queryParser] Fallback triggered for: "${query}"`);
      return fallbackParse(query);
    }

    const intent = validateAndNormalize(extracted);
    console.log(`[queryParser] Query: "${query}", mode: ${intent.mode}, category: ${intent.category}`);
    return intent;
  } catch {
    console.log(`[queryParser] Fallback triggered for: "${query}"`);
    return fallbackParse(query);
  }
}

/**
 * Extracts a JSON object from a potentially noisy LLM response.
 *
 * Args:
 *     response: Raw text response from the LLM.
 *
 * Returns:
 *     Parsed JSON object, or null if extraction fails.
 */
function extractJsonFromResponse(response: string): Record<string, unknown> | null {
  const trimmed = response.trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  const objectMatch = trimmed.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {}
  }

  return null;
}

function fallbackParse(query: string): ParsedIntent {
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const isNameQuery = words.length <= 2;

  return {
    type: "simple",
    mode: isNameQuery ? "name" : "keyword",
    filters: {},
    keywords: words.slice(0, 5),
    placeName: isNameQuery ? query.trim() : undefined,
  };
}

function validateAndNormalize(parsed: unknown): ParsedIntent {
  if (typeof parsed !== "object" || parsed === null) {
    return DEFAULT_INTENT;
  }

  const obj = parsed as Record<string, unknown>;

  const validTypes: SearchQueryType[] = [
    "simple",
    "contextual",
    "complex",
    "discovery",
    "route",
  ];
  const type: SearchQueryType = validTypes.includes(obj.type as SearchQueryType)
    ? (obj.type as SearchQueryType)
    : "simple";

  const validModes: SearchMode[] = ["name", "keyword", "conversational"];
  const mode: SearchMode = validModes.includes(obj.mode as SearchMode)
    ? (obj.mode as SearchMode)
    : "keyword";

  const validCategories: CategorySlug[] = [
    "history",
    "food",
    "art",
    "nature",
    "architecture",
    "hidden",
    "views",
    "culture",
    "shopping",
    "nightlife",
    "sports",
    "health",
    "transport",
    "education",
    "services",
  ];
  const category: CategorySlug | undefined =
    typeof obj.category === "string" && validCategories.includes(obj.category as CategorySlug)
      ? (obj.category as CategorySlug)
      : undefined;

  const rawFilters = typeof obj.filters === "object" && obj.filters !== null
    ? (obj.filters as Record<string, unknown>)
    : {};

  const filters: SearchFilters = {
    outdoor: typeof rawFilters.outdoor === "boolean" ? rawFilters.outdoor : undefined,
    budget: typeof rawFilters.budget === "number" ? rawFilters.budget : undefined,
    partySize: typeof rawFilters.partySize === "number" ? rawFilters.partySize : undefined,
    openNow: typeof rawFilters.openNow === "boolean" ? rawFilters.openNow : undefined,
    wifi: typeof rawFilters.wifi === "boolean" ? rawFilters.wifi : undefined,
    quiet: typeof rawFilters.quiet === "boolean" ? rawFilters.quiet : undefined,
  };

  const keywords: string[] = Array.isArray(obj.keywords)
    ? obj.keywords.filter((k): k is string => typeof k === "string")
    : [];

  const placeName: string | undefined =
    typeof obj.placeName === "string" ? obj.placeName : undefined;

  const cuisineTypes: string[] = Array.isArray(obj.cuisineTypes)
    ? obj.cuisineTypes.filter((c): c is string => typeof c === "string")
    : [];

  return { type, mode, category, filters, keywords, placeName, cuisineTypes };
}
