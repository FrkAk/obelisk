import type { CategorySlug, Remark, Poi, Category } from "@/types";

export type SearchQueryType =
  | "simple"
  | "contextual"
  | "complex"
  | "discovery"
  | "route";

export type SearchMode = "name" | "keyword" | "conversational";

export interface ParsedIntent {
  type?: SearchQueryType;
  mode?: SearchMode;
  category?: CategorySlug;
  keywords: string[];
  placeName?: string;
  cuisineTypes?: string[];
  filters: SearchFilters;
  isDiscovery?: boolean;
}

export interface SearchFilters {
  outdoor?: boolean;
  budget?: number;
  partySize?: number;
  openNow?: boolean;
  wifi?: boolean;
  quiet?: boolean;
}

export interface SearchLocation {
  latitude: number;
  longitude: number;
}

export interface SearchResult {
  id: string;
  osmId?: number;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance?: number;
  score: number;
  address?: string;
  description?: string;
  cuisine?: string;
  amenityType?: string;
  hasStory: boolean;
  hasOutdoorSeating?: boolean;
  hasWifi?: boolean;
  remark?: Remark & { poi: Poi & { category?: Category } };
  source: "typesense" | "semantic" | "obelisk-db";
}

export interface SearchResponse {
  results: SearchResult[];
  intent: ParsedIntent;
  timing: {
    parseMs: number;
    typesenseMs: number;
    semanticMs: number;
    obeliskMs: number;
    totalMs: number;
  };
}

export interface SearchRequest {
  query: string;
  location: SearchLocation;
  radius?: number;
  limit?: number;
}

export interface ViewportBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface ViewportContext {
  center: SearchLocation;
  bounds: ViewportBounds;
  zoom: number;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address?: {
    amenity?: string;
    road?: string;
    suburb?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  boundingbox: string[];
}

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface ExternalPOI {
  id: string;
  osmId: number;
  osmType: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance?: number;
  address?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  cuisine?: string;
  hasWifi?: boolean;
  hasOutdoorSeating?: boolean;
  imageUrl?: string;
  wikipediaUrl?: string;
  source: "nominatim" | "overpass" | "obelisk-db";
}

export interface ObeliskResult {
  type: "remark";
  remark: Remark & { poi: Poi & { category?: Category } };
  distance?: number;
  score: number;
}

export interface ExternalResult {
  type: "external";
  poi: ExternalPOI;
  nearbyRemark?: Remark & { poi: Poi & { category?: Category } };
  distance?: number;
  score: number;
}
