import { generateText } from "@/lib/ai/ollama";
import type { ParsedIntent, SearchQueryType, SearchFilters } from "./types";
import type { CategorySlug } from "@/types";

const QUERY_PARSE_PROMPT = `You are a search query parser for a Munich discovery app. Parse the user's query into structured JSON.

Categories: history, food, art, nature, architecture, hidden, views, culture
Types: "simple", "contextual", "complex", "discovery", "route"
Filters: outdoor (bool), budget (number), partySize (number), openNow (bool), wifi (bool), quiet (bool)

Output ONLY a JSON object on a single line.

Examples:
Query: "quiet café with wifi"
{"type":"contextual","category":"food","filters":{"wifi":true,"quiet":true},"keywords":["cafe","coffee"]}

Query: "lunch for 5, outdoor, under €15"
{"type":"complex","category":"food","filters":{"outdoor":true,"budget":15,"partySize":5},"keywords":["lunch","restaurant"]}

Query: "surprise me with history"
{"type":"discovery","category":"history","filters":{},"keywords":["history"]}

Now parse this query:
Query: "{{QUERY}}"`;

const DEFAULT_INTENT: ParsedIntent = {
  type: "simple",
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
 *     Structured intent with type, category, filters, and keywords.
 */
export async function parseQueryIntent(query: string): Promise<ParsedIntent> {
  if (!query.trim()) {
    return DEFAULT_INTENT;
  }

  const simplePatterns = detectSimplePatterns(query);
  if (simplePatterns) {
    return simplePatterns;
  }

  try {
    const prompt = QUERY_PARSE_PROMPT.replace("{{QUERY}}", query);
    const response = await generateText(prompt, undefined, {
      temperature: 0.2,
      num_predict: 150,
    });

    const extracted = extractJsonFromResponse(response);
    if (!extracted) {
      return fallbackParse(query);
    }

    return validateAndNormalize(extracted);
  } catch {
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

function detectSimplePatterns(query: string): ParsedIntent | null {
  const lowerQuery = query.toLowerCase().trim();

  const foodPatterns = /\b(coffee|cafe|café|restaurant|food|eat|eating|lunch|dinner|breakfast|pizza|burger|sushi|bar|pub|beer|drink|tea|bakery|bistro|snack|hot chocolate|espresso|latte|cappuccino|kaffee|bier|essen|mittagessen|frühstück|abendessen|bäckerei|wirtshaus|brauhaus|biergarten|konditorei)\b/g;
  const historyPatterns = /\b(history|historic|museum|monument|memorial|castle|old|ancient|geschichte|historisch|denkmal|schloss|burg)\b/g;
  const artPatterns = /\b(art|gallery|museum|painting|sculpture|exhibition|kunst|galerie|ausstellung|gemälde)\b/g;
  const naturePatterns = /\b(park|garden|nature|tree|green|outdoor|walk|forest|garten|natur|wald|wiese|fluss|isar)\b/g;
  const viewsPatterns = /\b(view|viewpoint|lookout|panorama|scenic|aussicht|aussichtspunkt)\b/g;
  const architecturePatterns = /\b(building|architecture|church|cathedral|tower|palace|gebäude|architektur|kirche|dom|turm|rathaus)\b/g;
  const culturePatterns = /\b(theatre|theater|cinema|concert|music|show|performance|kultur|kino|konzert|aufführung|oper|musik)\b/g;

  const discoveryPatterns = /\b(surprise|random|anything|discover|explore)\b/;
  const routePatterns = /\b(way|route|path|between|along|on my way)\b/;

  let type: SearchQueryType = "simple";
  let category: CategorySlug | undefined;
  const filters: SearchFilters = {};
  const keywords: string[] = [];

  if (discoveryPatterns.test(lowerQuery)) {
    type = "discovery";
  } else if (routePatterns.test(lowerQuery)) {
    type = "route";
  }

  const foodMatches = [...lowerQuery.matchAll(foodPatterns)].map(m => m[0]);
  const historyMatches = [...lowerQuery.matchAll(historyPatterns)].map(m => m[0]);
  const artMatches = [...lowerQuery.matchAll(artPatterns)].map(m => m[0]);
  const natureMatches = [...lowerQuery.matchAll(naturePatterns)].map(m => m[0]);
  const viewsMatches = [...lowerQuery.matchAll(viewsPatterns)].map(m => m[0]);
  const architectureMatches = [...lowerQuery.matchAll(architecturePatterns)].map(m => m[0]);
  const cultureMatches = [...lowerQuery.matchAll(culturePatterns)].map(m => m[0]);

  if (foodMatches.length > 0) {
    category = "food";
    keywords.push(...foodMatches);
    if (foodMatches.some(m => ["coffee", "tea", "café", "cafe", "espresso", "latte", "cappuccino", "hot chocolate"].includes(m))) {
      keywords.push("cafe");
    }
  } else if (historyMatches.length > 0) {
    category = "history";
    keywords.push(...historyMatches, "history", "historic");
  } else if (artMatches.length > 0) {
    category = "art";
    keywords.push(...artMatches, "art", "gallery");
  } else if (natureMatches.length > 0) {
    category = "nature";
    keywords.push(...natureMatches, "park", "nature");
  } else if (viewsMatches.length > 0) {
    category = "views";
    keywords.push(...viewsMatches, "viewpoint", "scenic");
  } else if (architectureMatches.length > 0) {
    category = "architecture";
    keywords.push(...architectureMatches, "architecture", "building");
  } else if (cultureMatches.length > 0) {
    category = "culture";
    keywords.push(...cultureMatches, "culture", "entertainment");
  }

  if (/\b(wifi|wi-fi|internet)\b/.test(lowerQuery)) {
    filters.wifi = true;
    type = "contextual";
  }
  if (/\b(outdoor|outside|terrace|patio|draußen)\b/.test(lowerQuery)) {
    filters.outdoor = true;
    type = "contextual";
  }
  if (/\b(quiet|peaceful|calm|ruhig|leise|gemütlich)\b/.test(lowerQuery)) {
    filters.quiet = true;
    type = "contextual";
  }
  if (/\b(open now|currently open)\b/.test(lowerQuery)) {
    filters.openNow = true;
  }

  const budgetMatch = lowerQuery.match(/under\s*[€$]?\s*(\d+)|[€$]\s*(\d+)\s*max|budget\s*[€$]?\s*(\d+)/);
  if (budgetMatch) {
    const amount = budgetMatch[1] || budgetMatch[2] || budgetMatch[3];
    filters.budget = parseInt(amount, 10);
    type = "complex";
  }

  const partySizeMatch = lowerQuery.match(/for\s*(\d+)\s*(people|persons|guests)?|\b(\d+)\s*(people|persons|guests)/);
  if (partySizeMatch) {
    const size = partySizeMatch[1] || partySizeMatch[3];
    filters.partySize = parseInt(size, 10);
    type = "complex";
  }

  if (!category && keywords.length === 0) {
    return null;
  }

  const uniqueKeywords = [...new Set(keywords)];

  return {
    type,
    category,
    filters,
    keywords: uniqueKeywords.length > 0 ? uniqueKeywords : [lowerQuery],
  };
}

function fallbackParse(query: string): ParsedIntent {
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  return {
    type: "simple",
    filters: {},
    keywords: words.slice(0, 5),
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

  const validCategories: CategorySlug[] = [
    "history",
    "food",
    "art",
    "nature",
    "architecture",
    "hidden",
    "views",
    "culture",
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

  return { type, category, filters, keywords };
}
