import { describe, test, expect, mock } from "bun:test";

const mockExecuteOverpassQuery = mock(() =>
  Promise.resolve({
    elements: [
      {
        id: 111,
        type: "node",
        lat: 48.137,
        lon: 11.576,
        tags: { name: "Hofbräuhaus", amenity: "biergarten" },
      },
      {
        id: 222,
        type: "node",
        lat: 48.138,
        lon: 11.577,
        tags: { name: "Frauenkirche", historic: "church" },
      },
    ],
  })
);

const selectChain = {
  from: mock(() => selectChain),
  where: mock(() => Promise.resolve([{ osmId: 222 }])),
};

const insertChain = {
  values: mock(() => insertChain),
  onConflictDoNothing: mock(() => insertChain),
  returning: mock(() => Promise.resolve([{ id: "new-poi-001" }])),
};

const categoriesSelectResult = [
  { id: "cat-food", name: "Food & Drink", slug: "food", icon: "restaurant", color: "#FF9F9F" },
  { id: "cat-history", name: "History", slug: "history", icon: "castle", color: "#A0C4FF" },
];

let selectCallCount = 0;

const mockDb = {
  select: mock((..._args: unknown[]) => {
    selectCallCount++;
    if (selectCallCount === 1) {
      return {
        from: mock(() => ({
          where: mock(() => Promise.resolve([{ osmId: 222 }])),
        })),
      };
    }
    return {
      from: mock(() => Promise.resolve(categoriesSelectResult)),
    };
  }),
  insert: mock(() => insertChain),
};

mock.module("@/lib/db/client", () => ({ db: mockDb }));
mock.module("@/lib/db/schema", () => ({
  pois: { osmId: "osmId", id: "id" },
  categories: {},
}));
mock.module("@/lib/search/overpass", () => ({
  executeOverpassQuery: mockExecuteOverpassQuery,
}));
mock.module("@/lib/geo/categories", () => ({
  getCategorySlugFromTags: mock(() => "food"),
}));
mock.module("drizzle-orm", () => ({
  inArray: (...args: unknown[]) => args,
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

import { POST } from "./route";
import { makePostRequest } from "@/test/helpers";

describe("POST /api/pois/discover", () => {
  test("returns 400 for invalid body", async () => {
    const request = makePostRequest("/api/pois/discover", { lat: "bad" });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid parameters");
  });

  test("inserts new POIs from Overpass results", async () => {
    selectCallCount = 0;
    const request = makePostRequest("/api/pois/discover", {
      lat: 48.137,
      lon: 11.576,
      radius: 1000,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.discovered).toBe(1);
    expect(body.existing).toBe(1);
    expect(body.total).toBe(2);
  });

  test("returns 500 on Overpass error", async () => {
    mockExecuteOverpassQuery.mockImplementationOnce(() =>
      Promise.reject(new Error("Overpass timeout"))
    );
    const request = makePostRequest("/api/pois/discover", {
      lat: 48.137,
      lon: 11.576,
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});
