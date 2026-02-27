import type { CategorySlug } from "@/types/api";

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
