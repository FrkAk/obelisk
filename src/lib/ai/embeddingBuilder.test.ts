import { describe, test, expect } from "bun:test";
import { buildEmbeddingText } from "@/lib/ai/embeddingBuilder";
import { makePoi, makeProfile, makeTag } from "@/test/factories";
import type { Cuisine } from "@/types/api";

describe("buildEmbeddingText", () => {
  test("name-only POI with null profile and empty tags", () => {
    const poi = makePoi({ name: "Cafe Luitpold" });
    const result = buildEmbeddingText(poi, null, []);
    expect(result).toContain("Cafe Luitpold");
    expect(result).toContain("Marienplatz 1");
  });

  test("name-only POI with no address", () => {
    const poi = makePoi({ name: "Nameless", address: null });
    const result = buildEmbeddingText(poi, null, []);
    expect(result).toBe("Nameless");
  });

  test("profile fields are included", () => {
    const poi = makePoi({ name: "Test" });
    const profile = makeProfile({
      subtype: "Bavarian restaurant",
      keywords: ["beer", "pork"],
      products: ["Schnitzel", "Helles"],
      summary: "Classic Bavarian food",
      attributes: { brand: "Augustiner" },
    });
    const result = buildEmbeddingText(poi, profile, []);
    expect(result).toContain("Bavarian restaurant");
    expect(result).toContain("beer, pork");
    expect(result).toContain("Schnitzel, Helles");
    expect(result).toContain("Classic Bavarian food");
    expect(result).toContain("Brand: Augustiner");
  });

  test("tags and cuisines appended as comma-separated names", () => {
    const poi = makePoi({ name: "Test" });
    const tags = [
      makeTag({ name: "Historic" }),
      makeTag({ name: "Landmark", id: "tag-002", slug: "landmark" }),
    ];
    const cuisines: Cuisine[] = [
      { id: "c-1", slug: "bavarian", name: "Bavarian", region: null, parentSlug: null, icon: null },
      { id: "c-2", slug: "german", name: "German", region: null, parentSlug: null, icon: null },
    ];
    const result = buildEmbeddingText(poi, null, tags, cuisines);
    expect(result).toContain("Historic, Landmark");
    expect(result).toContain("Bavarian, German");
  });

  test("accessibility flags rendered as text", () => {
    const poi = makePoi({ name: "Test" });
    const access = {
      wheelchair: true,
      dogFriendly: true,
      elevator: false,
      parkingAvailable: null,
    };
    const result = buildEmbeddingText(poi, null, [], undefined, access);
    expect(result).toContain("Wheelchair accessible");
    expect(result).toContain("Dog-friendly");
    expect(result).not.toContain("Elevator");
    expect(result).not.toContain("Parking");
  });

  test("null and empty values excluded, pipe delimiter between parts", () => {
    const poi = makePoi({ name: "A", address: null });
    const profile = makeProfile({
      subtype: "B",
      keywords: [],
      products: [],
      summary: "",
      attributes: {},
    });
    const result = buildEmbeddingText(poi, profile, []);
    expect(result).toBe("A | B");
  });
});
