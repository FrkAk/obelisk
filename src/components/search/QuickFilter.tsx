"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { springTransitions } from "@/lib/ui/animations";
import type { CategorySlug } from "@/types";
import { CATEGORY_COLORS } from "@/types";

interface QuickFilterProps {
  category: CategorySlug;
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}


/**
 * Quick filter pill for category filtering.
 *
 * Args:
 *     category: The category slug.
 *     icon: Emoji icon to display.
 *     label: Display label.
 *     active: Whether filter is active.
 *     onClick: Click handler.
 */
export function QuickFilter({
  category,
  icon,
  label,
  active = false,
  onClick,
}: QuickFilterProps) {
  const color = CATEGORY_COLORS[category];

  return (
    <motion.button
      className={clsx(
        "inline-flex items-center gap-2 px-3.5 py-2 rounded-full font-medium text-[14px]",
        "transition-all duration-200",
        active
          ? "text-white"
          : "glass-thin hover:bg-black/5 dark:hover:bg-white/5"
      )}
      style={
        active
          ? {
              background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -30)})`,
              boxShadow: `0 4px 12px ${color}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
            }
          : {
              color,
              boxShadow: "inset 0 0.5px 0 var(--glass-border-highlight)",
            }
      }
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={springTransitions.quick}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}

interface QuickFiltersProps {
  activeCategory?: CategorySlug;
  onCategoryChange?: (category: CategorySlug | undefined) => void;
}

const FILTER_OPTIONS: Array<{ category: CategorySlug; icon: string; label: string }> = [
  { category: "food", icon: "☕", label: "Café" },
  { category: "history", icon: "🏛️", label: "History" },
  { category: "nature", icon: "🌳", label: "Nature" },
  { category: "art", icon: "🎨", label: "Art" },
  { category: "architecture", icon: "🏗️", label: "Buildings" },
  { category: "views", icon: "👀", label: "Views" },
];

/**
 * Row of quick filter pills for category selection.
 *
 * Args:
 *     activeCategory: Currently active category.
 *     onCategoryChange: Callback when category changes.
 */
export function QuickFilters({
  activeCategory,
  onCategoryChange,
}: QuickFiltersProps) {
  const handleClick = (category: CategorySlug) => {
    if (activeCategory === category) {
      onCategoryChange?.(undefined);
    } else {
      onCategoryChange?.(category);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {FILTER_OPTIONS.map((option) => (
        <QuickFilter
          key={option.category}
          category={option.category}
          icon={option.icon}
          label={option.label}
          active={activeCategory === option.category}
          onClick={() => handleClick(option.category)}
        />
      ))}
    </div>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
