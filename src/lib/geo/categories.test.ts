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

  test("tourism=gallery maps to art", () => {
    expect(getCategorySlugFromTags({ tourism: "gallery" })).toBe("art");
  });

  test("tourism=viewpoint maps to views", () => {
    expect(getCategorySlugFromTags({ tourism: "viewpoint" })).toBe("views");
  });

  test("tourism=artwork maps to art", () => {
    expect(getCategorySlugFromTags({ tourism: "artwork" })).toBe("art");
  });

  test("tourism=attraction maps to culture", () => {
    expect(getCategorySlugFromTags({ tourism: "attraction" })).toBe("culture");
  });

  test("food amenities map to food", () => {
    for (const amenity of ["restaurant", "cafe", "fast_food", "biergarten", "ice_cream", "food_court"]) {
      expect(getCategorySlugFromTags({ amenity })).toBe("food");
    }
  });

  test("nightlife amenities map to nightlife", () => {
    for (const amenity of ["bar", "pub", "nightclub"]) {
      expect(getCategorySlugFromTags({ amenity })).toBe("nightlife");
    }
  });

  test("health amenities map to health", () => {
    for (const amenity of ["hospital", "pharmacy", "clinic", "doctors", "dentist"]) {
      expect(getCategorySlugFromTags({ amenity })).toBe("health");
    }
  });

  test("healthcare tag maps to health", () => {
    expect(getCategorySlugFromTags({ healthcare: "clinic" })).toBe("health");
  });

  test("education amenities map to education", () => {
    for (const amenity of ["university", "school", "college", "kindergarten", "library"]) {
      expect(getCategorySlugFromTags({ amenity })).toBe("education");
    }
  });

  test("service amenities map to services", () => {
    for (const amenity of ["police", "fire_station", "bank", "post_office"]) {
      expect(getCategorySlugFromTags({ amenity })).toBe("services");
    }
  });

  test("shop tag maps to shopping", () => {
    expect(getCategorySlugFromTags({ shop: "clothes" })).toBe("shopping");
  });

  test("nature leisure values map to nature", () => {
    for (const leisure of ["park", "garden", "nature_reserve"]) {
      expect(getCategorySlugFromTags({ leisure })).toBe("nature");
    }
  });

  test("natural tag maps to nature", () => {
    expect(getCategorySlugFromTags({ natural: "wood" })).toBe("nature");
  });

  test("sports leisure values map to sports", () => {
    for (const leisure of ["sports_centre", "stadium", "fitness_centre", "swimming_pool", "pitch"]) {
      expect(getCategorySlugFromTags({ leisure })).toBe("sports");
    }
  });

  test("culture amenities map to culture", () => {
    for (const amenity of ["theatre", "cinema", "community_centre"]) {
      expect(getCategorySlugFromTags({ amenity })).toBe("culture");
    }
  });

  test("transport tags map to transport", () => {
    expect(getCategorySlugFromTags({ amenity: "bus_station" })).toBe("transport");
    expect(getCategorySlugFromTags({ railway: "station" })).toBe("transport");
  });

  test("hotel/hostel/guest_house map to services", () => {
    for (const tourism of ["hotel", "hostel", "guest_house"]) {
      expect(getCategorySlugFromTags({ tourism })).toBe("services");
    }
  });

  test("architecture tags map to architecture", () => {
    expect(getCategorySlugFromTags({ architect: "Leo von Klenze" })).toBe("architecture");
    expect(getCategorySlugFromTags({ building: "church" })).toBe("architecture");
    expect(getCategorySlugFromTags({ amenity: "place_of_worship" })).toBe("architecture");
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
