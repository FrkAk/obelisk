import { describe, test, expect, afterEach } from "bun:test";
import { buildLanguagePrompt, detectLocale } from "./localization";

describe("buildLanguagePrompt", () => {
  test("English locale returns simple English instruction", () => {
    const result = buildLanguagePrompt({
      language: "English",
      country: "Unknown",
      code: "en",
      expressions: [],
    });
    expect(result).toBe("LANGUAGE: Write your response entirely in English.");
  });

  test("German locale includes country, language, and English", () => {
    const result = buildLanguagePrompt({
      language: "German",
      country: "Germany",
      code: "de",
      expressions: ["Mahlzeit!", "gemütlich", "Feierabend", "Doch!"],
    });
    expect(result).toContain("Germany");
    expect(result).toContain("German");
    expect(result).toContain("English");
  });
});

describe("detectLocale", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("address ending with Germany returns German locale", async () => {
    const result = await detectLocale("Marienplatz 1, 80331 München, Germany");
    expect(result.country).toBe("Germany");
    expect(result.code).toBe("de");
    expect(result.language).toBe("German");
  });

  test("unknown country in address falls through to Mapbox", async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "test-token";
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ features: [{ text: "France" }] }),
        { status: 200 }
      )) as unknown as typeof fetch;

    const result = await detectLocale("123 Unknown Addr, Atlantis", 48.0, 2.0);
    expect(result.country).toBe("France");
    expect(result.code).toBe("fr");
  });

  test("all fail returns English fallback", async () => {
    delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_MAPBOX_TOKEN;
    globalThis.fetch = (() => Promise.reject(new Error("network"))) as unknown as typeof fetch;

    const result = await detectLocale(undefined, undefined, undefined);
    expect(result.code).toBe("en");
    expect(result.country).toBe("Unknown");
  });
});
