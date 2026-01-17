"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, MapPin, Clock, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/stores/map-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  type: "recent" | "nearby" | "place" | "story";
  description?: string;
  latitude: number;
  longitude: number;
}

interface SearchPillProps {
  className?: string;
}

/**
 * Expandable search pill component (Apple Maps style).
 *
 * Args:
 *     className: Additional CSS classes.
 *
 * Returns:
 *     React component rendering a search pill that expands to modal.
 */
export function SearchPill({ className }: SearchPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { setViewState, viewState } = useMapStore();
  const { toast } = useToast();

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    setQuery("");
    setResults([]);
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      const searchResults: SearchResult[] = data.map(
        (item: { place_id: number; display_name: string; lat: string; lon: string; type: string }) => ({
          id: item.place_id.toString(),
          name: item.display_name.split(",")[0],
          type: "place" as const,
          description: item.display_name.split(",").slice(1, 3).join(",").trim(),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        })
      );

      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
      toast({
        title: "Search unavailable",
        description: "Could not connect to search service. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, handleSearch]);

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      setViewState({
        ...viewState,
        latitude: result.latitude,
        longitude: result.longitude,
        zoom: 16,
      });
      handleCollapse();
    },
    [viewState, setViewState, handleCollapse]
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        handleCollapse();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isExpanded, handleCollapse]);

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "recent":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "nearby":
        return <Compass className="h-4 w-4 text-primary" />;
      case "story":
        return <MapPin className="h-4 w-4 text-primary" />;
      default:
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      {!isExpanded && (
        <button
          onClick={handleExpand}
          className={cn(
            "glass rounded-full",
            "border border-black/15 dark:border-white/30",
            "shadow-elevated",
            "px-5 py-2.5",
            "flex items-center gap-2",
            "transition-all duration-300",
            "hover:shadow-lg hover:scale-[1.02]",
            "active:scale-[0.98]",
            className
          )}
        >
          <Search className="h-4 w-4 text-foreground/70" />
          <span className="text-sm text-foreground/70">Search places...</span>
        </button>
      )}

      {isExpanded && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-scale-in"
            onClick={handleCollapse}
          />

          <div
            className={cn(
              "fixed inset-x-4 top-4 z-50",
              "glass-ultra rounded-2xl",
              "border border-black/10 dark:border-white/20",
              "shadow-xl",
              "overflow-hidden",
              "animate-fade-scale-in"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-3 border-b border-black/5 dark:border-white/10">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places, addresses..."
                className={cn(
                  "flex-1 bg-transparent",
                  "text-base outline-none",
                  "placeholder:text-muted-foreground/80"
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCollapse}
                className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading && (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted animate-shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded-full bg-muted animate-shimmer" />
                        <div className="h-3 w-1/2 rounded-full bg-muted animate-shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && results.length === 0 && query && (
                <div className="p-8 text-center">
                  <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No places found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="py-2">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3",
                        "hover:bg-black/5 dark:hover:bg-white/5",
                        "transition-colors duration-150",
                        "text-left"
                      )}
                    >
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/50">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.name}</p>
                        {result.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!isLoading && !query && (
                <div className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Suggestions
                  </p>
                  <div className="space-y-1">
                    {["Restaurants nearby", "Parks", "Museums"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setQuery(suggestion)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                          "hover:bg-black/5 dark:hover:bg-white/5",
                          "transition-colors duration-150",
                          "text-left"
                        )}
                      >
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
