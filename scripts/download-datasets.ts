/**
 * Downloads all external datasets required for the enrichment pipeline.
 *
 * @module download-datasets
 */

import { existsSync, mkdirSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { createLogger } from "../src/lib/logger";

const log = createLogger("download-datasets");

const DATA_DIR = join(import.meta.dirname, "..", "data");
const FORCE = process.argv.includes("--force");

const TAGINFO_KEYS = [
  "shop",
  "amenity",
  "leisure",
  "tourism",
  "historic",
];

const TAGINFO_SUBTAGS = [
  "clothes",
  "cuisine",
  "sport",
  "beauty",
  "books",
  "shoes",
];

const WIKIDATA_SPARQL = `SELECT ?item ?itemLabel ?industryLabel ?productLabel WHERE {
  ?item wdt:P31/wdt:P279* wd:Q431289 .
  OPTIONAL { ?item wdt:P452 ?industry }
  OPTIONAL { ?item wdt:P1056 ?product }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 10000`;

/**
 * Checks if a file already exists and should be skipped.
 *
 * @param path - Absolute file path to check.
 * @returns True if the file exists and --force was not passed.
 */
function shouldSkip(path: string): boolean {
  if (FORCE) return false;
  if (existsSync(path)) {
    log.info(`SKIP ${path} (exists, use --force to re-download)`);
    return true;
  }
  return false;
}

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - Duration in milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Downloads a URL and saves the response body to a file.
 *
 * @param url - URL to fetch.
 * @param dest - Absolute path to write the response body.
 * @param headers - Optional extra headers to include.
 * @returns The number of bytes written.
 */
async function download(
  url: string,
  dest: string,
  headers?: Record<string, string>,
): Promise<number> {
  const res = await fetch(url, { headers, redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

/**
 * Formats a byte count as a human-readable string (e.g. "1.2 MB").
 *
 * @param bytes - Number of bytes.
 * @returns Formatted string with unit suffix.
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Downloads Google Product Taxonomy to data/google_product_taxonomy.txt.
 */
async function downloadGoogleTaxonomy(): Promise<void> {
  log.info("Google Product Taxonomy");
  const dest = join(DATA_DIR, "google_product_taxonomy.txt");
  if (shouldSkip(dest)) return;

  const bytes = await download(
    "https://www.google.com/basepages/producttype/taxonomy.en-US.txt",
    dest,
  );
  log.success(`Google Taxonomy OK ${formatBytes(bytes)}`);
}

/**
 * Downloads Name Suggestion Index (NSI) nsi.json and dissolved.json
 * from the npm package tarball.
 */
async function downloadNSI(): Promise<void> {
  log.info("Name Suggestion Index (NSI)");
  const nsiDir = join(DATA_DIR, "nsi");
  mkdirSync(nsiDir, { recursive: true });

  const nsiDest = join(nsiDir, "nsi.json");
  const dissolvedDest = join(nsiDir, "dissolved.json");

  if (shouldSkip(nsiDest) && shouldSkip(dissolvedDest)) return;

  log.info("Fetching npm registry for latest version...");
  const registryRes = await fetch(
    "https://registry.npmjs.org/name-suggestion-index/latest",
  );
  if (!registryRes.ok) {
    throw new Error(`npm registry returned HTTP ${registryRes.status}`);
  }
  const { version, dist } = (await registryRes.json()) as {
    version: string;
    dist: { tarball: string };
  };
  log.info(`Latest version: ${version}`);
  log.info("Downloading tarball...");

  const tarRes = await fetch(dist.tarball, { redirect: "follow" });
  if (!tarRes.ok) {
    throw new Error(`Tarball download returned HTTP ${tarRes.status}`);
  }
  const tarBuf = Buffer.from(await tarRes.arrayBuffer());
  log.info(`Tarball: ${formatBytes(tarBuf.length)}`);

  const tmpTar = join(DATA_DIR, "_nsi_tmp.tgz");
  writeFileSync(tmpTar, tarBuf);

  try {
    execSync(
      `tar xzf "${tmpTar}" -C "${DATA_DIR}" package/dist/json/nsi.json package/dist/wikidata/dissolved.json`,
      { stdio: "pipe" },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`tar extraction failed: ${msg}`);
  }

  const extractedNsi = join(DATA_DIR, "package", "dist", "json", "nsi.json");
  const extractedDissolved = join(
    DATA_DIR,
    "package",
    "dist",
    "wikidata",
    "dissolved.json",
  );

  const { renameSync, rmSync } = await import("fs");
  if (!shouldSkip(nsiDest)) {
    renameSync(extractedNsi, nsiDest);
    log.success(`NSI OK nsi.json ${formatBytes(statSync(nsiDest).size)}`);
  }
  if (!shouldSkip(dissolvedDest)) {
    renameSync(extractedDissolved, dissolvedDest);
    log.success(
      `NSI OK dissolved.json ${formatBytes(statSync(dissolvedDest).size)}`,
    );
  }

  rmSync(tmpTar, { force: true });
  rmSync(join(DATA_DIR, "package"), { recursive: true, force: true });
}

/**
 * Downloads OSM Taginfo value distributions for primary keys and subtags.
 * Adds a 1.5s delay between requests to be polite.
 */
async function downloadTaginfo(): Promise<void> {
  log.info("OSM Taginfo");
  const dir = join(DATA_DIR, "taginfo");
  mkdirSync(dir, { recursive: true });

  const allKeys = [...TAGINFO_KEYS, ...TAGINFO_SUBTAGS];

  for (const key of allKeys) {
    const dest = join(dir, `${key}.json`);
    if (shouldSkip(dest)) continue;

    const url = `https://taginfo.openstreetmap.org/api/4/key/values?key=${key}&sortname=count_all&sortorder=desc&page=1&rp=200&format=json`;
    const bytes = await download(url, dest);
    log.success(`Taginfo OK ${key}.json ${formatBytes(bytes)}`);

    if (key !== allKeys[allKeys.length - 1]) {
      await sleep(1500);
    }
  }
}

/**
 * Runs a SPARQL query against Wikidata to fetch brand/industry/product data.
 */
async function downloadWikidata(): Promise<void> {
  log.info("Wikidata Brand Data");
  const dest = join(DATA_DIR, "wikidata_brands.json");
  if (shouldSkip(dest)) return;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(WIKIDATA_SPARQL)}&format=json`;
  const bytes = await download(url, dest, {
    "User-Agent":
      "ObeliskBot/1.0 (https://github.com/obelisk; contact@obelisk.dev)",
  });
  log.success(`Wikidata OK ${formatBytes(bytes)}`);
}

/**
 * Downloads all external datasets required for the enrichment pipeline.
 * Runs all four downloads in parallel where safe.
 */
async function main(): Promise<void> {
  log.info("Downloading external datasets...");
  if (FORCE) log.info("--force: re-downloading all files");

  mkdirSync(DATA_DIR, { recursive: true });

  const TASK_NAMES = ["Google Taxonomy", "NSI", "Wikidata", "Taginfo"];
  const results = await Promise.allSettled([
    downloadGoogleTaxonomy(),
    downloadNSI(),
    downloadWikidata(),
    downloadTaginfo(),
  ]);

  const failures = results
    .map((r, i) =>
      r.status === "rejected" ? `${TASK_NAMES[i]}: ${r.reason}` : null,
    )
    .filter(Boolean);

  if (failures.length > 0) {
    for (const f of failures) log.error(f as string);
    throw new Error(`${failures.length} download(s) failed`);
  }

  log.success("All datasets downloaded.");
}

main().catch((err) => {
  log.error("Download failed:", err);
  process.exit(1);
});
