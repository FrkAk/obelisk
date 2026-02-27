/**
 * Extracts city name from an address string.
 *
 * Args:
 *     address: Full address string (e.g., "Neuhauser Str. 2, 80331 Munich, Germany").
 *     fallback: Value to return if no city can be extracted.
 *
 * Returns:
 *     City name if found, fallback otherwise.
 */
export function extractCity(address?: string | null, fallback: string = ""): string {
  if (!address) return fallback;

  const parts = address.split(",").map((p) => p.trim());

  if (parts.length === 2) {
    const city = parts[1].replace(/^\d{4,5}\s*/, "").trim();
    return city || fallback;
  }

  if (parts.length >= 3) {
    const cityPart = parts[parts.length - 2];
    const city = cityPart.replace(/^\d{4,5}\s*/, "").trim();
    return city || fallback;
  }

  return fallback;
}
