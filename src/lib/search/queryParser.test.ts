import { mock, describe, test, expect } from "bun:test";

mock.module("@/lib/search/queryClassifier", () => ({
  classifyQuery: async () => ({ category: "food", filters: {} }),
}));

import { parseQueryIntent } from "./queryParser";

describe("parseQueryIntent", () => {
  describe("exact fast-path", () => {
    test("pizza resolves to food with pizza keyword", async () => {
      const result = await parseQueryIntent("pizza");
      expect(result.category).toBe("food");
      expect(result.keywords).toContain("pizza");
      expect(result.source).toBe("fast-path");
    });

    test("cafe resolves to food with coffee keyword", async () => {
      const result = await parseQueryIntent("café");
      expect(result.category).toBe("food");
      expect(result.keywords).toContain("coffee");
    });

    test("museum resolves to art", async () => {
      const result = await parseQueryIntent("museum");
      expect(result.category).toBe("art");
      expect(result.source).toBe("fast-path");
    });
  });

  describe("multi-word fast-path", () => {
    test("beer garden resolves to food with biergarten keyword", async () => {
      const result = await parseQueryIntent("beer garden");
      expect(result.category).toBe("food");
      expect(result.keywords).toContain("biergarten");
      expect(result.source).toBe("fast-path");
    });

    test("ice cream resolves to food with ice_cream keyword", async () => {
      const result = await parseQueryIntent("ice cream");
      expect(result.category).toBe("food");
      expect(result.keywords).toContain("ice_cream");
      expect(result.source).toBe("fast-path");
    });
  });

  describe("prefix match", () => {
    test("beer garden near me matches beer garden fast-path", async () => {
      const result = await parseQueryIntent("beer garden near me");
      expect(result.category).toBe("food");
      expect(result.keywords).toContain("biergarten");
      expect(result.source).toBe("fast-path");
    });
  });

  describe("discovery queries", () => {
    test("surprise me is a discovery query", async () => {
      const result = await parseQueryIntent("surprise me");
      expect(result.isDiscovery).toBe(true);
    });

    test("random is a discovery query", async () => {
      const result = await parseQueryIntent("random");
      expect(result.isDiscovery).toBe(true);
    });
  });

  describe("case insensitive", () => {
    test("PIZZA matches same as pizza", async () => {
      const result = await parseQueryIntent("PIZZA");
      expect(result.category).toBe("food");
      expect(result.keywords).toContain("pizza");
      expect(result.source).toBe("fast-path");
    });
  });

  describe("empty query", () => {
    test("returns default intent", async () => {
      const result = await parseQueryIntent("");
      expect(result.keywords).toEqual([]);
      expect(result.source).toBe("default");
    });

    test("whitespace-only returns default intent", async () => {
      const result = await parseQueryIntent("   ");
      expect(result.keywords).toEqual([]);
      expect(result.source).toBe("default");
    });
  });

  describe("classifier fallback", () => {
    test("unknown long query falls back to classifier", async () => {
      const result = await parseQueryIntent("where can I find artisanal pottery workshops");
      expect(result.source).toBe("classifier");
    });
  });
});
