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
  const ref = useRef<HTMLDivElement>(null);
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
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(value), 300);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-600"
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
          placeholder="Search for a fragrance to score..."
          className="w-full rounded-xl border border-cream-300 bg-white py-3 pl-10 pr-4 text-sm text-warm-800 shadow-sm outline-none transition-shadow placeholder:text-cream-400 focus:border-cream-400 focus:ring-2 focus:ring-cream-200"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cream-300 border-t-warm-600" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-40 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-cream-200 bg-white py-1 shadow-lg">
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(f);
                  setOpen(false);
                  setQuery(`${f.name} - ${f.brand}`);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-cream-100"
              >
                {f.imageUrl ? (
                  <img
                    src={f.imageUrl}
                    alt=""
                    className="h-10 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-8 items-center justify-center rounded bg-cream-200 text-xs text-warm-600">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-warm-800">
                    {f.name}
                  </p>
                  <p className="truncate text-xs text-warm-600">
                    {f.brand}
                    {f.year ? ` (${f.year})` : ""}
                  </p>
                </div>
                {f.ratingValue && (
                  <span className="text-xs text-cream-500">
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
