import { mock, describe, test, expect } from "bun:test";

const mockGenerateText = mock(() =>
  Promise.resolve(
    "TITLE: Test Title\nTEASER: Test teaser\nREMARK: Test remark content here.\nLOCAL_TIP: Visit early."
  )
);
mock.module("@/lib/ai/ollama", () => ({
  generateText: mockGenerateText,
  checkOllamaHealth: mock(() => Promise.resolve(true)),
  SEARCH_MODEL: "test-model",
  EMBED_MODEL: "test-embed",
}));
// Note: localization is NOT mocked here to avoid mock.module leaking
// into localization.test.ts. The factory POI address contains "Germany"
// so the real detectLocale returns the German locale, which is fine
// since generateText is fully mocked anyway.

import { generateRemark } from "./remarkGenerator";
import type { RemarkPoiContext } from "./remarkGenerator";
import { makePoi, makeProfile, makeTag, makeContactInfo } from "@/test/factories";

function makeCtx(overrides: Partial<RemarkPoiContext> = {}): RemarkPoiContext {
  return {
    poi: makePoi(),
    categorySlug: "food",
    categoryName: "Food & Drink",
    profile: makeProfile(),
    tags: [],
    ...overrides,
  };
}

describe("generateRemark", () => {
  test("returns null for low confidence with no keywords and no products", async () => {
    const ctx = makeCtx({
      profile: makeProfile({ keywords: [], products: [], summary: "" }),
      tags: [],
      contactInfo: null,
      poi: makePoi({ wikipediaUrl: null }),
    });
    const result = await generateRemark(ctx);
    expect(result).toBeNull();
  });

  test("returns parsed remark on successful generation", async () => {
    const ctx = makeCtx({
      profile: makeProfile({
        keywords: ["bavarian", "traditional", "beer"],
        products: ["schnitzel", "weissbier", "obatzda"],
        summary: "Traditional Bavarian restaurant in the heart of Munich.",
      }),
      tags: [makeTag()],
      contactInfo: makeContactInfo(),
      poi: makePoi({ wikipediaUrl: "https://en.wikipedia.org/wiki/Test" }),
    });

    const result = await generateRemark(ctx);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Test Title");
    expect(result!.teaser).toBe("Test teaser");
    expect(result!.content).toBe("Test remark content here.");
    expect(result!.localTip).toBe("Visit early.");
    expect(result!.confidence).toMatch(/^(high|medium|low)$/);
    expect(result!.modelId).toBeDefined();
  });
});
