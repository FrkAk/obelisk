import { describe, test, expect, mock } from "bun:test";

const mockGetAllCategories = mock(() =>
  Promise.resolve([
    { id: "1", name: "Food", slug: "food", icon: "restaurant", color: "#FF9F9F" },
  ])
);

mock.module("@/lib/db/queries/pois", () => ({
  getAllCategories: mockGetAllCategories,
  getNearbyPois: mock(() => Promise.resolve([])),
  loadTags: mock(() => Promise.resolve([])),
  loadContactInfo: mock(() => Promise.resolve(null)),
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

import { GET } from "./route";

describe("GET /api/categories", () => {
  test("returns categories with status 200", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0].slug).toBe("food");
  });

  test("returns 500 on database error", async () => {
    mockGetAllCategories.mockImplementationOnce(() =>
      Promise.reject(new Error("DB connection failed"))
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
