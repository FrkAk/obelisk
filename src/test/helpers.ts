import { NextRequest } from "next/server";

/**
 * Creates a GET NextRequest with query parameters.
 *
 * @param path - URL path (e.g., "/api/pois").
 * @param params - Query parameter key-value pairs.
 * @returns NextRequest configured for GET with query params.
 */
export function makeGetRequest(
  path: string,
  params: Record<string, string> = {}
): NextRequest {
  const url = new URL(path, "http://localhost:3000");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

/**
 * Creates a POST NextRequest with a JSON body.
 *
 * @param path - URL path (e.g., "/api/search").
 * @param body - JSON-serializable body.
 * @returns NextRequest configured for POST with JSON body.
 */
export function makePostRequest(
  path: string,
  body: unknown
): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
