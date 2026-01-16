import "dotenv/config";
import { db } from "../src/lib/db";
import { pois, poiStories } from "../src/lib/db/schema";

interface SeedPoi {
  name: string;
  longitude: string;
  latitude: string;
  categories: string[];
  tags: Record<string, string>;
  wikipediaUrl?: string;
  descriptionRaw: string;
  story?: {
    title: string;
    teaser: string;
    content: string;
  };
}

const MUNICH_POIS: SeedPoi[] = [
  {
    name: "Karlsplatz (Stachus)",
    longitude: "11.5656",
    latitude: "48.1392",
    categories: ["plaza", "historical"],
    tags: { city: "Munich", type: "square" },
    wikipediaUrl: "https://en.wikipedia.org/wiki/Karlsplatz,_Munich",
    descriptionRaw:
      "Karlsplatz, commonly known as Stachus, is a large square in central Munich. The name Stachus comes from the most popular pub in the area during the 18th century.",
    story: {
      title: "The Nickname Mystery",
      teaser: "Why locals never say Karlsplatz",
      content:
        "No one in Munich calls this square by its official name. The nickname 'Stachus' outlived the tavern that inspired it by two centuries. Local legend says Eustachius Föderl's pub was so beloved that when King Karl Theodor renamed the square after himself in 1797, Münchners simply refused to comply.",
    },
  },
  {
    name: "Viktualienmarkt",
    longitude: "11.5767",
    latitude: "48.1352",
    categories: ["market", "food"],
    tags: { city: "Munich", type: "market" },
    wikipediaUrl: "https://en.wikipedia.org/wiki/Viktualienmarkt",
    descriptionRaw:
      "The Viktualienmarkt is a daily food market in Munich, Germany. It developed from an original farmers market to a market for gourmet food.",
    story: {
      title: "The Eternal Market",
      teaser: "200 years of fresh food",
      content:
        "Since 1807, generations of families have run these same stalls. The tradition runs so deep that some vendor families have passed down their spots for over six generations. The famous beer garden in the center rotates through Munich's six major breweries, changing taps every six weeks.",
    },
  },
  {
    name: "Frauenkirche",
    longitude: "11.5738",
    latitude: "48.1386",
    categories: ["church", "landmark"],
    tags: { city: "Munich", type: "cathedral", built: "1494" },
    wikipediaUrl: "https://en.wikipedia.org/wiki/Frauenkirche,_Munich",
    descriptionRaw:
      "The Frauenkirche (Cathedral of Our Dear Lady) is a church in the Bavarian city of Munich that serves as the cathedral of the Archdiocese of Munich and Freising.",
    story: {
      title: "The Devil's Footprint",
      teaser: "Look down at the entrance",
      content:
        "Legend has it that the architect made a deal with the devil: a church with no visible windows. Stand in the black footprint at the entrance and you'll see no windows - the pillars hide them perfectly. When the devil discovered the trick, he stamped his foot in rage, leaving the mark that remains today.",
    },
  },
  {
    name: "Marienplatz",
    longitude: "11.5755",
    latitude: "48.1374",
    categories: ["plaza", "historical"],
    tags: { city: "Munich", type: "square", established: "1158" },
    wikipediaUrl: "https://en.wikipedia.org/wiki/Marienplatz",
    descriptionRaw:
      "Marienplatz is a central square in the city center of Munich, Germany. It has been the city's main square since 1158.",
    story: {
      title: "The Grateful City",
      teaser: "A plague's end, frozen in gold",
      content:
        "The golden Virgin Mary atop the column wasn't always here. In 1638, after surviving Swedish occupation and plague, Munich erected this monument of gratitude. Every day at 11am and noon, the Glockenspiel performs a jousting tournament from 1568 - a victory that locals still celebrate 450 years later.",
    },
  },
  {
    name: "Hofbräuhaus",
    longitude: "11.5798",
    latitude: "48.1376",
    categories: ["beer hall", "historical"],
    tags: { city: "Munich", type: "brewery", established: "1589" },
    wikipediaUrl: "https://en.wikipedia.org/wiki/Hofbr%C3%A4uhaus_am_Platzl",
    descriptionRaw:
      "The Hofbräuhaus am Platzl is a beer hall in Munich, Germany, originally built in 1589. It is one of Munich's oldest beer halls.",
    story: {
      title: "The Royal Pint",
      teaser: "When dukes brewed their own",
      content:
        "Duke Wilhelm V built this brewery because he was tired of expensive imported beer. The Hofbräuhaus remained exclusively royal until 1828. Mozart drank here. Lenin planned revolution in its halls. Today, it still serves beer brewed according to the original 1589 recipe - strong, dark, and unmistakably Bavarian.",
    },
  },
  {
    name: "Englischer Garten",
    longitude: "11.5922",
    latitude: "48.1642",
    categories: ["park", "nature"],
    tags: { city: "Munich", type: "urban park", size: "375 hectares" },
    wikipediaUrl: "https://en.wikipedia.org/wiki/Englischer_Garten",
    descriptionRaw:
      "The Englischer Garten is a large public park in the centre of Munich stretching from the city centre to the northeastern city limits. It is one of the world's largest urban parks.",
    story: {
      title: "Bigger Than Central Park",
      teaser: "Munich's wild heart",
      content:
        "Few visitors realize this park is larger than Central Park and Hyde Park combined. Created in 1789, it was revolutionary: a royal hunting ground opened to commoners. Today, surfers ride an artificial wave at the Eisbach, nudists sunbathe freely, and over 7,500 people gather at the Chinese Tower beer garden on summer evenings.",
    },
  },
  {
    name: "Residenz München",
    longitude: "11.5792",
    latitude: "48.1414",
    categories: ["palace", "museum"],
    tags: { city: "Munich", type: "palace", rooms: "130" },
    wikipediaUrl: "https://en.wikipedia.org/wiki/Munich_Residenz",
    descriptionRaw:
      "The Munich Residenz is the former royal palace of the Bavarian monarchs in the center of Munich. It is the largest city palace in Germany.",
    story: {
      title: "The Lucky Lion",
      teaser: "Rub it for fortune",
      content:
        "At the entrance stands a bronze lion shield that locals touch for luck. The lions' noses gleam gold from centuries of hopeful hands. Inside lie 130 rooms spanning 600 years of Bavarian royalty, from medieval fortress to Renaissance palace to Baroque splendor - each generation adding their mark to Germany's largest city palace.",
    },
  },
  {
    name: "Alte Pinakothek",
    longitude: "11.5700",
    latitude: "48.1483",
    categories: ["museum", "art"],
    tags: { city: "Munich", type: "art museum", founded: "1836" },
    wikipediaUrl: "https://en.wikipedia.org/wiki/Alte_Pinakothek",
    descriptionRaw:
      "The Alte Pinakothek is an art museum in Munich, Germany. It is one of the oldest galleries in the world and houses one of the most famous collections of Old Master paintings.",
    story: {
      title: "The King's Collection",
      teaser: "500 years of masterpieces",
      content:
        "King Ludwig I built this temple to art because his collection outgrew his palace. Dürer, Rubens, Rembrandt - works that other museums would kill for hang casually on these walls. The building itself survived WWII bombs but was intentionally left partially unrestored, its brick patches a reminder that beauty can emerge from destruction.",
    },
  },
];

async function seedPois() {
  console.log("Seeding POIs...\n");

  for (const poiData of MUNICH_POIS) {
    const existing = await db.query.pois.findFirst({
      where: (pois, { eq }) => eq(pois.name, poiData.name),
    });

    if (existing) {
      console.log(`  Skipping "${poiData.name}" (already exists)`);
      continue;
    }

    const [poi] = await db
      .insert(pois)
      .values({
        source: "seed",
        name: poiData.name,
        longitude: poiData.longitude,
        latitude: poiData.latitude,
        categories: poiData.categories,
        tags: poiData.tags,
        wikipediaUrl: poiData.wikipediaUrl,
        descriptionRaw: poiData.descriptionRaw,
      })
      .returning();

    console.log(`  Created POI: "${poi.name}"`);

    if (poiData.story) {
      await db.insert(poiStories).values({
        poiId: poi.id,
        storyType: "discovery",
        title: poiData.story.title,
        teaser: poiData.story.teaser,
        content: poiData.story.content,
      });
      console.log(`    Added story: "${poiData.story.title}"`);
    }
  }

  console.log("\nPOI seeding complete!");
  console.log(`  Total POIs: ${MUNICH_POIS.length}`);
  console.log(`  Location: Munich, Germany`);
  console.log(`  Center: 48.137, 11.576 (Marienplatz area)`);
}

seedPois()
  .catch((error) => {
    console.error("POI seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
