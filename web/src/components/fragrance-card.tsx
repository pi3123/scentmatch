"use client";

import type { CollectionItem } from "@/types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-[12px] ${star <= rating ? "text-amber" : "text-cream-200"}`}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

function parseAccords(mainAccords: string | null): string[] {
  if (!mainAccords) return [];
  try {
    const parsed = JSON.parse(mainAccords);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function FragranceCard({
  item,
  onRemove,
  featured = false,
}: {
  item: CollectionItem;
  onRemove: (fragranceId: number) => void;
  featured?: boolean;
}) {
  const f = item.fragrance;
  const accords = parseAccords(f.mainAccords);

  if (featured) {
    return (
      <div
        className="group relative flex h-full flex-col overflow-hidden rounded-lg bg-white cursor-pointer transition duration-[400ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.985] hover:shadow-[0_12px_40px_rgba(30,24,18,0.08)]"
      >
        <button
          onClick={() => onRemove(f.id)}
          className="absolute right-2 top-2 z-10 rounded-lg p-1 text-cream-200 opacity-0 transition-opacity hover:text-brown-mid group-hover:opacity-100"
          title="Remove"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-1 items-center justify-center overflow-hidden bg-white p-4">
          {f.imageUrl ? (
            <img
              src={f.imageUrl}
              alt=""
              className="blend max-h-[360px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="h-full w-full bg-cream-200" />
          )}
        </div>

        <div className="p-0 px-[22px] pb-[22px]">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.125em] text-brown-mid">
            {item.status}
          </p>
          <p className="font-heading text-[22px] font-medium text-brown">{f.name}</p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.125em] text-brown-mid">
            {f.brand}
          </p>
          {accords.length > 0 && (
            <div className="mt-1.5 flex gap-1">
              {accords.map((accord) => (
                <span
                  key={accord}
                  className="rounded-[3px] bg-brown-mid/[0.06] px-[7px] py-0.5 text-[11px] font-medium text-brown-mid"
                >
                  {accord}
                </span>
              ))}
            </div>
          )}
          {item.rating != null && item.rating > 0 && (
            <div className="mt-1.5">
              <StarRating rating={item.rating} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular card
  return (
    <div
      className="group relative flex h-full flex-row overflow-hidden rounded-lg bg-white cursor-pointer transition duration-[400ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.985] hover:shadow-[0_12px_40px_rgba(30,24,18,0.08)]"
    >
      <button
        onClick={() => onRemove(f.id)}
        className="absolute right-2 top-2 z-10 rounded-lg p-1 text-cream-200 opacity-0 transition-opacity hover:text-brown-mid group-hover:opacity-100"
        title="Remove"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex w-[120px] shrink-0 items-center justify-center bg-white p-2.5">
        {f.imageUrl ? (
          <img
            src={f.imageUrl}
            alt=""
            className="blend max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-cream-200" />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-end p-3.5 px-[18px]">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.125em] text-brown-mid">
          {item.status}
        </p>
        <p className="font-heading text-[17px] font-medium text-brown">{f.name}</p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.125em] text-brown-mid">
          {f.brand}
        </p>
        {accords.length > 0 && (
          <div className="mt-1.5 flex gap-1">
            {accords.map((accord) => (
              <span
                key={accord}
                className="rounded-[3px] bg-brown-mid/[0.06] px-[7px] py-0.5 text-[11px] font-medium text-brown-mid"
              >
                {accord}
              </span>
            ))}
          </div>
        )}
        {item.rating != null && item.rating > 0 && (
          <div className="mt-1.5">
            <StarRating rating={item.rating} />
          </div>
        )}
      </div>
    </div>
  );
}
