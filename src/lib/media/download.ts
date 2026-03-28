/**
 * Downloads an image URL and returns its base64-encoded content.
 *
 * @param url - Image URL to download.
 * @param timeoutMs - Timeout in milliseconds (default 15s).
 * @returns Base64 string, or null on failure.
 */
export async function downloadToBase64(
  url: string,
  timeoutMs = 15_000,
): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  } catch {
    return null;
  }
}
