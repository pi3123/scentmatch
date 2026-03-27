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

  const getCount = (tab: string) =>
    tab === "all" ? collection.length : collection.filter((c) => c.status === tab).length;

  return (
    <div className="mx-auto max-w-[1280px] px-16 pt-[54px] py-12">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-display text-[30px] font-medium text-brown">
          Your Collection
        </h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-[12px] uppercase tracking-[0.125em] font-medium py-2 px-5 border border-brown rounded text-brown hover:bg-brown hover:text-cream-50 transition"
        >
          {showAdd ? "Cancel" : "Add Fragrance"}
        </button>
      </div>

      {/* Add fragrance modal */}
      {showAdd && (
        <div className="mt-4 rounded-xl border border-cream-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm text-brown-mid">Add as:</label>
            {["own", "tried", "want"].map((s) => (
              <button
                key={s}
                onClick={() => setAddStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  addStatus === s
                    ? "bg-brown text-cream-50"
                    : "bg-cream-200 text-brown-mid hover:bg-cream-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <SearchBar onSelect={handleAdd} />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-6 py-2.5 border-b border-cream-200 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`border-none bg-transparent cursor-pointer pb-1 text-[12px] uppercase tracking-[0.125em] font-medium transition ${
              filter === tab
                ? "text-brown border-b-[1.5px] border-b-brown"
                : "text-brown-light hover:text-brown-mid"
            }`}
          >
            {tab} ({getCount(tab)})
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-brown-mid">
            {collection.length === 0
              ? "Your collection is empty"
              : "No fragrances match this filter."}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-2.5"
          style={{
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gridAutoRows: "270px",
          }}
        >
          {filtered.map((item, index) => (
            <div
              key={item.fragranceId}
              className={index === 0 ? "feat h-full" : "h-full"}
              style={index === 0 ? { gridRow: "1 / 3" } : undefined}
            >
              <FragranceCard
                item={item}
                onRemove={handleRemove}
                featured={index === 0}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
