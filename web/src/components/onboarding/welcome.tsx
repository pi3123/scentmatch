"use client";

export type OnboardingPath = "rate-notes" | "add-collection";

export function Welcome({
  onSelectPath,
}: {
  onSelectPath: (path: OnboardingPath) => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brown text-cream-50">
      <p className="mb-12 font-[family-name:var(--font-heading)] text-[20px] font-semibold text-cream-50">
        ScentMatch
      </p>

      <div className="flex gap-5">
        {/* Rate Notes card */}
        <button
          onClick={() => onSelectPath("rate-notes")}
          className="group w-[220px] rounded-xl border border-white/[0.08] bg-white/[0.03] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-amber/40 hover:bg-white/[0.06]"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-[24px] transition-colors group-hover:bg-amber/10 group-hover:text-amber">
            &#9829;
          </div>
          <h3 className="mb-1 font-[family-name:var(--font-heading)] text-[16px] font-medium text-cream-50">
            Rate Notes
          </h3>
          <p className="text-[12px] leading-relaxed text-brown-light">
            Tell us which scent families you love
          </p>
        </button>

        {/* Add Collection card */}
        <button
          onClick={() => onSelectPath("add-collection")}
          className="group w-[220px] rounded-xl border border-white/[0.08] bg-white/[0.03] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-amber/40 hover:bg-white/[0.06]"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-[24px] transition-colors group-hover:bg-amber/10 group-hover:text-amber">
            +
          </div>
          <h3 className="mb-1 font-[family-name:var(--font-heading)] text-[16px] font-medium text-cream-50">
            Add Collection
          </h3>
          <p className="text-[12px] leading-relaxed text-brown-light">
            Search fragrances you own or have tried
          </p>
        </button>
      </div>
    </div>
  );
}
