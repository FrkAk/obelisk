import { describe, test, expect } from "bun:test";
import {
  getCategorySlug,
  getCategorySlugFromTags,
  OSM_CATEGORY_MAP,
} from "@/lib/geo/categories";

describe("getCategorySlug", () => {
  test("restaurant maps to food", () => {
    expect(getCategorySlug("restaurant")).toBe("food");
  });

  test("museum maps to art", () => {
    expect(getCategorySlug("museum")).toBe("art");
  });

  test("unknown value maps to hidden", () => {
    expect(getCategorySlug("unknown_thing")).toBe("hidden");
  });

  test("lookup is case insensitive", () => {
    expect(getCategorySlug("Restaurant")).toBe("food");
    expect(getCategorySlug("MUSEUM")).toBe("art");
  });
});

describe("getCategorySlugFromTags", () => {
  test("historic tag maps to history", () => {
    expect(getCategorySlugFromTags({ historic: "yes" })).toBe("history");
  });

  test("tourism=museum maps to art", () => {
    expect(getCategorySlugFromTags({ tourism: "museum" })).toBe("art");
  });

  test("shop tag maps to shopping", () => {
    expect(getCategorySlugFromTags({ shop: "clothes" })).toBe("shopping");
  });

  test("empty tags map to hidden", () => {
    expect(getCategorySlugFromTags({})).toBe("hidden");
  });
});

describe("OSM_CATEGORY_MAP", () => {
  test("is a non-empty record", () => {
    expect(Object.keys(OSM_CATEGORY_MAP).length).toBeGreaterThan(0);
  });
});
