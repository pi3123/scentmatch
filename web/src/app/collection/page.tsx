"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const addStatusRef = useRef(addStatus);
  addStatusRef.current = addStatus;

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
      body: JSON.stringify({ fragranceId: fragrance.id, status: addStatusRef.current }),
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
        <h1 className="font-heading text-[30px] font-medium text-brown">
          Your Collection
        </h1>
        <button
          onClick={() => { if (!showAdd) setAddStatus("own"); setShowAdd(!showAdd); }}
          className="text-[12px] uppercase tracking-[0.125em] font-medium py-2 px-5 border border-brown rounded text-brown hover:bg-brown hover:text-cream-50 transition"
        >
          {showAdd ? "Cancel" : "Add Fragrance"}
        </button>
      </div>

      {/* Add fragrance — inline panel that slides into the page */}
      {showAdd && (
        <div className="mt-4 mb-2 rounded-lg border border-cream-200 bg-white px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-brown-mid">Add as</span>
              {["own", "tried", "want"].map((s) => (
                <button
                  key={s}
                  onClick={() => setAddStatus(s)}
                  className={`rounded px-3 py-1 text-[11px] uppercase tracking-[0.05em] font-medium capitalize transition-colors ${
                    addStatus === s
                      ? "bg-brown text-cream-50"
                      : "bg-cream-100 text-brown-mid hover:bg-cream-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex-1">
              <SearchBar onSelect={handleAdd} />
            </div>
          </div>
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
        <div className="flex flex-col items-center py-20">
          <div className="flex gap-3 mb-6 opacity-30">
            <div className="h-20 w-14 rounded bg-cream-200" />
            <div className="h-24 w-14 rounded bg-cream-200" />
            <div className="h-20 w-14 rounded bg-cream-200" />
          </div>
          <p className="text-[15px] font-medium text-brown-mid">
            {collection.length === 0
              ? "Start building your collection"
              : `No fragrances marked as "${filter}"`}
          </p>
          <p className="text-[13px] text-brown-light mt-1 max-w-[300px] text-center">
            {collection.length === 0
              ? "Add fragrances you own, have tried, or want to try. Your collection shapes your taste profile."
              : "Try a different filter, or add more fragrances above."}
          </p>
          {collection.length === 0 && !showAdd && (
            <button
              onClick={() => { setAddStatus("own"); setShowAdd(true); }}
              className="mt-5 text-[12px] uppercase tracking-[0.125em] font-medium py-2.5 px-6 bg-brown rounded text-cream-50 hover:bg-brown-mid transition"
            >
              Add Your First
            </button>
          )}
        </div>
      ) : filtered.length >= 3 ? (
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
      ) : (
        <div
          className="grid gap-2.5"
          style={{
            gridTemplateColumns: filtered.length === 1 ? "1fr 1fr" : "1fr 1fr",
            gridAutoRows: "270px",
          }}
        >
          {filtered.map((item) => (
            <div key={item.fragranceId} className="h-full">
              <FragranceCard
                item={item}
                onRemove={handleRemove}
                featured={false}
              />
            </div>
          ))}
          {filtered.length === 1 && !showAdd && (
            <button
              onClick={() => { setAddStatus("own"); setShowAdd(true); }}
              className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-cream-200 text-brown-light hover:border-brown-light hover:text-brown-mid transition cursor-pointer bg-transparent"
            >
              <svg className="h-8 w-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[12px] uppercase tracking-[0.125em] font-medium">Add Another</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
