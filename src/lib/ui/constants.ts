import type { CategorySlug } from "@/types/api";

/** SVG path for the Obelisk brand silhouette icon. */
export const OBELISK_ICON_PATH =
  "M 8,23 L 8,22.5 L 9,22.5 L 9,21.5 L 9.5,21.5 L 11.5,3.5 L 12,1 L 12.5,3.5 L 14.5,21.5 L 15,21.5 L 15,22.5 L 16,22.5 L 16,23 Z";

/** Default fallback color for uncategorized items. Matches --color-utility in globals.css. */
export const DEFAULT_CATEGORY_COLOR = "#8890A0";

/** Location marker blue. Must stay in sync with --color-location in globals.css. */
export const LOCATION_BLUE = "#3478F6";

/**
 * Maps category slugs to their emoji icons.
 */
export const CATEGORY_ICONS: Record<CategorySlug, string> = {
  food: "☕",
  history: "🏛️",
  art: "🎨",
  nature: "🌳",
  architecture: "🏗️",
  hidden: "✨",
  views: "👀",
  culture: "🎭",
  shopping: "🛍️",
  nightlife: "🌙",
  sports: "⚽",
  health: "🏥",
  transport: "🚇",
  education: "🎓",
  services: "🏢",
};
