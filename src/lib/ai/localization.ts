const LANG_CODE_TO_NAME: Record<string, string> = {
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  nl: "Dutch",
  pt: "Portuguese",
  tr: "Turkish",
  el: "Greek",
  ja: "Japanese",
  pl: "Polish",
  cs: "Czech",
  hu: "Hungarian",
  sv: "Swedish",
  da: "Danish",
  fi: "Finnish",
  no: "Norwegian",
  ru: "Russian",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
};

/**
 * Maps a language code to its human-readable name.
 *
 * Args:
 *     code: ISO 639-1 language code (e.g., "de", "fr").
 *
 * Returns:
 *     Language name (e.g., "German"), or "English" if code is unknown.
 */
export function getLanguageName(code: string): string {
  return LANG_CODE_TO_NAME[code] ?? "English";
}

export interface LocaleInfo {
  language: string;
  country: string;
  code: string;
  expressions: string[];
  idioms: string[];
}

const FALLBACK_LOCALE: LocaleInfo = {
  language: "English",
  country: "Unknown",
  code: "en",
  expressions: [],
  idioms: [],
};

const LOCALE_REGISTRY: Record<string, LocaleInfo> = {
  germany: {
    language: "German",
    country: "Germany",
    code: "de",
    expressions: ["Mahlzeit!", "gemütlich", "Feierabend", "Doch!", "genau", "Servus", "Stammtisch", "Na?"],
    idioms: ["Da steppt der Bär", "Ordnung muss sein", "Das ist nicht mein Bier", "Wer rastet, der rostet"],
  },
  austria: {
    language: "German",
    country: "Austria",
    code: "at",
    expressions: ["Schmäh", "leiwand", "Heuriger", "Oida", "Jause", "Sudern", "Grantiger", "Bitteschön"],
    idioms: ["Die Lage ist hoffnungslos, aber nicht ernst", "Schau ma mal", "A schöne Leich"],
  },
  italy: {
    language: "Italian",
    country: "Italy",
    code: "it",
    expressions: ["Fare bella figura", "Boh!", "Magari!", "Dai!", "Arrangiarsi", "Passeggiata", "Che figata!", "Mamma mia"],
    idioms: ["Chi va piano, va sano e va lontano", "In bocca al lupo!", "L'arte di non fare niente"],
  },
  türkiye: {
    language: "Turkish",
    country: "Türkiye",
    code: "tr",
    expressions: ["Kolay gelsin", "Afiyet olsun", "Inshallah", "Yavaş yavaş", "Geçmiş olsun", "Vallahi", "Keyif", "Çay?"],
    idioms: ["Nazar değmesin", "Bir fincan kahvenin kırk yıl hatırı vardır", "Komşu komşunun külüne muhtaçtır"],
  },
  turkey: {
    language: "Turkish",
    country: "Türkiye",
    code: "tr",
    expressions: ["Kolay gelsin", "Afiyet olsun", "Inshallah", "Yavaş yavaş", "Geçmiş olsun", "Vallahi", "Keyif", "Çay?"],
    idioms: ["Nazar değmesin", "Bir fincan kahvenin kırk yıl hatırı vardır", "Komşu komşunun külüne muhtaçtır"],
  },
  france: {
    language: "French",
    country: "France",
    code: "fr",
    expressions: ["Voilà", "Bon courage", "N'importe quoi", "Flemme", "Apéro", "Bof", "Dépaysement", "Ça va?"],
    idioms: ["Métro, boulot, dodo", "Avoir le cafard", "L'appel du vide", "Reculer pour mieux sauter"],
  },
  spain: {
    language: "Spanish",
    country: "Spain",
    code: "es",
    expressions: ["Venga", "Sobremesa", "Madrugada", "Tío/Tía", "Mola", "Quedamos?", "Botellón", "Currar"],
    idioms: ["No pasa nada", "Ir de cañas", "Buen rollo", "A buen entendedor, pocas palabras bastan"],
  },
  netherlands: {
    language: "Dutch",
    country: "Netherlands",
    code: "nl",
    expressions: ["Gezellig", "Lekker", "Doe maar normaal", "Borrel", "Uitwaaien", "Even", "Ja hoor", "Nee hoor"],
    idioms: ["Niet lullen maar poetsen", "Nu komt de aap uit de mouw", "Doe maar gewoon, dan doe je al gek genoeg"],
  },
  greece: {
    language: "Greek",
    country: "Greece",
    code: "gr",
    expressions: ["Siga siga", "Kefi", "Pame!", "Filotimo", "Meraki", "Ela!", "Yamas!", "Ftou ftou ftou"],
    idioms: ["Tou chronou", "O logos einai logos", "Ton kairo sou"],
  },
  portugal: {
    language: "Portuguese",
    country: "Portugal",
    code: "pt",
    expressions: ["Saudade", "Desenrascar", "Bora!", "Fixe", "Tasca", "Tranquilo", "Fado"],
    idioms: ["Água mole em pedra dura, tanto bate até que fura", "Quem não tem cão, caça com gato", "Devagar se vai ao longe"],
  },
  japan: {
    language: "Japanese",
    country: "Japan",
    code: "jp",
    expressions: ["Otsukaresama desu", "Shoganai", "Natsukashii", "Mendokusai", "Wabi-sabi", "Nomikai", "Otsumami", "Itadakimasu"],
    idioms: ["Nana korobi ya oki", "Ichi-go ichi-e", "Deru kugi wa utareru"],
  },
};

/**
 * Extracts country name from an address string.
 *
 * Args:
 *     address: Full address string (e.g., "Neuhauser Str. 2, 80331 Munich, Germany").
 *
 * Returns:
 *     Country name if found, null otherwise.
 */
function extractCountryFromAddress(address: string): string | null {
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length < 2) return null;
  const lastPart = parts[parts.length - 1].replace(/^\d+\s*/, "");
  return lastPart.length >= 2 ? lastPart : null;
}

/**
 * Detects the locale for a POI based on address or coordinates.
 * Tries address parsing first, then Mapbox reverse geocoding as fallback.
 *
 * Args:
 *     address: POI address string.
 *     latitude: POI latitude.
 *     longitude: POI longitude.
 *
 * Returns:
 *     The detected LocaleInfo for the region.
 */
export async function detectLocale(
  address?: string | null,
  latitude?: number,
  longitude?: number
): Promise<LocaleInfo> {
  if (address) {
    const country = extractCountryFromAddress(address);
    if (country) {
      const locale = LOCALE_REGISTRY[country.toLowerCase()];
      if (locale) return locale;
    }
  }

  if (latitude !== undefined && longitude !== undefined) {
    const locale = await reverseGeocodeCountry(latitude, longitude);
    if (locale) return locale;
  }

  return FALLBACK_LOCALE;
}

/**
 * Uses Mapbox reverse geocoding to determine the country from coordinates.
 *
 * Args:
 *     latitude: Latitude coordinate.
 *     longitude: Longitude coordinate.
 *
 * Returns:
 *     LocaleInfo if country is found in registry, null otherwise.
 */
async function reverseGeocodeCountry(
  latitude: number,
  longitude: number
): Promise<LocaleInfo | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=country&access_token=${token}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const data = await response.json();
    const countryName: string | undefined = data.features?.[0]?.text;
    if (!countryName) return null;

    return LOCALE_REGISTRY[countryName.toLowerCase()] ?? null;
  } catch {
    return null;
  }
}

/**
 * Builds a language instruction block for story generation prompts.
 * Provides curated examples but encourages the LLM to use its own knowledge.
 *
 * Args:
 *     locale: The detected locale for the POI region.
 *
 * Returns:
 *     A prompt string with language and localization instructions.
 */
export function buildLanguagePrompt(locale: LocaleInfo): string {
  if (locale.code === "en") {
    return "LANGUAGE: Write your response entirely in English.";
  }

  const expressionSample = locale.expressions
    .slice(0, 5)
    .map((e) => `"${e}"`)
    .join(", ");

  const idiomSample = locale.idioms
    .slice(0, 2)
    .map((e) => `"${e}"`)
    .join(", ");

  return `LANGUAGE & LOCAL FLAVOR: This place is in ${locale.country} where people speak ${locale.language}. Any background info may be in ${locale.language} — read and understand all of it fully.

Write primarily in English, but sound like a real bilingual local:
- Use well-known ${locale.language} words where they fit naturally, like: ${expressionSample}
- You can reference local sayings like: ${idiomSample}
- These are just examples — use your own knowledge of ${locale.language} expressions and cultural references too
- Keep local terms that have no good English translation (food names, cultural concepts, greetings)
- Proper nouns stay in their original language
- Don't force it — only use local words where a bilingual person naturally would`;
}
