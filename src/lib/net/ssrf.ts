import { createLogger } from "@/lib/logger";

const log = createLogger("ssrf");

const PRIVATE_IP_RANGES = [
  /^127\./, // 127.0.0.0/8 loopback
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^169\.254\./, // 169.254.0.0/16 link-local
  /^0\./, // 0.0.0.0/8
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // 100.64.0.0/10 CGN
  /^240\./, // 240.0.0.0/4 reserved
  /^255\.255\.255\.255$/, // broadcast
  /^198\.1[89]\./, // 198.18.0.0/15 benchmarking
];

const PRIVATE_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
]);

/**
 * Checks whether an IP address belongs to a private or reserved range.
 *
 * @param ip - IP address string to check.
 * @returns True if the IP is private/reserved.
 */
function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }
  return PRIVATE_IP_RANGES.some((re) => re.test(ip));
}

/**
 * Validates that a URL points to a public host, rejecting private/reserved IPs and non-http(s) schemes.
 * Throws if the URL is unsafe for server-side fetching.
 *
 * @param url - URL string to validate.
 * @throws Error if the URL targets a private network or uses a disallowed scheme.
 */
export async function assertPublicUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Disallowed URL scheme: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (PRIVATE_HOSTNAMES.has(hostname.toLowerCase())) {
    throw new Error(`Blocked private hostname: ${hostname}`);
  }

  if (isPrivateIp(hostname)) {
    throw new Error(`Blocked private IP: ${hostname}`);
  }

  try {
    const { resolve4, resolve6 } = await import("node:dns/promises");
    const ips: string[] = [];

    try {
      ips.push(...(await resolve4(hostname)));
    } catch { /* no A records */ }

    try {
      ips.push(...(await resolve6(hostname)));
    } catch { /* no AAAA records */ }

    for (const ip of ips) {
      if (isPrivateIp(ip)) {
        log.warn(`DNS rebinding blocked: ${hostname} resolved to private IP ${ip}`);
        throw new Error(`Blocked private IP from DNS: ${hostname} -> ${ip}`);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Blocked")) throw err;
    // If DNS resolution fails entirely, allow the fetch to proceed and fail naturally
  }
}
