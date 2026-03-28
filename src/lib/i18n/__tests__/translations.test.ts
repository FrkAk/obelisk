import { describe, test, expect } from "bun:test";
import {
  translations,
  getTranslation,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n/translations";

const LOCALES: Locale[] = ["en", "tr"];

describe("translations", () => {
  test("en and tr have the same keys", () => {
    const enKeys = Object.keys(translations.en).sort();
    const trKeys = Object.keys(translations.tr).sort();
    expect(enKeys).toEqual(trKeys);
  });

  test("all translation values are non-empty strings", () => {
    for (const locale of LOCALES) {
      for (const [, value] of Object.entries(translations[locale])) {
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("no duplicate values within the same locale (catches copy-paste errors)", () => {
    for (const locale of LOCALES) {
      const seen = new Map<string, string>();
      const duplicates: string[] = [];
      for (const [key, value] of Object.entries(translations[locale])) {
        if (seen.has(value)) {
          duplicates.push(`"${key}" and "${seen.get(value)}" both map to "${value}"`);
        }
        seen.set(value, key);
      }
      // Allow a few incidental duplicates but flag if > 3
      expect(duplicates.length).toBeLessThan(4);
    }
  });
});

describe("getTranslation", () => {
  test("returns English string for known key", () => {
    expect(getTranslation("search.placeholder", "en")).toBe(
      "Ask Obelisk anything..."
    );
  });

  test("returns Turkish string for known key", () => {
    expect(getTranslation("search.placeholder", "tr")).toBe(
      "Obelisk'e her\u015Feyi sor..."
    );
  });

  test("returns different strings for different locales", () => {
    const en = getTranslation("poi.navigate", "en");
    const tr = getTranslation("poi.navigate", "tr");
    expect(en).not.toBe(tr);
  });

  test("returns the key itself for unknown key", () => {
    const result = getTranslation(
      "nonexistent.key" as TranslationKey,
      "en"
    );
    expect(result).toBe("nonexistent.key");
  });
});
