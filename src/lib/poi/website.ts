import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { POI_USER_AGENT } from "@/lib/poi/enrichment";
import { assertPublicUrl } from "@/lib/net/ssrf";

const TIMEOUT_MS = 10_000;
const MAX_TEXT_PER_PAGE = 3000;
const MAX_COMBINED_TEXT = 8000;
const MAX_SUBPAGES = 3;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

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
async function fetchHtml(url: string): Promise<string | null> {
  try {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      headers: { "User-Agent": POI_USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
  } catch {
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
 * Crawls a POI website: fetches homepage, extracts text, finds subpages
 * via link scoring (with sitemap fallback), and combines all text.
 *
 * @param websiteUrl - Homepage URL to start crawling from.
 * @returns Combined text from homepage + subpages, or null on failure.
 */
export async function crawlWebsite(websiteUrl: string): Promise<string | null> {
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
export function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}
