/**
 * Validates that a string is a well-formed HTTP(S) URL.
 *
 * @param url - The string to validate.
 * @returns true if the string is a valid http: or https: URL.
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
