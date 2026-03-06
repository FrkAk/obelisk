const THUMB_WIDTH = 800;
const TIMEOUT_MS = 10_000;
const REQUEST_DELAY_MS = 200;

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - Duration to sleep.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Resolves a Commons filename to a thumbnail URL via the MediaWiki API.
 *
 * @param filename - Commons filename (e.g. "Example.jpg").
 * @returns Thumbnail URL at THUMB_WIDTH, or null on failure.
 */
export async function commonsFileToThumb(
  filename: string,
): Promise<string | null> {
  const title = `File:${decodeURIComponent(filename.replace(/ /g, "_"))}`;
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query` +
    `&titles=${encodeURIComponent(title)}` +
    `&prop=imageinfo&iiprop=url&iiurlwidth=${THUMB_WIDTH}&format=json`;

  try {
    await sleep(REQUEST_DELAY_MS);
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      query: {
        pages: Record<
          string,
          { imageinfo?: Array<{ thumburl?: string }> }
        >;
      };
    };

    const pages = Object.values(data.query.pages);
    return pages[0]?.imageinfo?.[0]?.thumburl ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches the first image from a Wikimedia Commons category.
 *
 * @param category - Category name (e.g. "St. Ulrich (Munich)").
 * @returns Thumbnail URL of the first file in the category, or null.
 */
export async function commonsCategoryToThumb(
  category: string,
): Promise<string | null> {
  const cmTitle = `Category:${decodeURIComponent(category.replace(/ /g, "_"))}`;
  const listUrl =
    `https://commons.wikimedia.org/w/api.php?action=query` +
    `&list=categorymembers&cmtitle=${encodeURIComponent(cmTitle)}` +
    `&cmtype=file&cmlimit=1&format=json`;

  try {
    await sleep(REQUEST_DELAY_MS);
    const res = await fetch(listUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      query: { categorymembers: Array<{ title: string }> };
    };

    const firstFile = data.query.categorymembers[0]?.title;
    if (!firstFile) return null;

    const filename = firstFile.replace(/^File:/, "");
    return commonsFileToThumb(filename);
  } catch {
    return null;
  }
}

/**
 * Resolves a wikimedia_commons OSM tag to a thumbnail URL.
 * Handles both "File:xxx.jpg" and "Category:xxx" formats.
 *
 * @param commonsTag - Raw wikimedia_commons tag value.
 * @returns Thumbnail URL, or null on failure.
 */
export async function resolveCommonsTag(
  commonsTag: string,
): Promise<string | null> {
  if (commonsTag.startsWith("File:")) {
    return commonsFileToThumb(commonsTag.replace(/^File:/, ""));
  }
  if (commonsTag.startsWith("Category:")) {
    return commonsCategoryToThumb(commonsTag.replace(/^Category:/, ""));
  }
  return commonsFileToThumb(commonsTag);
}

/**
 * Queries Wikidata for the P18 (image) property and resolves it to a thumbnail.
 *
 * @param wikidataId - Wikidata entity ID (e.g. "Q270746").
 * @returns Thumbnail URL, or null if no P18 claim exists.
 */
export async function wikidataToThumb(
  wikidataId: string,
): Promise<string | null> {
  const url =
    `https://www.wikidata.org/w/api.php?action=wbgetentities` +
    `&ids=${encodeURIComponent(wikidataId)}&props=claims&format=json`;

  try {
    await sleep(REQUEST_DELAY_MS);
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      entities: Record<
        string,
        {
          claims: Record<
            string,
            Array<{
              mainsnak: { datavalue?: { value?: string } };
            }>
          >;
        }
      >;
    };

    const entity = data.entities[wikidataId];
    const filename = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!filename) return null;

    return commonsFileToThumb(filename);
  } catch {
    return null;
  }
}

/**
 * Resolves a wiki image URL from a POI's OSM tags.
 * Tries wikimedia_commons tag first, then wikidata P18 fallback.
 *
 * @param osmTags - Raw OSM tags from the POI.
 * @returns Resolved thumbnail URL and source, or null.
 */
export async function resolveWikiImage(
  osmTags: Record<string, string>,
): Promise<{ url: string; source: string } | null> {
  const commonsTag = osmTags["wikimedia_commons"];
  if (commonsTag) {
    const thumb = await resolveCommonsTag(commonsTag);
    if (thumb) return { url: thumb, source: "commons" };
  }

  const wikidataId = osmTags["wikidata"];
  if (wikidataId) {
    const thumb = await wikidataToThumb(wikidataId);
    if (thumb) return { url: thumb, source: "wikidata" };
  }

  return null;
}
