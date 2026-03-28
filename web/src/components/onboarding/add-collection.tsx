"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import type { FragranceResult } from "@/types";

interface PopularFragrance {
  id: number;
  name: string;
  brand: string;
  imageUrl: string | null;
  ratingValue: number | null;
}

const REQUIRED_ADDS = 4;

export function OnboardingAddCollection({ onDone }: { onDone: () => void }) {
  const [popular, setPopular] = useState<PopularFragrance[]>([]);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [statusPicker, setStatusPicker] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPopular = useCallback(async () => {
    try {
      const res = await fetch("/api/fragrances/popular");
      if (res.ok) setPopular(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopular();
  }, [fetchPopular]);

  const addToCollection = async (fragranceId: number, status: string) => {
    await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fragranceId, status }),
    });
    setAdded((prev) => new Set(prev).add(fragranceId));
    setStatusPicker(null);
  };

  const handleSearchSelect = (fragrance: FragranceResult) => {
    setStatusPicker(fragrance.id);
  };

  const progress = Math.min(added.size / REQUIRED_ADDS, 1);
  const showDone = added.size >= REQUIRED_ADDS;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 text-brown">
      {/* Progress bar */}
      <div className="fixed left-0 top-0 z-50 h-[3px] w-full">
        <div
          className="h-full bg-gradient-to-r from-amber to-[#d4b87a] transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mx-auto max-w-[720px] px-6 py-12">
        {/* Header */}
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-[family-name:var(--font-heading)] text-[28px] font-medium text-brown">
            Add Your Fragrances
          </h2>
          <span className="text-[11px] font-medium uppercase tracking-[0.125em] text-brown-light">
            {added.size} of {REQUIRED_ADDS}
          </span>
        </div>
        <p className="mb-6 text-[14px] text-brown-mid">
          Tap a fragrance to add it, or search for something specific.
        </p>

        {/* Search bar */}
        <div className="mb-8 max-w-[480px]">
          <SearchBar onSelect={handleSearchSelect} />
        </div>

        {/* Popular grid */}
        <div className="grid grid-cols-4 gap-4">
          {popular.map((frag) => (
            <div key={frag.id} className="relative">
              <button
                onClick={() =>
                  added.has(frag.id) ? null : setStatusPicker(frag.id)
                }
                className={`group flex w-full flex-col items-center rounded-lg border p-4 text-center transition-all ${
                  added.has(frag.id)
                    ? "border-sage/30 bg-sage/5"
                    : "border-cream-200 bg-white hover:border-brown-light hover:shadow-md"
                }`}
              >
                {added.has(frag.id) && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-sage text-[11px] text-white">
                    &#10003;
                  </div>
                )}
                {frag.imageUrl ? (
                  <img
                    src={frag.imageUrl}
                    alt=""
                    className="mb-3 h-[80px] w-auto object-contain"
                  />
                ) : (
                  <div className="mb-3 h-[80px] w-[56px] rounded bg-cream-200" />
                )}
                <p className="text-[12px] font-medium text-brown leading-tight">
                  {frag.name}
                </p>
                <p className="text-[10px] text-brown-light">{frag.brand}</p>
              </button>

              {/* Status picker popover */}
              {statusPicker === frag.id && (
                <div className="absolute left-1/2 top-full z-10 mt-1 flex -translate-x-1/2 gap-1 rounded-lg border border-cream-200 bg-white p-2 shadow-lg">
                  {["own", "tried", "want"].map((status) => (
                    <button
                      key={status}
                      onClick={() => addToCollection(frag.id, status)}
                      className="rounded px-3 py-1.5 text-[11px] font-medium capitalize text-brown transition-colors hover:bg-cream-100"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Done button */}
        {showDone && (
          <div className="mt-8 text-center">
            <button
              onClick={onDone}
              className="rounded-lg bg-brown px-8 py-3 text-[13px] font-medium tracking-[0.05em] text-cream-50 transition-colors hover:bg-[#2a2218]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
