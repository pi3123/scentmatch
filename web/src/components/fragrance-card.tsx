"use client";

import type { CollectionItem } from "@/types";

const statusColors: Record<string, string> = {
  own: "bg-sage-400/20 text-sage-600",
  tried: "bg-sky-400/20 text-sky-500",
  want: "bg-amber-400/20 text-amber-500",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-xs ${star <= rating ? "text-amber-400" : "text-cream-300"}`}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

export function FragranceCard({
  item,
  onRemove,
}: {
  item: CollectionItem;
  onRemove: (fragranceId: number) => void;
}) {
  const f = item.fragrance;

  return (
    <div className="group relative rounded-xl border border-cream-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <button
        onClick={() => onRemove(f.id)}
        className="absolute right-2 top-2 rounded-lg p-1 text-cream-400 opacity-0 transition-opacity hover:bg-cream-100 hover:text-warm-600 group-hover:opacity-100"
        title="Remove"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex gap-3">
        {f.imageUrl ? (
          <img
            src={f.imageUrl}
            alt=""
            className="h-16 w-12 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-12 items-center justify-center rounded-lg bg-cream-200 text-xs text-warm-600">
            ?
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-warm-800">{f.name}</p>
          <p className="truncate text-xs text-warm-600">{f.brand}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[item.status] ?? ""}`}
            >
              {item.status}
            </span>
            {item.rating && <StarRating rating={item.rating} />}
          </div>
        </div>
      </div>
    </div>
  );
}
