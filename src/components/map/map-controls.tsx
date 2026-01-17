"use client";

import Link from "next/link";
import { User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { MapControlStack } from "./map-control-stack";
import { SearchPill } from "./search-pill";
import { cn } from "@/lib/utils";

/**
 * Map controls overlay with Apple Maps-inspired layout.
 *
 * Layout:
 *   - Top-left: Obelisk logo (compact)
 *   - Top-center: Search pill
 *   - Top-right: User menu
 *   - Right edge: Vertical control stack
 *
 * Returns:
 *     React component rendering map control overlays.
 */
export function MapControls() {
  const { data: user } = trpc.auth.me.useQuery();

  return (
    <>
      {/* Top-left: Obelisk logo */}
      <div className="absolute left-4 top-4 z-10">
        <div className="glass rounded-xl border border-white/20 px-3 py-2 shadow-elevated">
          <h1 className="text-base font-semibold tracking-tight">Obelisk</h1>
        </div>
      </div>

      {/* Top-center: Search pill */}
      <div className="absolute left-1/2 -translate-x-1/2 top-4 z-40">
        <SearchPill />
      </div>

      {/* Top-right: User menu */}
      <div className="absolute right-4 top-4 z-30">
        {user ? (
          <div className="flex items-center gap-1 glass rounded-xl border border-white/20 p-1 shadow-elevated">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-lg",
                "hover:bg-black/5 dark:hover:bg-white/10",
                "transition-all duration-200",
                "active:scale-95"
              )}
              asChild
            >
              <Link href="/remarks/new">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Create Remark</span>
              </Link>
            </Button>
            <div className="w-px h-5 bg-black/10 dark:bg-white/10" />
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-lg",
                "hover:bg-black/5 dark:hover:bg-white/10",
                "transition-all duration-200",
                "active:scale-95"
              )}
              asChild
            >
              <Link href="/profile">
                <User className="h-4 w-4" />
                <span className="sr-only">Profile</span>
              </Link>
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "glass h-10 rounded-xl",
              "border border-black/15 dark:border-white/30 px-4",
              "shadow-elevated hover:shadow-lg",
              "transition-all duration-200",
              "active:scale-[0.98]",
              "text-foreground font-medium"
            )}
            asChild
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
        )}
      </div>

      {/* Right edge: Vertical control stack */}
      <div className="absolute right-4 bottom-6 z-10">
        <MapControlStack />
      </div>
    </>
  );
}
