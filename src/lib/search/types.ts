import type { CategorySlug, Remark, Poi } from "@/types";

export type SearchQueryType =
  | "simple"
  | "contextual"
  | "complex"
  | "discovery"
  | "route";

export type SearchMode = "name" | "keyword" | "conversational";

export interface SearchFilters {
  outdoor?: boolean;
  budget?: number;
  partySize?: number;
  openNow?: boolean;
  wifi?: boolean;
  quiet?: boolean;
}

export interface ParsedIntent {
  type: SearchQueryType;
  mode: SearchMode;
  category?: CategorySlug;
  filters: SearchFilters;
  keywords: string[];
  placeName?: string;
  cuisineTypes?: string[];
}

export interface SearchLocation {
  latitude: number;
  longitude: number;
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
  source: "nominatim" | "overpass" | "obelisk-db";
}

export interface ObeliskResult {
  type: "remark";
  remark: Remark & { poi: Poi };
  distance?: number;
  score: number;
}

export interface ExternalResult {
  type: "external";
  poi: ExternalPOI;
  nearbyRemark?: Remark & { poi: Poi };
  distance?: number;
  score: number;
}

export type SearchResult = ObeliskResult | ExternalResult;

export interface SearchResponse {
  results: SearchResult[];
  conversationalResponse: string;
  intent: ParsedIntent;
  timing: {
    parseMs: number;
    obeliskMs: number;
    externalMs: number;
    totalMs: number;
  };
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

export interface SearchRequest {
  query: string;
  location: SearchLocation;
  viewport?: ViewportContext;
  radius?: number;
  limit?: number;
}
