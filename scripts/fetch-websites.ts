import { db } from "../src/lib/db/client";
import { pois } from "../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { processWithConcurrency } from "./lib/concurrency";
import { createLogger, formatEta } from "../src/lib/logger";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("fetch-websites");

const BATCH_SIZE = 300;
const CONCURRENCY = 50;
const TIMEOUT_MS = 10_000;
const MAX_TEXT_PER_PAGE = 3000;
const MAX_COMBINED_TEXT = 8000;
const MAX_SUBPAGES = 3;
const BATCH_COOLDOWN_MS = 2_000;
const FORCE = process.argv.includes("--force");

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SKIP_EXTENSIONS = new Set([
  ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico",
  ".css", ".js", ".xml", ".json", ".zip", ".mp3", ".mp4", ".woff",
  ".woff2", ".ttf", ".eot",
]);

const SKIP_PATH_SEGMENTS = [
  "login", "signin", "signup", "register", "cart", "checkout", "warenkorb",
  "feed", "rss", "sitemap", "wp-admin", "wp-json", "api/", "cdn-cgi",
];

/**
 * Checks whether a URL path should be skipped based on extension or path segment.
 *
 * @param pathname - URL pathname to check.
 * @returns True if the URL should be skipped.
 */
function shouldSkipUrl(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  for (const ext of SKIP_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  for (const seg of SKIP_PATH_SEGMENTS) {
    if (lower.includes(seg)) return true;
  }
  return false;
}

/**
 * Fetches a URL and returns the HTML body text.
 *
 * @param url - URL to fetch.
 * @returns HTML string or null on failure.
 */
interface FailureStats {
  connect: number;
  http403: number;
  httpOther: number;
  ssl: number;
  timeout: number;
  other: number;
}

/** Batch-level failure counters, reset each batch. */
let batchFailures: FailureStats = { connect: 0, http403: 0, httpOther: 0, ssl: 0, timeout: 0, other: 0 };

/**
 * Resets batch failure counters.
 */
function resetBatchFailures(): void {
  batchFailures = { connect: 0, http403: 0, httpOther: 0, ssl: 0, timeout: 0, other: 0 };
}

/**
 * Formats batch failure stats into a compact summary string.
 *
 * @param stats - Failure counters for the batch.
 * @returns Formatted string like "98 connect, 52 HTTP 403, 14 SSL".
 */
function formatFailures(stats: FailureStats): string {
  const parts: string[] = [];
  if (stats.connect) parts.push(`${stats.connect} connect`);
  if (stats.http403) parts.push(`${stats.http403} HTTP 403`);
  if (stats.httpOther) parts.push(`${stats.httpOther} HTTP other`);
  if (stats.ssl) parts.push(`${stats.ssl} SSL`);
  if (stats.timeout) parts.push(`${stats.timeout} timeout`);
  if (stats.other) parts.push(`${stats.other} other`);
  return parts.join(", ");
}

/**
 * Fetches a URL and returns the HTML body text.
 *
 * @param url - URL to fetch.
 * @returns HTML string or null on failure.
 */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) {
      if (res.status === 403) batchFailures.http403++;
      else batchFailures.httpOther++;
      return null;
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    return await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timeout") || msg.includes("abort")) batchFailures.timeout++;
    else if (msg.includes("Unable to connect") || msg.includes("ECONNREFUSED")) batchFailures.connect++;
    else if (msg.includes("certificate") || msg.includes("TLS") || msg.includes("SSL")) batchFailures.ssl++;
    else batchFailures.other++;
    return null;
  }
}

/**
 * Extracts readable text from HTML using Mozilla Readability.
 *
 * @param html - Raw HTML string.
 * @returns Extracted plain text truncated to MAX_TEXT_PER_PAGE, or null if extraction fails.
 */
function extractText(html: string): string | null {
  try {
    const { document } = parseHTML(html);
    const reader = new Readability(document);
    const article = reader.parse();
    if (!article?.textContent) return null;
    const text = article.textContent.replace(/\s+/g, " ").trim();
    if (text.length < 50) return null;
    return text.slice(0, MAX_TEXT_PER_PAGE);
  } catch {
    return null;
  }
}

interface ScoredLink {
  url: string;
  score: number;
}

/**
 * Extracts and scores internal links from HTML for subpage crawling.
 * Scores are based on path depth, DOM position, and nav/header ancestry.
 *
 * @param html - Raw HTML string.
 * @param baseUrl - Base URL for resolving relative links.
 * @returns Array of scored internal links, sorted by score descending.
 */
function extractScoredLinks(html: string, baseUrl: string): ScoredLink[] {
  try {
    const { document } = parseHTML(html);
    const base = new URL(baseUrl);
    const anchors = document.querySelectorAll("a[href]");
    const seen = new Set<string>();
    const links: ScoredLink[] = [];

    for (let i = 0; i < anchors.length; i++) {
      const href = anchors[i].getAttribute("href");
      if (!href) continue;

      let resolved: URL;
      try {
        resolved = new URL(href, baseUrl);
      } catch {
        continue;
      }

      if (resolved.hostname !== base.hostname) continue;
      if (resolved.pathname === "/" || resolved.pathname === base.pathname) continue;
      if (shouldSkipUrl(resolved.pathname)) continue;
      if (resolved.pathname.length > 100) continue;

      const canonical = resolved.origin + resolved.pathname;
      if (seen.has(canonical)) continue;
      seen.add(canonical);

      let score = 0;
      const depth = resolved.pathname.split("/").filter(Boolean).length;
      score += Math.max(0, 4 - depth);
      score += Math.max(0, 3 - i * 0.02);

      let parent = anchors[i].parentElement;
      while (parent) {
        const tag = parent.tagName?.toLowerCase();
        if (tag === "nav" || tag === "header") {
          score += 2;
          break;
        }
        parent = parent.parentElement;
      }

      links.push({ url: canonical, score });
    }

    return links.sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

/**
 * Attempts to fetch subpage URLs from the site's sitemap.xml as a fallback.
 *
 * @param baseUrl - Site base URL.
 * @returns Array of subpage URLs sorted by priority, or empty array.
 */
async function fetchSitemapUrls(baseUrl: string): Promise<string[]> {
  const base = new URL(baseUrl);
  const sitemapUrl = `${base.origin}/sitemap.xml`;

  const xml = await fetchHtml(sitemapUrl);
  if (!xml) return [];

  const isSitemapIndex = xml.includes("<sitemapindex");
  if (isSitemapIndex) {
    const childMatch = xml.match(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/);
    if (!childMatch) return [];
    const childXml = await fetchHtml(childMatch[1]);
    if (!childXml) return [];
    return parseSitemapLocs(childXml, base);
  }

  return parseSitemapLocs(xml, base);
}

/**
 * Parses <loc> entries from sitemap XML and filters to same-host URLs.
 *
 * @param xml - Sitemap XML content.
 * @param base - Base URL for hostname filtering.
 * @returns Array of URLs sorted by priority descending.
 */
function parseSitemapLocs(xml: string, base: URL): string[] {
  const entries: Array<{ url: string; priority: number }> = [];
  const locRegex = /<url>\s*<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>(?:\s*<[^>]+>[^<]*<\/[^>]+>)*?\s*(?:<priority>\s*([^<]*)\s*<\/priority>)?/g;

  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    const priority = match[2] ? parseFloat(match[2]) : 0.5;
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== base.hostname) continue;
      if (parsed.pathname === "/") continue;
      if (shouldSkipUrl(parsed.pathname)) continue;
      entries.push({ url, priority });
    } catch {
      continue;
    }
  }

  return entries
    .sort((a, b) => b.priority - a.priority)
    .map((e) => e.url);
}

/**
 * Crawls a POI website: fetches homepage, extracts text, finds subpages
 * via link scoring (with sitemap fallback), and combines all text.
 *
 * @param websiteUrl - Homepage URL to start crawling from.
 * @returns Combined text from homepage + subpages, or null on failure.
 */
async function crawlWebsite(websiteUrl: string): Promise<string | null> {
  const homepageHtml = await fetchHtml(websiteUrl);
  if (!homepageHtml) return null;

  const texts: string[] = [];
  const homepageText = extractText(homepageHtml);
  if (homepageText) texts.push(homepageText);

  const scoredLinks = extractScoredLinks(homepageHtml, websiteUrl);
  let subpageUrls = scoredLinks.slice(0, MAX_SUBPAGES).map((l) => l.url);

  if (subpageUrls.length < 2) {
    const sitemapUrls = await fetchSitemapUrls(websiteUrl);
    if (sitemapUrls.length > 0) {
      subpageUrls = sitemapUrls.slice(0, MAX_SUBPAGES);
    }
  }

  for (const url of subpageUrls) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const text = extractText(html);
    if (text) texts.push(text);
  }

  if (texts.length === 0) return null;

  const combined = texts.join("\n\n").replace(/\u0000/g, "");
  return combined.slice(0, MAX_COMBINED_TEXT);
}

/**
 * Normalizes a website URL to ensure it has a protocol prefix.
 *
 * @param url - Raw URL string, possibly without protocol.
 * @returns URL with https:// prefix if missing.
 */
function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

interface PoiRow {
  id: string;
  name: string;
  websiteUrl: string;
  profile: PoiProfile | null;
}

/**
 * Crawls POI websites and stores extracted text in profile.websiteText.
 * Nulls embedding to trigger re-generation.
 */
async function main() {
  log.info(`Starting website fetch (force=${FORCE})...`);

  const allPois: PoiRow[] = (
    await db
      .select({
        id: pois.id,
        name: pois.name,
        osmTags: pois.osmTags,
        profile: pois.profile,
      })
      .from(pois)
      .where(
        sql`osm_tags->>'website' IS NOT NULL
         OR osm_tags->>'contact:website' IS NOT NULL
         OR osm_tags->>'url' IS NOT NULL`,
      )
  ).map((row) => {
    const tags = row.osmTags as Record<string, string> | null;
    const websiteUrl = tags?.website ?? tags?.["contact:website"] ?? tags?.url ?? "";
    return {
      id: row.id,
      name: row.name,
      websiteUrl,
      profile: row.profile as PoiProfile | null,
    };
  });

  const toFetch = FORCE
    ? allPois
    : allPois.filter((p) => !p.profile?.websiteText);

  log.info(`Found ${allPois.length} POIs with website URLs, ${toFetch.length} need fetching`);

  let fetched = 0;
  let failed = 0;
  const startMs = Date.now();

  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    resetBatchFailures();

    const results = await processWithConcurrency(batch, CONCURRENCY, async (poi) => {
      const url = normalizeUrl(poi.websiteUrl);
      const text = await crawlWebsite(url);

      if (!text) {
        return { status: "failed" as const, poiId: poi.id };
      }

      const profile: PoiProfile = poi.profile ?? {
        keywords: [],
        products: [],
        summary: "",
        enrichmentSource: "seed",
        attributes: {},
      };

      return {
        status: "fetched" as const,
        poiId: poi.id,
        profile: { ...profile, websiteText: text },
      };
    });

    const toUpdate = results.filter((r) => r.status === "fetched" && r.profile != null) as Array<{
      status: "fetched";
      poiId: string;
      profile: PoiProfile;
    }>;

    if (toUpdate.length > 0) {
      await db.transaction(async (tx) => {
        for (const item of toUpdate) {
          await tx
            .update(pois)
            .set({
              profile: item.profile,
              embedding: null,
              updatedAt: sql`now()`,
            })
            .where(eq(pois.id, item.poiId));
        }
      });
    }

    for (const r of results) {
      if (r.status === "fetched") fetched++;
      else failed++;
    }

    const done = Math.min(i + BATCH_SIZE, toFetch.length);
    const batchFailed = batch.length - toUpdate.length;
    const failSummary = batchFailed > 0 ? ` (${formatFailures(batchFailures)})` : "";
    log.info(`${formatEta(startMs, done, toFetch.length)} — ${toUpdate.length} fetched, ${batchFailed} failed${failSummary}`);

    if (done < toFetch.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_COOLDOWN_MS));
    }
  }

  log.info("");
  log.info("--- Website Fetch Summary ---");
  log.info(`Total: ${toFetch.length} | Fetched: ${fetched} | Failed: ${failed}`);

  process.exit(0);
}

main().catch((error) => {
  log.error("Website fetch failed:", error);
  process.exit(1);
});
