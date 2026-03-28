interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let callCount = 0;

/**
 * Checks whether a request from the given IP exceeds the rate limit.
 *
 * @param ip - Client IP address.
 * @param max - Maximum number of requests allowed in the window.
 * @param windowMs - Sliding window duration in milliseconds.
 * @returns true if the request is allowed, false if rate limited.
 */
export function checkRateLimit(
  ip: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();

  callCount++;
  if (callCount % 100 === 0) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  const key = `${ip}:${max}:${windowMs}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count++;
  return bucket.count <= max;
}

// TODO: This in-memory rate limiter does not share state across multiple
// serverless/edge instances. For production at scale, replace with a
// Redis-backed implementation (e.g., @upstash/ratelimit). Sufficient for
// a single Node.js/Bun process.

const TRUST_PROXY = process.env.TRUST_PROXY ?? "";

/**
 * Extracts the client IP from a Request, checking forwarding headers
 * only when a trusted proxy is configured via TRUST_PROXY env var.
 *
 * @param request - The incoming Request object.
 * @returns The client IP string.
 */
export function getClientIp(request: Request): string {
  if (TRUST_PROXY === "cloudflare") {
    const cfIp = request.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
  }

  if (TRUST_PROXY === "cloudflare" || TRUST_PROXY === "nginx" || TRUST_PROXY === "proxy") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  }

  return "unknown";
}
