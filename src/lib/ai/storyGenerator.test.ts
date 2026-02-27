import { describe, test, expect } from "bun:test";
import {
  assessConfidence,
  stripMarkdown,
  truncateAtSentence,
  sanitizeContent,
  sanitizeTeaser,
  parseStoryResponse,
} from "@/lib/ai/storyGenerator";
import type { StoryPoiContext } from "@/lib/ai/storyGenerator";
import { makePoi, makeProfile, makeTag, makeContactInfo } from "@/test/factories";

function makeCtx(overrides: Partial<StoryPoiContext> = {}): StoryPoiContext {
  return {
    poi: makePoi(),
    categorySlug: "food",
    categoryName: "Food & Drink",
    profile: null,
    tags: [],
    ...overrides,
  };
}

describe("assessConfidence", () => {
  test("empty context returns low", () => {
    expect(assessConfidence(makeCtx())).toBe("low");
  });

  test("rich profile returns high (score >= 5)", () => {
    const ctx = makeCtx({
      profile: makeProfile({
        keywords: ["a", "b", "c"],
        products: ["x", "y", "z"],
        summary: "A great place",
        attributes: { brand: "Test" },
      }),
      tags: [makeTag()],
    });
    expect(assessConfidence(ctx)).toBe("high");
  });

  test("boundary at score 5 yields high", () => {
    const ctx = makeCtx({
      profile: makeProfile({
        keywords: ["a", "b", "c"],
        products: [],
        summary: "Has summary",
      }),
      tags: [makeTag()],
    });
    expect(assessConfidence(ctx)).toBe("high");
  });

  test("moderate data returns medium", () => {
    const ctx = makeCtx({
      profile: makeProfile({
        keywords: ["a"],
        products: [],
        summary: "",
      }),
      tags: [makeTag()],
    });
    expect(assessConfidence(ctx)).toBe("medium");
  });

  test("contactInfo contributes to score", () => {
    const ctx = makeCtx({
      profile: makeProfile({ keywords: ["a"], products: [] }),
      contactInfo: makeContactInfo(),
    });
    expect(assessConfidence(ctx)).not.toBe("low");
  });

  test("wikipediaUrl contributes to score", () => {
    const ctx = makeCtx({
      poi: makePoi({ wikipediaUrl: "https://en.wikipedia.org/wiki/Test" }),
      profile: makeProfile({ keywords: ["a"], products: [] }),
    });
    expect(assessConfidence(ctx)).not.toBe("low");
  });
});

describe("stripMarkdown", () => {
  test("removes bold", () => {
    expect(stripMarkdown("**bold text**")).toBe("bold text");
  });

  test("removes italic", () => {
    expect(stripMarkdown("*italic text*")).toBe("italic text");
  });

  test("removes headers", () => {
    expect(stripMarkdown("## Header")).toBe("Header");
  });

  test("removes inline code", () => {
    expect(stripMarkdown("`code`")).toBe("code");
  });

  test("leaves plain text unchanged", () => {
    expect(stripMarkdown("plain text")).toBe("plain text");
  });
});

describe("truncateAtSentence", () => {
  test("text under limit is unchanged", () => {
    expect(truncateAtSentence("Short text.", 100)).toBe("Short text.");
  });

  test("text over limit cuts at sentence boundary", () => {
    const text = "First sentence. Second sentence. Third sentence is much longer here.";
    const result = truncateAtSentence(text, 5);
    expect(result).toBe("First sentence. Second sentence.");
  });

  test("no sentence boundary forces period", () => {
    const text = "one two three four five six seven eight nine ten";
    const result = truncateAtSentence(text, 5);
    expect(result).toBe("one two three four five.");
  });
});

describe("sanitizeContent", () => {
  test("removes banned phrase: you know?", () => {
    const result = sanitizeContent("This is great, you know? Really great.");
    expect(result).not.toContain("you know?");
  });

  test("removes banned phrase: tucked away", () => {
    const result = sanitizeContent("A cafe tucked away on a side street.");
    expect(result).not.toContain("tucked away");
  });

  test("removes banned phrase: a real find", () => {
    const result = sanitizeContent("It's a real find for coffee lovers.");
    expect(result).not.toContain("a real find");
  });

  test("normalizes multiple spaces", () => {
    const result = sanitizeContent("too   many   spaces");
    expect(result).toBe("too many spaces");
  });
});

describe("sanitizeTeaser", () => {
  test("banned pattern replaced with fallback", () => {
    const result = sanitizeTeaser("Where locals actually hang out", "food");
    expect(result).not.toContain("Where locals actually");
    expect(result.length).toBeGreaterThan(0);
  });

  test("clean teaser passes through", () => {
    expect(sanitizeTeaser("Schnitzel done right", "food")).toBe("Schnitzel done right");
  });

  test("banned detection is case insensitive", () => {
    const result = sanitizeTeaser("Trust me, this place rocks", "food");
    expect(result).not.toBe("Trust me, this place rocks");
  });
});

describe("parseStoryResponse", () => {
  test("well-formed response parsed correctly", () => {
    const response = [
      "TITLE: The Cozy Corner",
      "TEASER: Schnitzel worth the queue",
      "STORY: A classic Bavarian spot. The regulars know what to order.",
      "LOCAL_TIP: Come before noon for the freshest Brezn.",
    ].join("\n");
    const parsed = parseStoryResponse(response, "food");
    expect(parsed.title).toBe("The Cozy Corner");
    expect(parsed.teaser).toBe("Schnitzel worth the queue");
    expect(parsed.content).toContain("classic Bavarian");
    expect(parsed.localTip).toContain("before noon");
  });

  test("missing sections use defaults", () => {
    const parsed = parseStoryResponse("Just some random text", "food");
    expect(parsed.title).toBe("A Hidden Story");
    expect(parsed.content.length).toBeGreaterThan(0);
    expect(parsed.localTip.length).toBeGreaterThan(0);
  });

  test("durationSeconds between 30 and 90", () => {
    const short = parseStoryResponse("TITLE: X\nTEASER: Y\nSTORY: Short.\nLOCAL_TIP: W", "food");
    expect(short.durationSeconds).toBeGreaterThanOrEqual(30);
    expect(short.durationSeconds).toBeLessThanOrEqual(90);

    const longStory = "TITLE: X\nTEASER: Y\nSTORY: " + Array(200).fill("word").join(" ") + "\nLOCAL_TIP: W";
    const long = parseStoryResponse(longStory, "food");
    expect(long.durationSeconds).toBeGreaterThanOrEqual(30);
    expect(long.durationSeconds).toBeLessThanOrEqual(90);
  });

  test("title truncated at 100 chars", () => {
    const longTitle = "TITLE: " + "A".repeat(150) + "\nTEASER: Y\nSTORY: Z\nLOCAL_TIP: W";
    const parsed = parseStoryResponse(longTitle, "food");
    expect(parsed.title.length).toBeLessThanOrEqual(100);
  });
});
