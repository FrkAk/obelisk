import { assertPublicUrl } from "@/lib/net/ssrf";

const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Downloads an image URL and returns its base64-encoded content.
 * Rejects responses larger than 10MB.
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
    await assertPublicUrl(url);
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_DOWNLOAD_BYTES) return null;

    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_DOWNLOAD_BYTES) {
        reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    return Buffer.from(Buffer.concat(chunks)).toString("base64");
  } catch {
    return null;
  }
}
