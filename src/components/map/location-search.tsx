"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchResult {
  placeId: number;
  displayName: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  onSelect: (longitude: number, latitude: number, zoom?: number) => void;
}

export function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            "User-Agent": "Obelisk/1.0",
          },
        }
      );
      const data = await response.json();
      setResults(
        data.map((item: { place_id: number; display_name: string; lat: string; lon: string }) => ({
          placeId: item.place_id,
          displayName: item.display_name,
          lat: item.lat,
          lon: item.lon,
        }))
      );
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        search(value);
      }, 300);
    },
    [search]
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect(parseFloat(result.lon), parseFloat(result.lat), 15);
      setQuery(result.displayName.split(",")[0]);
      setIsOpen(false);
      setResults([]);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute left-4 top-16 z-10 w-80 max-w-[calc(100vw-2rem)]"
    >
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search locations..."
          className="glass h-11 rounded-xl border-white/20 pl-10 pr-10 shadow-elevated transition-all duration-200 focus:border-primary/50 focus:shadow-lg"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="mt-2 max-h-64 overflow-auto rounded-xl glass border border-white/20 shadow-elevated animate-scale-in">
          {results.map((result, index) => (
            <button
              key={result.placeId}
              onClick={() => handleSelect(result)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/5 ${
                index !== results.length - 1 ? "border-b border-black/5 dark:border-white/5" : ""
              }`}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm leading-snug">{result.displayName}</span>
            </button>
          ))}
        </div>
      )}
      {isOpen && isLoading && (
        <div className="mt-2 rounded-xl glass border border-white/20 px-4 py-3 text-sm text-muted-foreground shadow-elevated animate-scale-in">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Searching...
          </div>
        </div>
      )}
    </div>
  );
}
