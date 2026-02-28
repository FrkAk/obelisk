import { describe, test, expect } from "bun:test";
import { buildProfile } from "@/lib/poi/profile";

describe("buildProfile", () => {
  test("food category extracts subtype and food attributes", () => {
    const profile = buildProfile(
      { amenity: "restaurant", outdoor_seating: "yes", takeaway: "no", cuisine: "italian" },
      "food",
    );
    expect(profile.subtype).toBe("restaurant");
    expect(profile.attributes.outdoorSeating).toBe(true);
    expect(profile.attributes.takeaway).toBe(false);
    expect(profile.osmExtracted?.cuisine).toBe("italian");
    expect(profile.enrichmentSource).toBe("seed");
  });

  test("history category extracts year and heritage level", () => {
    const profile = buildProfile(
      { historic: "castle", start_date: "1158", heritage: "2" },
      "history",
    );
    expect(profile.subtype).toBe("castle");
    expect(profile.attributes.yearBuilt).toBe(1158);
    expect(profile.attributes.heritageLevel).toBe("national");
  });

  test("architecture category extracts style and architect", () => {
    const profile = buildProfile(
      { building: "church", architecture: "baroque", architect: "Johann Baptist Zimmermann" },
      "architecture",
    );
    expect(profile.subtype).toBe("church");
    expect(profile.attributes.primaryStyle).toBe("baroque");
    expect(profile.attributes.architect).toBe("Johann Baptist Zimmermann");
  });

  test("nature category extracts trail difficulty and lighting", () => {
    const profile = buildProfile(
      { leisure: "park", sac_scale: "hiking", lit: "yes" },
      "nature",
    );
    expect(profile.subtype).toBe("park");
    expect(profile.attributes.trailDifficulty).toBe("easy");
    expect(profile.attributes.litAtNight).toBe(true);
  });

  test("views category extracts elevation and direction", () => {
    const profile = buildProfile(
      { tourism: "viewpoint", ele: "520", direction: "SW" },
      "views",
    );
    expect(profile.subtype).toBe("viewpoint");
    expect(profile.attributes.elevationM).toBe("520");
    expect(profile.attributes.viewDirection).toBe("SW");
  });

  test("shopping category extracts brand from osmExtracted", () => {
    const profile = buildProfile(
      { shop: "clothes", brand: "Adidas", clothes: "sportswear" },
      "shopping",
    );
    expect(profile.subtype).toBe("clothes");
    expect(profile.osmExtracted?.brand).toBe("Adidas");
    expect(profile.osmExtracted?.clothes).toBe("sportswear");
  });

  test("empty tags produce minimal profile", () => {
    const profile = buildProfile({}, "hidden");
    expect(profile.subtype).toBeUndefined();
    expect(profile.osmExtracted).toBeUndefined();
    expect(profile.keywords).toEqual([]);
    expect(profile.products).toEqual([]);
    expect(profile.summary).toBe("");
    expect(profile.attributes).toEqual({});
  });

  test("nightlife extracts amenity as subtype", () => {
    const profile = buildProfile({ amenity: "bar" }, "nightlife");
    expect(profile.subtype).toBe("bar");
  });

  test("health extracts healthcare subtype", () => {
    const profile = buildProfile({ healthcare: "clinic" }, "health");
    expect(profile.subtype).toBe("clinic");
  });

  test("history with ruins sets preservationStatus", () => {
    const profile = buildProfile(
      { historic: "monument", ruins: "yes" },
      "history",
    );
    expect(profile.attributes.preservationStatus).toBe("ruins");
  });

  test("history with UNESCO heritage level 1", () => {
    const profile = buildProfile(
      { historic: "castle", heritage: "1" },
      "history",
    );
    expect(profile.attributes.heritageLevel).toBe("unesco");
  });

  test("nature with difficult trail", () => {
    const profile = buildProfile(
      { leisure: "park", sac_scale: "alpine_hiking" },
      "nature",
    );
    expect(profile.attributes.trailDifficulty).toBe("difficult");
  });

  test("architecture with place_of_worship defaults to church", () => {
    const profile = buildProfile(
      { amenity: "place_of_worship" },
      "architecture",
    );
    expect(profile.subtype).toBe("church");
  });

  test("views with observation tower", () => {
    const profile = buildProfile(
      { "tower:type": "observation" },
      "views",
    );
    expect(profile.subtype).toBe("tower");
  });
});
