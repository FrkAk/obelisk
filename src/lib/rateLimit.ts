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

/**
 * Extracts the client IP from a Request, checking forwarding headers.
 *
 * @param request - The incoming Request object.
 * @returns The client IP string.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
