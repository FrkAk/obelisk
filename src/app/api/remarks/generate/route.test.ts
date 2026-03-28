import { describe, test, expect, mock } from "bun:test";

const mockCheckOllamaHealth = mock(() => Promise.resolve(true));
const mockGenerateRemark = mock(() =>
  Promise.resolve({
    title: "A Munich Remark",
    teaser: "Discover this gem",
    content: "Full remark content here.",
    localTip: "Visit at sunset.",
    durationSeconds: 45,
    modelId: "gemma3:4b-it-qat",
    confidence: "medium",
  })
);
const mockInsertRemark = mock(() =>
  Promise.resolve({
    id: "remark-001",
    poiId: "poi-001",
    title: "A Munich Remark",
    teaser: "Discover this gem",
    content: "Full remark content here.",
    localTip: "Visit at sunset.",
    durationSeconds: 45,
    locale: "de-DE",
    version: 1,
    isCurrent: true,
    modelId: "gemma3:4b-it-qat",
    confidence: "medium",
    createdAt: new Date("2025-01-01"),
  })
);

const mockDbChain = {
  select: mock(() => mockDbChain),
  from: mock(() => mockDbChain),
  leftJoin: mock(() => mockDbChain),
  where: mock(() => mockDbChain),
  limit: mock(() => Promise.resolve([])),
};

mock.module("@/lib/db/client", () => ({ db: mockDbChain }));
mock.module("@/lib/db/schema", () => ({
  pois: { id: "id", name: "name", address: "address", wikipediaUrl: "wikipediaUrl", osmTags: "osmTags", profile: "profile", latitude: "latitude", longitude: "longitude", categoryId: "categoryId" },
  remarks: { id: "id", poiId: "poiId" },
  categories: { id: "id", name: "name", slug: "slug", color: "color" },
}));
mock.module("@/lib/ai/remarkGenerator", () => ({
  generateRemark: mockGenerateRemark,
}));
mock.module("@/lib/ai/ollama", () => ({
  checkOllamaHealth: mockCheckOllamaHealth,
}));
mock.module("@/lib/db/queries/remarks", () => ({
  insertRemark: mockInsertRemark,
}));
mock.module("@/lib/geo/distance", () => ({
  geoBounds: () => ({ minLat: 48.0, maxLat: 48.2, minLon: 11.4, maxLon: 11.7 }),
}));
mock.module("drizzle-orm", () => ({
  eq: (...args: unknown[]) => args,
  isNull: (col: unknown) => col,
  and: (...args: unknown[]) => args,
  gte: (...args: unknown[]) => args,
  lte: (...args: unknown[]) => args,
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

describe("POST /api/remarks/generate", () => {
  test("returns 400 for invalid body", async () => {
    const request = makePostRequest("/api/remarks/generate", { lat: "invalid" });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid parameters");
  });

  test("returns 503 when Ollama is down", async () => {
    mockCheckOllamaHealth.mockImplementationOnce(() => Promise.resolve(false));
    const request = makePostRequest("/api/remarks/generate", {
      lat: 48.137,
      lon: 11.576,
    });
    const response = await POST(request);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toContain("AI service unavailable");
  });

  test("returns generated: 0 when all POIs already have remarks", async () => {
    mockCheckOllamaHealth.mockImplementationOnce(() => Promise.resolve(true));
    mockDbChain.limit.mockImplementationOnce(() => Promise.resolve([]));

    const request = makePostRequest("/api/remarks/generate", {
      lat: 48.137,
      lon: 11.576,
      radius: 1000,
      limit: 5,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.generated).toBe(0);
    expect(body.remarks).toEqual([]);
    expect(body.message).toBe("All nearby POIs already have remarks.");
  });
});
