import { db } from "../src/lib/db/client";
import { cuisines } from "../src/lib/db/schema";

interface CuisineEntry {
  slug: string;
  name: string;
  region: string;
  parentSlug?: string;
  icon?: string;
}

const CUISINE_DATA: CuisineEntry[] = [
  { slug: "german", name: "German", region: "european", icon: "🇩🇪" },
  { slug: "bavarian", name: "Bavarian", region: "european", parentSlug: "german", icon: "🥨" },
  { slug: "franconian", name: "Franconian", region: "european", parentSlug: "german" },
  { slug: "swabian", name: "Swabian", region: "european", parentSlug: "german" },
  { slug: "italian", name: "Italian", region: "european", icon: "🇮🇹" },
  { slug: "pizza", name: "Pizza", region: "european", parentSlug: "italian", icon: "🍕" },
  { slug: "pasta", name: "Pasta", region: "european", parentSlug: "italian", icon: "🍝" },
  { slug: "gelato", name: "Gelato", region: "european", parentSlug: "italian", icon: "🍦" },
  { slug: "french", name: "French", region: "european", icon: "🇫🇷" },
  { slug: "crepes", name: "Crêpes", region: "european", parentSlug: "french" },
  { slug: "spanish", name: "Spanish", region: "european", icon: "🇪🇸" },
  { slug: "tapas", name: "Tapas", region: "european", parentSlug: "spanish" },
  { slug: "greek", name: "Greek", region: "european", icon: "🇬🇷" },
  { slug: "portuguese", name: "Portuguese", region: "european", icon: "🇵🇹" },
  { slug: "austrian", name: "Austrian", region: "european", icon: "🇦🇹" },
  { slug: "swiss", name: "Swiss", region: "european", icon: "🇨🇭" },
  { slug: "british", name: "British", region: "european", icon: "🇬🇧" },
  { slug: "irish", name: "Irish", region: "european", icon: "🇮🇪" },
  { slug: "dutch", name: "Dutch", region: "european" },
  { slug: "belgian", name: "Belgian", region: "european" },
  { slug: "scandinavian", name: "Scandinavian", region: "european" },
  { slug: "swedish", name: "Swedish", region: "european", parentSlug: "scandinavian" },
  { slug: "polish", name: "Polish", region: "european", icon: "🇵🇱" },
  { slug: "czech", name: "Czech", region: "european" },
  { slug: "hungarian", name: "Hungarian", region: "european" },
  { slug: "russian", name: "Russian", region: "european", icon: "🇷🇺" },
  { slug: "ukrainian", name: "Ukrainian", region: "european" },
  { slug: "croatian", name: "Croatian", region: "european" },
  { slug: "serbian", name: "Serbian", region: "european" },
  { slug: "bosnian", name: "Bosnian", region: "european" },
  { slug: "romanian", name: "Romanian", region: "european" },
  { slug: "bulgarian", name: "Bulgarian", region: "european" },
  { slug: "georgian", name: "Georgian", region: "european" },
  { slug: "mediterranean", name: "Mediterranean", region: "european" },

  { slug: "japanese", name: "Japanese", region: "east_asian", icon: "🇯🇵" },
  { slug: "sushi", name: "Sushi", region: "east_asian", parentSlug: "japanese", icon: "🍣" },
  { slug: "ramen", name: "Ramen", region: "east_asian", parentSlug: "japanese", icon: "🍜" },
  { slug: "udon", name: "Udon", region: "east_asian", parentSlug: "japanese" },
  { slug: "tempura", name: "Tempura", region: "east_asian", parentSlug: "japanese" },
  { slug: "yakitori", name: "Yakitori", region: "east_asian", parentSlug: "japanese" },
  { slug: "chinese", name: "Chinese", region: "east_asian", icon: "🇨🇳" },
  { slug: "cantonese", name: "Cantonese", region: "east_asian", parentSlug: "chinese" },
  { slug: "sichuan", name: "Sichuan", region: "east_asian", parentSlug: "chinese" },
  { slug: "dim_sum", name: "Dim Sum", region: "east_asian", parentSlug: "chinese" },
  { slug: "korean", name: "Korean", region: "east_asian", icon: "🇰🇷" },
  { slug: "bbq", name: "BBQ", region: "east_asian", parentSlug: "korean" },
  { slug: "taiwanese", name: "Taiwanese", region: "east_asian" },
  { slug: "mongolian", name: "Mongolian", region: "east_asian" },

  { slug: "thai", name: "Thai", region: "southeast_asian", icon: "🇹🇭" },
  { slug: "vietnamese", name: "Vietnamese", region: "southeast_asian", icon: "🇻🇳" },
  { slug: "pho", name: "Pho", region: "southeast_asian", parentSlug: "vietnamese" },
  { slug: "indonesian", name: "Indonesian", region: "southeast_asian" },
  { slug: "malaysian", name: "Malaysian", region: "southeast_asian" },
  { slug: "filipino", name: "Filipino", region: "southeast_asian" },
  { slug: "singaporean", name: "Singaporean", region: "southeast_asian" },
  { slug: "burmese", name: "Burmese", region: "southeast_asian" },

  { slug: "indian", name: "Indian", region: "south_asian", icon: "🇮🇳" },
  { slug: "curry", name: "Curry", region: "south_asian", parentSlug: "indian", icon: "🍛" },
  { slug: "tandoori", name: "Tandoori", region: "south_asian", parentSlug: "indian" },
  { slug: "biryani", name: "Biryani", region: "south_asian", parentSlug: "indian" },
  { slug: "pakistani", name: "Pakistani", region: "south_asian" },
  { slug: "sri_lankan", name: "Sri Lankan", region: "south_asian" },
  { slug: "nepali", name: "Nepali", region: "south_asian" },
  { slug: "bangladeshi", name: "Bangladeshi", region: "south_asian" },
  { slug: "afghan", name: "Afghan", region: "south_asian" },

  { slug: "turkish", name: "Turkish", region: "middle_eastern", icon: "🇹🇷" },
  { slug: "kebab", name: "Kebab", region: "middle_eastern", parentSlug: "turkish", icon: "🥙" },
  { slug: "doner", name: "Döner", region: "middle_eastern", parentSlug: "turkish" },
  { slug: "lahmacun", name: "Lahmacun", region: "middle_eastern", parentSlug: "turkish" },
  { slug: "lebanese", name: "Lebanese", region: "middle_eastern", icon: "🇱🇧" },
  { slug: "falafel", name: "Falafel", region: "middle_eastern", parentSlug: "lebanese" },
  { slug: "hummus", name: "Hummus", region: "middle_eastern", parentSlug: "lebanese" },
  { slug: "persian", name: "Persian", region: "middle_eastern" },
  { slug: "iraqi", name: "Iraqi", region: "middle_eastern" },
  { slug: "syrian", name: "Syrian", region: "middle_eastern" },
  { slug: "israeli", name: "Israeli", region: "middle_eastern" },
  { slug: "arab", name: "Arab", region: "middle_eastern" },
  { slug: "yemeni", name: "Yemeni", region: "middle_eastern" },

  { slug: "african", name: "African", region: "african" },
  { slug: "ethiopian", name: "Ethiopian", region: "african", parentSlug: "african" },
  { slug: "eritrean", name: "Eritrean", region: "african", parentSlug: "african" },
  { slug: "moroccan", name: "Moroccan", region: "african", parentSlug: "african" },
  { slug: "egyptian", name: "Egyptian", region: "african", parentSlug: "african" },
  { slug: "nigerian", name: "Nigerian", region: "african", parentSlug: "african" },
  { slug: "south_african", name: "South African", region: "african", parentSlug: "african" },
  { slug: "tunisian", name: "Tunisian", region: "african", parentSlug: "african" },
  { slug: "senegalese", name: "Senegalese", region: "african", parentSlug: "african" },

  { slug: "american", name: "American", region: "american", icon: "🇺🇸" },
  { slug: "burger", name: "Burger", region: "american", parentSlug: "american", icon: "🍔" },
  { slug: "steak", name: "Steak", region: "american", parentSlug: "american", icon: "🥩" },
  { slug: "hot_dog", name: "Hot Dog", region: "american", parentSlug: "american", icon: "🌭" },
  { slug: "soul_food", name: "Soul Food", region: "american", parentSlug: "american" },
  { slug: "cajun", name: "Cajun", region: "american", parentSlug: "american" },
  { slug: "tex_mex", name: "Tex-Mex", region: "american", parentSlug: "american" },
  { slug: "hawaiian", name: "Hawaiian", region: "american", parentSlug: "american" },
  { slug: "mexican", name: "Mexican", region: "latin_american", icon: "🇲🇽" },
  { slug: "tacos", name: "Tacos", region: "latin_american", parentSlug: "mexican", icon: "🌮" },
  { slug: "burrito", name: "Burrito", region: "latin_american", parentSlug: "mexican", icon: "🌯" },
  { slug: "brazilian", name: "Brazilian", region: "latin_american", icon: "🇧🇷" },
  { slug: "peruvian", name: "Peruvian", region: "latin_american" },
  { slug: "argentinian", name: "Argentinian", region: "latin_american" },
  { slug: "colombian", name: "Colombian", region: "latin_american" },
  { slug: "cuban", name: "Cuban", region: "latin_american" },
  { slug: "caribbean", name: "Caribbean", region: "latin_american" },
  { slug: "jamaican", name: "Jamaican", region: "latin_american", parentSlug: "caribbean" },

  { slug: "coffee", name: "Coffee", region: "global", icon: "☕" },
  { slug: "tea", name: "Tea", region: "global", icon: "🍵" },
  { slug: "bubble_tea", name: "Bubble Tea", region: "global", parentSlug: "tea", icon: "🧋" },
  { slug: "juice", name: "Juice", region: "global", icon: "🧃" },
  { slug: "smoothie", name: "Smoothie", region: "global", parentSlug: "juice" },
  { slug: "ice_cream", name: "Ice Cream", region: "global", icon: "🍨" },
  { slug: "bakery", name: "Bakery", region: "global", icon: "🥐" },
  { slug: "pastry", name: "Pastry", region: "global", parentSlug: "bakery" },
  { slug: "cake", name: "Cake", region: "global", parentSlug: "bakery", icon: "🎂" },
  { slug: "chocolate", name: "Chocolate", region: "global", icon: "🍫" },
  { slug: "dessert", name: "Dessert", region: "global", icon: "🍮" },
  { slug: "donut", name: "Donut", region: "global", parentSlug: "bakery", icon: "🍩" },

  { slug: "vegetarian", name: "Vegetarian", region: "global", icon: "🥗" },
  { slug: "vegan", name: "Vegan", region: "global", icon: "🌱" },
  { slug: "organic", name: "Organic", region: "global" },
  { slug: "raw_food", name: "Raw Food", region: "global" },
  { slug: "seafood", name: "Seafood", region: "global", icon: "🦐" },
  { slug: "fish", name: "Fish", region: "global", parentSlug: "seafood", icon: "🐟" },
  { slug: "fish_and_chips", name: "Fish and Chips", region: "global", parentSlug: "seafood" },
  { slug: "sausage", name: "Sausage", region: "global", icon: "🌭" },
  { slug: "chicken", name: "Chicken", region: "global", icon: "🍗" },
  { slug: "wings", name: "Wings", region: "global", parentSlug: "chicken" },
  { slug: "fried_chicken", name: "Fried Chicken", region: "global", parentSlug: "chicken" },
  { slug: "noodles", name: "Noodles", region: "global", icon: "🍜" },
  { slug: "rice", name: "Rice", region: "global" },
  { slug: "salad", name: "Salad", region: "global", icon: "🥗" },
  { slug: "sandwich", name: "Sandwich", region: "global", icon: "🥪" },
  { slug: "wrap", name: "Wrap", region: "global", parentSlug: "sandwich" },
  { slug: "soup", name: "Soup", region: "global" },
  { slug: "fondue", name: "Fondue", region: "global", parentSlug: "swiss" },
  { slug: "creole", name: "Creole", region: "global" },
  { slug: "fusion", name: "Fusion", region: "global" },
  { slug: "international", name: "International", region: "global" },
  { slug: "regional", name: "Regional", region: "global" },
  { slug: "local", name: "Local", region: "global" },
  { slug: "street_food", name: "Street Food", region: "global" },
  { slug: "fast_food", name: "Fast Food", region: "global", icon: "🍟" },
  { slug: "fine_dining", name: "Fine Dining", region: "global" },
  { slug: "brunch", name: "Brunch", region: "global" },
  { slug: "breakfast", name: "Breakfast", region: "global" },
];

/**
 * Seeds the cuisine taxonomy into the database.
 * Inserts top-level cuisines first, then children with parent references.
 */
async function main() {
  console.log("Seeding cuisines...");

  const parentSlugs = new Set(CUISINE_DATA.filter((c) => c.parentSlug).map((c) => c.parentSlug!));
  const topLevel = CUISINE_DATA.filter((c) => !c.parentSlug);
  const children = CUISINE_DATA.filter((c) => c.parentSlug);

  const missingParents = [...parentSlugs].filter(
    (ps) => !topLevel.some((t) => t.slug === ps) && !children.some((c) => c.slug === ps),
  );
  if (missingParents.length > 0) {
    console.warn("Warning: parent slugs referenced but not defined:", missingParents);
  }

  const BATCH_SIZE = 50;

  for (let i = 0; i < topLevel.length; i += BATCH_SIZE) {
    const batch = topLevel.slice(i, i + BATCH_SIZE);
    await db.insert(cuisines).values(batch).onConflictDoNothing();
  }
  console.log(`  Inserted ${topLevel.length} top-level cuisines`);

  for (let i = 0; i < children.length; i += BATCH_SIZE) {
    const batch = children.slice(i, i + BATCH_SIZE);
    await db.insert(cuisines).values(batch).onConflictDoNothing();
  }
  console.log(`  Inserted ${children.length} child cuisines`);

  console.log(`Cuisines seeded: ${CUISINE_DATA.length} total`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Cuisine seeding failed:", error);
  process.exit(1);
});
