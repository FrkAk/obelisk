import { describe, test, expect, mock } from "bun:test";

const mockSearchAutocomplete = mock(() =>
  Promise.resolve([
    { name: "Augustiner Keller", category: "food" },
    { name: "Augustiner Stammhaus", category: "food" },
  ])
);

mock.module("@/lib/search/typesense", () => ({
  searchAutocomplete: mockSearchAutocomplete,
  searchPOIs: mock(() => Promise.resolve([])),
}));
mock.module("@/lib/logger", () => ({
  createLogger: () => ({
    info: () => {},
    success: () => {},
    warn: () => {},
    error: () => {},
    timing: () => {},
  }),
}));

import { GET } from "./route";
import { makeGetRequest } from "@/test/helpers";

describe("GET /api/search/autocomplete", () => {
  test("returns empty suggestions for short query", async () => {
    const request = makeGetRequest("/api/search/autocomplete", { q: "a" });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.suggestions).toEqual([]);
  });

  test("returns suggestions for valid query", async () => {
    const request = makeGetRequest("/api/search/autocomplete", {
      q: "augustiner",
      lat: "48.137",
      lon: "11.576",
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.suggestions).toHaveLength(2);
  });
});
