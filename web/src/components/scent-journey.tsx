// src/components/scent-journey.tsx
"use client";

interface NoteItem {
  name: string;
  layer: string;
}

const layers = [
  {
    key: "top",
    label: "First Spray",
    time: "0 - 30 min",
    color: "#c4973e",
  },
  {
    key: "middle",
    label: "Heart",
    time: "30 min - 3 hrs",
    color: "#6b8060",
  },
  {
    key: "base",
    label: "Dry Down",
    time: "3 hrs +",
    color: "#6b5a45",
  },
];

export function ScentJourney({
  notes,
  fragranceName,
}: {
  notes: NoteItem[];
  fragranceName: string;
}) {
  const grouped = {
    top: notes.filter((n) => n.layer === "top"),
    middle: notes.filter((n) => n.layer === "middle"),
    base: notes.filter((n) => n.layer === "base"),
  };

  // If no layer data, show flat list
  const hasLayers = grouped.top.length > 0 || grouped.middle.length > 0 || grouped.base.length > 0;
  if (!hasLayers) {
    return (
      <div className="py-10 px-12">
        <p className="text-[10px] uppercase tracking-[0.2em] text-brown-light mb-1">Notes</p>
        <p className="font-heading text-[24px] text-brown mb-6">
          What&apos;s inside {fragranceName}
        </p>
        <div className="flex flex-wrap gap-2">
          {notes.map((n) => (
            <span
              key={n.name}
              className="rounded-full border border-cream-200 bg-white px-3.5 py-1.5 text-[12px] text-brown"
            >
              {n.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-12">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brown-light mb-1">
        The Scent Journey
      </p>
      <p className="font-heading text-[24px] text-brown mb-8">
        How {fragranceName} unfolds
      </p>

      <div className="grid grid-cols-3 gap-0 relative">
        {/* Connecting gradient line */}
        <div
          className="absolute top-[20px] h-[2px] z-0"
          style={{
            left: "16.67%",
            right: "16.67%",
            background: "linear-gradient(to right, #c4973e, #6b8060, #6b5a45)",
          }}
        />

        {layers.map((layer) => {
          const layerNotes = grouped[layer.key as keyof typeof grouped];
          return (
            <div key={layer.key} className="relative z-[1] text-center px-4">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: layer.color }}
              >
                {layer.key === "top" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faf8f5" strokeWidth="2">
                    <path d="M12 2L8 8h8L12 2z" /><path d="M12 8v14" />
                  </svg>
                )}
                {layer.key === "middle" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faf8f5" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                )}
                {layer.key === "base" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faf8f5" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                )}
              </div>
              <p
                className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-0.5"
                style={{ color: layer.color }}
              >
                {layer.label}
              </p>
              <p className="text-[10px] text-brown-light mb-3">{layer.time}</p>
              <div className="flex flex-col gap-1.5 items-center">
                {layerNotes.map((n) => (
                  <span
                    key={n.name}
                    className="rounded-full border border-cream-200 bg-white px-3 py-1 text-[11px] text-brown"
                  >
                    {n.name}
                  </span>
                ))}
                {layerNotes.length === 0 && (
                  <span className="text-[11px] text-brown-light italic">none listed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
