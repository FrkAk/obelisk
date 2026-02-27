import { db } from "../src/lib/db/client";
import { tags } from "../src/lib/db/schema";

interface TagEntry {
  name: string;
  slug: string;
  group: string;
  displayOrder?: number;
}

function buildGroup(group: string, entries: string[]): TagEntry[] {
  return entries.map((name, i) => ({
    name,
    slug: name.toLowerCase().replace(/[\s/]+/g, "-").replace(/[^a-z0-9-]/g, ""),
    group,
    displayOrder: i + 1,
  }));
}

const TAG_DATA: TagEntry[] = [
  // Atmosphere
  ...buildGroup("atmosphere", [
    "Romantic",
    "Cozy",
    "Lively",
    "Quiet",
    "Trendy",
    "Traditional",
    "Rustic",
    "Modern",
    "Elegant",
    "Bohemian",
    "Family-Friendly",
    "Hipster",
    "Underground",
    "Touristy",
    "Local Favorite",
    "Hidden Gem",
    "Instagrammable",
    "Historic Ambiance",
    "Waterfront",
    "Rooftop",
  ]),

  // Architectural style
  ...buildGroup("architectural_style", [
    "Baroque",
    "Gothic",
    "Romanesque",
    "Renaissance",
    "Neoclassical",
    "Art Nouveau",
    "Art Deco",
    "Modernist",
    "Brutalist",
    "Contemporary",
    "Medieval",
    "Rococo",
    "Jugendstil",
    "Bauhaus",
    "Byzantine",
    "Moorish",
    "Half-Timbered",
    "Industrial",
    "Deconstructivist",
    "Postmodern",
  ]),

  // Era
  ...buildGroup("era", [
    "Ancient",
    "Medieval",
    "Renaissance",
    "Baroque",
    "Enlightenment",
    "Industrial Revolution",
    "19th Century",
    "Early 20th Century",
    "Interwar",
    "Post-War",
    "Cold War",
    "Contemporary",
    "Roman",
    "Celtic",
    "Viking",
  ]),

  // Music genre
  ...buildGroup("music_genre", [
    "Techno",
    "House",
    "Electronic",
    "Jazz",
    "Classical",
    "Rock",
    "Pop",
    "Hip Hop",
    "R&B",
    "Folk",
    "World Music",
    "Latin",
    "Reggae",
    "Blues",
    "Metal",
    "Indie",
    "Punk",
    "Disco",
    "Ambient",
    "Drum and Bass",
  ]),

  // Facility
  ...buildGroup("facility", [
    "WiFi",
    "Parking",
    "Outdoor Seating",
    "Indoor Seating",
    "Wheelchair Accessible",
    "Pet Friendly",
    "Playground",
    "Restrooms",
    "Changing Table",
    "Air Conditioning",
    "Heating",
    "Elevator",
    "Bike Parking",
    "EV Charging",
    "Luggage Storage",
    "ATM",
    "Gift Shop",
    "Audio Guide",
    "Guided Tours",
    "Private Rooms",
  ]),

  // Dietary
  ...buildGroup("dietary", [
    "Vegetarian",
    "Vegan",
    "Halal",
    "Kosher",
    "Gluten-Free",
    "Lactose-Free",
    "Pescetarian",
    "Organic",
    "Raw Food",
    "Paleo",
    "Keto",
    "Low Carb",
    "Nut-Free",
    "Sugar-Free",
  ]),

  // Art medium
  ...buildGroup("art_medium", [
    "Oil Painting",
    "Watercolor",
    "Sculpture",
    "Photography",
    "Digital Art",
    "Installation",
    "Mixed Media",
    "Ceramics",
    "Textile Art",
    "Street Art",
    "Graffiti",
    "Mosaic",
    "Fresco",
    "Print",
    "Video Art",
    "Performance Art",
    "Glass Art",
    "Woodwork",
    "Metalwork",
  ]),

  // Best season
  ...buildGroup("best_season", [
    "Spring",
    "Summer",
    "Autumn",
    "Winter",
    "Year-Round",
    "Christmas Season",
    "Oktoberfest",
    "Cherry Blossom",
    "Harvest Season",
  ]),

  // Wildlife
  ...buildGroup("wildlife", [
    "Birds",
    "Deer",
    "Squirrels",
    "Fish",
    "Swans",
    "Ducks",
    "Foxes",
    "Hedgehogs",
    "Butterflies",
    "Bees",
    "Owls",
    "Bats",
  ]),

  // Product category (for shopping)
  ...buildGroup("product_category", [
    "Fashion",
    "Books",
    "Antiques",
    "Vintage",
    "Electronics",
    "Groceries",
    "Organic Food",
    "Wine",
    "Beer",
    "Crafts",
    "Jewelry",
    "Art Supplies",
    "Home Decor",
    "Toys",
    "Music",
    "Sports Equipment",
    "Souvenirs",
    "Flowers",
    "Farmers Market",
    "Flea Market",
  ]),

  // Cuisine (duplicated from cuisines table for tag-based search)
  ...buildGroup("cuisine", [
    "German",
    "Bavarian",
    "Italian",
    "French",
    "Spanish",
    "Greek",
    "Turkish",
    "Japanese",
    "Chinese",
    "Korean",
    "Thai",
    "Vietnamese",
    "Indian",
    "Mexican",
    "American",
    "Lebanese",
    "Ethiopian",
    "Persian",
    "Mediterranean",
    "Seafood",
    "Vegetarian",
    "Vegan",
    "Street Food",
    "Fine Dining",
    "Fast Food",
    "Fusion",
    "International",
  ]),
];

async function main() {
  console.log("Seeding tags...");

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < TAG_DATA.length; i += BATCH_SIZE) {
    const batch = TAG_DATA.slice(i, i + BATCH_SIZE);
    await db.insert(tags).values(batch).onConflictDoNothing();
    inserted += batch.length;
  }

  const groups = new Set(TAG_DATA.map((t) => t.group));
  for (const group of groups) {
    const count = TAG_DATA.filter((t) => t.group === group).length;
    console.log(`  ${group}: ${count} tags`);
  }

  console.log(`Tags seeded: ${inserted} total across ${groups.size} groups`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Tag seeding failed:", error);
  process.exit(1);
});
