"use client";

import { useCallback, useEffect, useState } from "react";
import { FragranceCard } from "@/components/fragrance-card";
import { SearchBar } from "@/components/search-bar";
import type { CollectionItem, FragranceResult } from "@/types";

const tabs = ["all", "own", "tried", "want"] as const;

export default function CollectionPage() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addStatus, setAddStatus] = useState<string>("own");

  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch("/api/collection");
      if (res.ok) setCollection(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleAdd = async (fragrance: FragranceResult) => {
    await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fragranceId: fragrance.id, status: addStatus }),
    });
    setShowAdd(false);
    fetchCollection();
  };

  const handleRemove = async (fragranceId: number) => {
    await fetch("/api/collection", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fragranceId }),
    });
    setCollection((prev) => prev.filter((c) => c.fragranceId !== fragranceId));
  };

  const filtered =
    filter === "all" ? collection : collection.filter((c) => c.status === filter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-warm-800">
            My Collection
          </h1>
          <p className="mt-1 text-sm text-warm-600">
            {collection.length} fragrance{collection.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-xl bg-warm-700 px-4 py-2 text-sm font-medium text-cream-50 transition-colors hover:bg-warm-800"
        >
          {showAdd ? "Cancel" : "+ Add Fragrance"}
        </button>
      </div>

      {showAdd && (
        <div className="mt-4 rounded-xl border border-cream-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm text-warm-600">Add as:</label>
            {["own", "tried", "want"].map((s) => (
              <button
                key={s}
                onClick={() => setAddStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  addStatus === s
                    ? "bg-warm-700 text-cream-50"
                    : "bg-cream-200 text-warm-600 hover:bg-cream-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <SearchBar onSelect={handleAdd} />
        </div>
      )}

      <div className="mt-6 flex gap-1 border-b border-cream-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? "border-warm-700 text-warm-800"
                : "border-transparent text-warm-600 hover:text-warm-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-300 border-t-warm-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">&#128218;</p>
          <p className="mt-3 text-sm text-warm-600">
            {collection.length === 0
              ? "Your collection is empty. Add some fragrances!"
              : "No fragrances match this filter."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <FragranceCard
              key={item.fragranceId}
              item={item}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
