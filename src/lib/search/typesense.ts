import Typesense from "typesense";
import { createLogger } from "@/lib/logger";
import type { SearchLocation } from "./types";

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
  description?: string;
  reviewSummary?: string;
  category: string;
  amenityType?: string;
  cuisine?: string;
  priceRange?: string;
  atmosphere?: string[];
  location: [number, number];
  hasStory: boolean;
  hasOutdoorSeating?: boolean;
  hasWifi?: boolean;
  address?: string;
  dietVegetarian?: string;
  dietVegan?: string;
  dietHalal?: string;
  michelinStars?: number;
  establishmentType?: string;
  profileSummary?: string;
  tags?: string[];
  signatureDishes?: string[];
  ambiance?: string;
}

const poiSchema = {
  name: COLLECTION_NAME,
  fields: [
    { name: "poiId", type: "string" as const },
    { name: "osmId", type: "int64" as const, optional: true as const },
    { name: "name", type: "string" as const },
    { name: "description", type: "string" as const, optional: true as const },
    { name: "reviewSummary", type: "string" as const, optional: true as const },
    { name: "category", type: "string" as const, facet: true as const },
    { name: "amenityType", type: "string" as const, facet: true as const, optional: true as const },
    { name: "cuisine", type: "string" as const, facet: true as const, optional: true as const },
    { name: "priceRange", type: "string" as const, facet: true as const, optional: true as const },
    { name: "atmosphere", type: "string[]" as const, optional: true as const },
    { name: "location", type: "geopoint" as const },
    { name: "hasStory", type: "bool" as const, facet: true as const },
    { name: "hasOutdoorSeating", type: "bool" as const, optional: true as const },
    { name: "hasWifi", type: "bool" as const, optional: true as const },
    { name: "address", type: "string" as const, optional: true as const },
    { name: "dietVegetarian", type: "string" as const, facet: true as const, optional: true as const },
    { name: "dietVegan", type: "string" as const, facet: true as const, optional: true as const },
    { name: "dietHalal", type: "string" as const, facet: true as const, optional: true as const },
    { name: "michelinStars", type: "int32" as const, facet: true as const, optional: true as const },
    { name: "establishmentType", type: "string" as const, facet: true as const, optional: true as const },
    { name: "profileSummary", type: "string" as const, optional: true as const },
    { name: "tags", type: "string[]" as const, optional: true as const },
    { name: "signatureDishes", type: "string[]" as const, optional: true as const },
    { name: "ambiance", type: "string" as const, optional: true as const },
  ],
  default_sorting_field: "" as const,
  token_separators: ["-", "/"],
};

interface TypesenseSearchFilters {
  category?: string;
  cuisine?: string;
  hasStory?: boolean;
  hasOutdoorSeating?: boolean;
  hasWifi?: boolean;
  dietVegetarian?: string;
  dietVegan?: string;
  dietHalal?: string;
  establishmentType?: string;
}

/**
 * Initializes the Typesense POI collection, recreating it if the schema has changed.
 *
 * Returns:
 *     The collection info object from Typesense.
 */
export async function initCollection(): Promise<unknown> {
  try {
    const existing = await client.collections(COLLECTION_NAME).retrieve();
    const existingFieldNames = new Set(
      (existing.fields ?? []).map((f: { name: string }) => f.name)
    );
    const schemaFieldNames = new Set(poiSchema.fields.map((f) => f.name));

    const hasSchemaChange =
      schemaFieldNames.size !== existingFieldNames.size ||
      [...schemaFieldNames].some((name) => !existingFieldNames.has(name));

    if (hasSchemaChange) {
      log.warn("Schema changed, recreating collection");
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
  if (filters?.cuisine) {
    filterParts.push(`cuisine:=${filters.cuisine}`);
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
  if (filters?.dietVegetarian) {
    filterParts.push(`dietVegetarian:=${filters.dietVegetarian}`);
  }
  if (filters?.dietVegan) {
    filterParts.push(`dietVegan:=${filters.dietVegan}`);
  }
  if (filters?.dietHalal) {
    filterParts.push(`dietHalal:=${filters.dietHalal}`);
  }
  if (filters?.establishmentType) {
    filterParts.push(`establishmentType:=${filters.establishmentType}`);
  }

  const searchParameters = {
    q: query,
    query_by: "name,profileSummary,description,reviewSummary,tags,cuisine,amenityType",
    query_by_weights: "5,4,3,2,2,2,1",
    filter_by: filterParts.length > 0 ? filterParts.join(" && ") : undefined,
    sort_by: location
      ? `location(${location.latitude},${location.longitude}):asc`
      : undefined,
    per_page: limit,
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
 * Browses POIs by category with optional geo filtering.
 *
 * Args:
 *     category: The category slug to filter by.
 *     location: Optional user location for geo filtering.
 *     radiusKm: Search radius in kilometers.
 *     limit: Maximum number of results to return.
 *
 * Returns:
 *     Array of POI documents in the specified category.
 */
export async function browseByCategory(
  category: string,
  location?: SearchLocation,
  radiusKm: number = 10,
  limit: number = 20
): Promise<TypesensePoiDocument[]> {
  const filterParts: string[] = [`category:=${category}`];

  if (location) {
    filterParts.push(
      `location:(${location.latitude},${location.longitude},${radiusKm} km)`
    );
  }

  const searchParameters = {
    q: "*",
    filter_by: filterParts.join(" && "),
    sort_by: location
      ? `location(${location.latitude},${location.longitude}):asc`
      : undefined,
    per_page: limit,
  };

  const response = await client
    .collections<TypesensePoiDocument>(COLLECTION_NAME)
    .documents()
    .search(searchParameters);

  return (response.hits ?? []).map((hit) => hit.document!);
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

/**
 * Fetches a single document from the Typesense POI collection.
 *
 * Args:
 *     id: The document ID to fetch.
 *
 * Returns:
 *     The POI document, or null if not found.
 */
export async function getDocument(
  id: string
): Promise<TypesensePoiDocument | null> {
  try {
    return await client
      .collections<TypesensePoiDocument>(COLLECTION_NAME)
      .documents(id)
      .retrieve();
  } catch {
    return null;
  }
}

export type { TypesensePoiDocument, TypesenseSearchFilters };
