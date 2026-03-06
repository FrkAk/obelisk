import { describe, test, expect, mock } from "bun:test";
import { makeRemarkWithPoi } from "@/test/factories";

const mockDbSelect = mock(() => ({
  from: () => ({
    leftJoin: () => ({
      where: () => ({
        limit: () =>
          Promise.resolve([
            {
              id: "poi-001",
              osmId: 123456,
              name: "Test Wirtshaus",
              categoryId: "cat-1",
              latitude: 48.137,
              longitude: 11.576,
              address: "Marienplatz 1",
              locale: "de-DE",
              profile: null,
              wikipediaUrl: null,
              mapillaryId: null,
              mapillaryBearing: null,
              mapillaryIsPano: null,
              osmTags: null,
              createdAt: new Date("2025-01-01"),
              categoryName: "Food & Drink",
              categorySlug: "food",
              categoryIcon: "restaurant",
              categoryColor: "#FF9F9F",
            },
          ]),
      }),
    }),
  }),
}));

mock.module("@/lib/db/client", () => ({
  db: { select: mockDbSelect, insert: mock(() => ({ values: () => ({ onConflictDoNothing: () => ({ returning: () => Promise.resolve([]) }) }) })) },
}));
mock.module("@/lib/db/schema", () => ({
  pois: {},
  categories: {},
  remarks: {},
}));
mock.module("drizzle-orm", () => ({
  eq: mock((...args: unknown[]) => args),
}));

const mockCheckOllamaHealth = mock(() => Promise.resolve(true));
mock.module("@/lib/ai/ollama", () => ({
  checkOllamaHealth: mockCheckOllamaHealth,
}));

const mockGenerateRemark = mock(() =>
  Promise.resolve({
    title: "A Bavarian Tale",
    teaser: "Discover the remark",
    content: "Full remark content here.",
    localTip: "Visit at sunset.",
    durationSeconds: 45,
    modelId: "gemma3:4b-it-qat",
    confidence: "medium",
  })
);
mock.module("@/lib/ai/remarkGenerator", () => ({
  generateRemark: mockGenerateRemark,
}));

const cachedRemark = makeRemarkWithPoi();
const mockGetCurrentRemarkForPoi = mock(() => Promise.resolve(cachedRemark));
const mockInsertRemark = mock(() =>
  Promise.resolve({
    id: "remark-new",
    poiId: "poi-001",
    title: "A Bavarian Tale",
    teaser: "Discover the remark",
    content: "Full remark content here.",
    localTip: "Visit at sunset.",
    durationSeconds: 45,
    createdAt: new Date("2025-01-01"),
    locale: "de-DE",
    version: 1,
    isCurrent: true,
    modelId: "gemma3:4b-it-qat",
    confidence: "medium",
  })
);
mock.module("@/lib/db/queries/remarks", () => ({
  getCurrentRemarkForPoi: mockGetCurrentRemarkForPoi,
  insertRemark: mockInsertRemark,
  remarkPoiSelect: mock(() => ({})),
  mapRowToRemarkWithPoi: mock(() => ({})),
}));
mock.module("@/lib/db/queries/pois", () => ({
  loadTags: mock(() => Promise.resolve([])),
  loadContactInfo: mock(() => Promise.resolve(null)),
  getAllCategories: mock(() => Promise.resolve([])),
  getNearbyPois: mock(() => Promise.resolve([])),
}));
mock.module("@/lib/geo/categories", () => ({
  getCategorySlug: mock(() => "food"),
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

const validExternalPoi = {
  poi: {
    id: "ext-001",
    osmId: 123456,
    osmType: "node",
    name: "Test Wirtshaus",
    category: "restaurant",
    latitude: 48.137,
    longitude: 11.576,
    address: "Marienplatz 1",
    source: "overpass" as const,
  },
};

describe("POST /api/remarks/generate-for-poi", () => {
  test("returns 400 for invalid body", async () => {
    const request = makePostRequest("/api/remarks/generate-for-poi", {});
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid parameters");
  });

  test("returns cached remark when one exists", async () => {
    const request = makePostRequest(
      "/api/remarks/generate-for-poi",
      validExternalPoi
    );
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cached).toBe(true);
    expect(body.remark.title).toBe("Test Remark Title");
  });

  test("returns 503 when Ollama is down", async () => {
    mockGetCurrentRemarkForPoi.mockImplementationOnce((() =>
      Promise.resolve(undefined)
    ) as unknown as typeof mockGetCurrentRemarkForPoi);
    mockCheckOllamaHealth.mockImplementationOnce(() => Promise.resolve(false));

    const request = makePostRequest(
      "/api/remarks/generate-for-poi",
      validExternalPoi
    );
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("AI service unavailable");
  });
});
