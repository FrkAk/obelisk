import Typesense from "typesense";
import { createLogger } from "@/lib/logger";
import type { SearchLocation } from "@/types/api";

const log = createLogger("typesense");

const TYPESENSE_URL = process.env.TYPESENSE_URL || "http://localhost:8108";
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || "obelisk_typesense_dev";

const url = new URL(TYPESENSE_URL);

const client = new Typesense.Client({
  nodes: [{
    host: url.hostname,
    port: parseInt(url.port || "8108"),
    protocol: url.protocol.replace(":", ""),
  }],
  apiKey: TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 5,
});

const COLLECTION_NAME = "pois";

interface TypesensePoiDocument {
  id: string;
  poiId: string;
  osmId?: number;
  name: string;
  category: string;
  amenityType?: string;
  cuisines?: string[];
  location: [number, number];
  hasStory: boolean;
  hasOutdoorSeating?: boolean;
  hasWifi?: boolean;
  wheelchair?: boolean;
  dogFriendly?: boolean;
  elevator?: boolean;
  parkingAvailable?: boolean;
  freeEntry?: boolean;
  openingHours?: string;
  address?: string;
  profileSummary?: string;
  products?: string[];
  keywords?: string[];
  tags?: string[];
  description?: string;
}

const poiSchema = {
  name: COLLECTION_NAME,
  fields: [
    { name: "poiId", type: "string" as const },
    { name: "osmId", type: "int64" as const, optional: true as const },
    { name: "name", type: "string" as const },
    { name: "category", type: "string" as const, facet: true as const },
    { name: "amenityType", type: "string" as const, facet: true as const, optional: true as const },
    { name: "cuisines", type: "string[]" as const, facet: true as const, optional: true as const },
    { name: "wheelchair", type: "bool" as const, facet: true as const, optional: true as const },
    { name: "dogFriendly", type: "bool" as const, facet: true as const, optional: true as const },
    { name: "elevator", type: "bool" as const, facet: true as const, optional: true as const },
    { name: "parkingAvailable", type: "bool" as const, facet: true as const, optional: true as const },
    { name: "freeEntry", type: "bool" as const, facet: true as const, optional: true as const },
    { name: "openingHours", type: "string" as const, optional: true as const },
    { name: "location", type: "geopoint" as const },
    { name: "hasStory", type: "bool" as const, facet: true as const },
    { name: "hasOutdoorSeating", type: "bool" as const, optional: true as const },
    { name: "hasWifi", type: "bool" as const, optional: true as const },
    { name: "address", type: "string" as const, optional: true as const },
    { name: "profileSummary", type: "string" as const, optional: true as const },
    { name: "products", type: "string[]" as const, optional: true as const },
    { name: "keywords", type: "string[]" as const, optional: true as const },
    { name: "tags", type: "string[]" as const, optional: true as const },
    { name: "description", type: "string" as const, optional: true as const },
  ],
  default_sorting_field: "" as const,
  token_separators: ["-", "/"],
};

interface TypesenseSearchFilters {
  category?: string;
  cuisines?: string[];
  wheelchair?: boolean;
  dogFriendly?: boolean;
  freeEntry?: boolean;
  hasStory?: boolean;
  hasOutdoorSeating?: boolean;
  hasWifi?: boolean;
}

/**
 * Initializes the Typesense POI collection, recreating it if the schema has changed.
 *
 * Args:
 *     force: If true, drop and recreate the collection regardless of schema changes.
 *
 * Returns:
 *     The collection info object from Typesense.
 */
export async function initCollection(force = false): Promise<unknown> {
  try {
    const existing = await client.collections(COLLECTION_NAME).retrieve();
    const existingFieldNames = new Set(
      (existing.fields ?? []).map((f: { name: string }) => f.name)
    );
    const schemaFieldNames = new Set(poiSchema.fields.map((f) => f.name));

    const hasSchemaChange =
      schemaFieldNames.size !== existingFieldNames.size ||
      [...schemaFieldNames].some((name) => !existingFieldNames.has(name));

    if (hasSchemaChange || force) {
      log.warn(force ? "Force recreating collection" : "Schema changed, recreating collection");
      await client.collections(COLLECTION_NAME).delete();
      return client.collections().create(poiSchema);
    }

    log.info("Collection already exists with matching schema");
    return existing;
  } catch {
    log.info("Creating new collection");
    return client.collections().create(poiSchema);
  }
}

/**
 * Searches POIs using full-text search with optional geo and facet filters.
 *
 * Args:
 *     query: The search query string.
 *     location: Optional user location for geo filtering.
 *     radiusKm: Search radius in kilometers.
 *     filters: Optional facet filters for category, cuisine, etc.
 *     limit: Maximum number of results to return.
 *
 * Returns:
 *     Array of matching Typesense POI documents with search metadata.
 */
export async function searchPOIs(
  query: string,
  location?: SearchLocation,
  radiusKm: number = 10,
  filters?: TypesenseSearchFilters,
  limit: number = 20
): Promise<Array<TypesensePoiDocument & { textScore: number }>> {
  const filterParts: string[] = [];

  if (location) {
    filterParts.push(
      `location:(${location.latitude},${location.longitude},${radiusKm} km)`
    );
  }

  if (filters?.category) {
    filterParts.push(`category:=${filters.category}`);
  }
  if (filters?.cuisines && filters.cuisines.length > 0) {
    filterParts.push(`cuisines:=[${filters.cuisines.join(",")}]`);
  }
  if (filters?.wheelchair) {
    filterParts.push(`wheelchair:=true`);
  }
  if (filters?.dogFriendly) {
    filterParts.push(`dogFriendly:=true`);
  }
  if (filters?.freeEntry) {
    filterParts.push(`freeEntry:=true`);
  }
  if (filters?.hasStory !== undefined) {
    filterParts.push(`hasStory:=${filters.hasStory}`);
  }
  if (filters?.hasOutdoorSeating) {
    filterParts.push(`hasOutdoorSeating:=true`);
  }
  if (filters?.hasWifi) {
    filterParts.push(`hasWifi:=true`);
  }

  const searchParameters = {
    q: query,
    query_by: "name,profileSummary,products,tags,cuisines,amenityType,keywords,openingHours",
    query_by_weights: "5,4,3,2,2,1,1,1",
    filter_by: filterParts.length > 0 ? filterParts.join(" && ") : undefined,
    sort_by: location
      ? `location(${location.latitude},${location.longitude}):asc`
      : undefined,
    per_page: limit,
    num_typos: 2,
    typo_tokens_threshold: 1,
  };

  const response = await client
    .collections<TypesensePoiDocument>(COLLECTION_NAME)
    .documents()
    .search(searchParameters);

  return (response.hits ?? []).map((hit) => ({
    ...hit.document!,
    textScore: Number(hit.text_match_info?.score ?? 0),
  }));
}

/**
 * Fast prefix search for autocomplete suggestions.
 *
 * Args:
 *     prefix: The prefix text to search for.
 *     location: Optional user location for geo-biased results.
 *
 * Returns:
 *     Array of matching POI name suggestions.
 */
export async function searchAutocomplete(
  prefix: string,
  location?: SearchLocation
): Promise<Array<{ id: string; name: string; category: string; latitude: number; longitude: number }>> {
  const filterParts: string[] = [];

  if (location) {
    filterParts.push(
      `location:(${location.latitude},${location.longitude},10 km)`
    );
  }

  const searchParameters = {
    q: prefix,
    query_by: "name",
    prefix: "true" as const,
    per_page: 5,
    filter_by: filterParts.length > 0 ? filterParts.join(" && ") : undefined,
    sort_by: location
      ? `location(${location.latitude},${location.longitude}):asc`
      : undefined,
  };

  const response = await client
    .collections<TypesensePoiDocument>(COLLECTION_NAME)
    .documents()
    .search(searchParameters);

  return (response.hits ?? []).map((hit) => ({
    id: hit.document!.poiId,
    name: hit.document!.name,
    category: hit.document!.category,
    latitude: hit.document!.location[0],
    longitude: hit.document!.location[1],
  }));
}

/**
 * Bulk upserts documents into the Typesense POI collection.
 *
 * Args:
 *     documents: Array of POI documents to upsert.
 *
 * Returns:
 *     Array of import results from Typesense.
 */
export async function upsertDocuments(
  documents: TypesensePoiDocument[]
): Promise<unknown[]> {
  if (documents.length === 0) return [];

  return client
    .collections<TypesensePoiDocument>(COLLECTION_NAME)
    .documents()
    .import(documents, { action: "upsert" });
}

export type { TypesensePoiDocument, TypesenseSearchFilters };
