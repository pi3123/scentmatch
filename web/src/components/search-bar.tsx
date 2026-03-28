"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FragranceResult } from "@/types";

export function SearchBar({
  onSelect,
}: {
  onSelect: (fragrance: FragranceResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FragranceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/fragrances?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
      setActiveIndex(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (fragrance: FragranceResult) => {
    onSelect(fragrance);
    setOpen(false);
    setQuery(`${fragrance.name} - ${fragrance.brand}`);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev < results.length - 1 ? prev + 1 : 0;
        scrollToItem(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev > 0 ? prev - 1 : results.length - 1;
        scrollToItem(next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const scrollToItem = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-light"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a fragrance to score..."
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-controls="search-listbox"
          className="w-full rounded-md border border-cream-200 bg-white py-3.5 pl-11 pr-4 text-sm font-normal text-brown shadow-[0_2px_12px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-brown-light placeholder:text-[14px] hover:border-brown-light hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] focus:border-brown-light"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cream-200 border-t-brown" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          id="search-listbox"
          role="listbox"
          className="absolute z-40 mt-1.5 max-h-72 w-full overflow-y-auto rounded-lg border border-cream-200 bg-white py-1 shadow-lg"
        >
          {results.map((f, i) => (
            <li key={f.id} id={`search-option-${i}`} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onClick={() => handleSelect(f)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIndex ? "bg-cream-100" : "hover:bg-cream-100"
                }`}
              >
                {f.imageUrl ? (
                  <img
                    src={f.imageUrl}
                    alt=""
                    className="h-10 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-8 items-center justify-center rounded bg-cream-200 text-xs text-brown-light">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brown">
                    {f.name}
                  </p>
                  <p className="truncate text-xs text-brown-mid">
                    {f.brand}
                    {f.year ? ` (${f.year})` : ""}
                  </p>
                </div>
                {f.ratingValue && (
                  <span className="text-xs text-brown-light">
                    {f.ratingValue.toFixed(1)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
