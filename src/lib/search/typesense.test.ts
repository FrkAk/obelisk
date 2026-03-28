import { describe, test, expect, mock, beforeEach } from "bun:test";

interface Hit {
  document: { poiId: string; name: string; category: string; location: number[] };
}

const mockSearch = mock(() => Promise.resolve({ hits: [] as Hit[] }));

class MockClient {
  collections() {
    return {
      documents() {
        return { search: mockSearch };
      },
    };
  }
}

const mockModule = { Client: MockClient, SearchClient: MockClient, Errors: {} };

mock.module("typesense", () => ({
  ...mockModule,
  default: mockModule,
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

const { searchAutocomplete } = await import("./typesense");

function makeHit(poiId: string, name: string, category: string): Hit {
  return {
    document: {
      poiId,
      name,
      category,
      location: [48.137, 11.576],
    },
  };
}

describe("searchAutocomplete", () => {
  beforeEach(() => {
    mockSearch.mockReset();
  });

  test("deduplicates results by name", async () => {
    mockSearch.mockImplementation(() =>
      Promise.resolve({
        hits: [
          makeHit("1", "Nespresso", "shopping"),
          makeHit("2", "Nespresso", "shopping"),
          makeHit("3", "Nespresso", "shopping"),
          makeHit("4", "Nero Cafe", "food"),
        ],
      })
    );

    const results = await searchAutocomplete("ne");

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("Nespresso");
    expect(results[0].id).toBe("1");
    expect(results[1].name).toBe("Nero Cafe");
  });

  test("caps results at 5", async () => {
    mockSearch.mockImplementation(() =>
      Promise.resolve({
        hits: Array.from({ length: 10 }, (_, i) =>
          makeHit(String(i), `Place ${i}`, "food")
        ),
      })
    );

    const results = await searchAutocomplete("pl");

    expect(results).toHaveLength(5);
  });

  test("returns empty array when no hits", async () => {
    mockSearch.mockImplementation(() =>
      Promise.resolve({ hits: [] })
    );

    const results = await searchAutocomplete("xyz");

    expect(results).toEqual([]);
  });
});
