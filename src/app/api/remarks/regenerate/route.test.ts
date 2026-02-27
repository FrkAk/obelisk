import { describe, test, expect, mock } from "bun:test";
import { makeRemarkWithPoi } from "@/test/factories";

const existingRemark = makeRemarkWithPoi();

const mockGetRemarkById = mock(() => Promise.resolve(existingRemark));
const mockVersionBumpRemark = mock(() =>
  Promise.resolve({
    id: "remark-002",
    poiId: "poi-001",
    title: "New Story Title",
    teaser: "New teaser",
    content: "New full story content.",
    localTip: "New local tip.",
    durationSeconds: 60,
    locale: "de-DE",
    version: 2,
    isCurrent: true,
    modelId: "gemma3:4b-it-qat",
    confidence: "high",
    createdAt: new Date("2025-02-01"),
  })
);
const mockCheckOllamaHealth = mock(() => Promise.resolve(true));
const mockGenerateStory = mock(() =>
  Promise.resolve({
    title: "New Story Title",
    teaser: "New teaser",
    content: "New full story content.",
    localTip: "New local tip.",
    durationSeconds: 60,
    modelId: "gemma3:4b-it-qat",
    confidence: "high",
  })
);
const mockLoadTags = mock(() => Promise.resolve([]));
const mockLoadContactInfo = mock(() => Promise.resolve(null));

const mockDbChain = {
  select: mock(() => mockDbChain),
  from: mock(() => mockDbChain),
  where: mock(() => mockDbChain),
  limit: mock(() => Promise.resolve([{ profile: null }])),
};

mock.module("@/lib/db/client", () => ({ db: mockDbChain }));
mock.module("@/lib/db/schema", () => ({
  pois: { id: "id", profile: "profile" },
}));
mock.module("@/lib/db/queries/remarks", () => ({
  getRemarkById: mockGetRemarkById,
  versionBumpRemark: mockVersionBumpRemark,
}));
mock.module("@/lib/db/queries/pois", () => ({
  loadTags: mockLoadTags,
  loadContactInfo: mockLoadContactInfo,
}));
mock.module("@/lib/ai/storyGenerator", () => ({
  generateStory: mockGenerateStory,
}));
mock.module("@/lib/ai/ollama", () => ({
  checkOllamaHealth: mockCheckOllamaHealth,
}));
mock.module("drizzle-orm", () => ({
  eq: (...args: unknown[]) => args,
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

describe("POST /api/remarks/regenerate", () => {
  test("returns 400 for invalid UUID", async () => {
    const request = makePostRequest("/api/remarks/regenerate", {
      remarkId: "not-a-uuid",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid parameters");
  });

  test("returns 404 when remark not found", async () => {
    (mockGetRemarkById as ReturnType<typeof mock>).mockImplementationOnce(() => Promise.resolve(undefined));
    const request = makePostRequest("/api/remarks/regenerate", {
      remarkId: "00000000-0000-0000-0000-000000000000",
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Remark not found");
  });

  test("returns 503 when Ollama is down", async () => {
    mockGetRemarkById.mockImplementationOnce(() => Promise.resolve(existingRemark));
    mockCheckOllamaHealth.mockImplementationOnce(() => Promise.resolve(false));
    const request = makePostRequest("/api/remarks/regenerate", {
      remarkId: "00000000-0000-0000-0000-000000000000",
    });
    const response = await POST(request);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toContain("AI service unavailable");
  });

  test("returns 200 with version-bumped remark on success", async () => {
    mockGetRemarkById.mockImplementationOnce(() => Promise.resolve(existingRemark));
    mockCheckOllamaHealth.mockImplementationOnce(() => Promise.resolve(true));
    mockDbChain.limit.mockImplementationOnce(() =>
      Promise.resolve([{ profile: null }])
    );

    const request = makePostRequest("/api/remarks/regenerate", {
      remarkId: "00000000-0000-0000-0000-000000000000",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.remark.id).toBe("remark-002");
    expect(body.remark.version).toBe(2);
    expect(body.remark.title).toBe("New Story Title");
  });
});
