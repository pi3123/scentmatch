import { prisma } from "./prisma";

const FRAGELLA_BASE = "https://api.fragella.com/api/v1";

function getApiKey(): string | null {
  return process.env.FRAGELLA_API_KEY ?? null;
}

interface FragellaNote {
  name: string;
  imageUrl?: string;
}

interface FragellaAccordPercentage {
  level: string;
  value?: number;
}

interface FragellaFragrance {
  Name: string;
  Brand: string;
  Year?: number;
  Rating?: number;
  Gender?: string;
  ImageUrl?: string;
  ImageFallbacks?: string[];
  Longevity?: string;
  Sillage?: string;
  MainAccords?: string[];
  MainAccordsPercentage?: Record<string, FragellaAccordPercentage>;
  Notes?: {
    Top?: FragellaNote[];
    Middle?: FragellaNote[];
    Base?: FragellaNote[];
  };
  Popularity?: number;
}

/**
 * Search Fragella API for fragrances by name.
 * Returns raw API results.
 */
async function searchFragella(query: string): Promise<FragellaFragrance[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const url = `${FRAGELLA_BASE}/fragrances?search=${encodeURIComponent(query)}&limit=20`;

  const res = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  if (!res.ok) {
    console.error(`Fragella API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Persist a Fragella fragrance into the local database.
 * Returns the created Prisma fragrance with notes included.
 */
async function persistFragrance(f: FragellaFragrance) {
  // Build main accords JSON — use percentages if available, else flat 1.0
  const mainAccords: Record<string, number> = {};
  if (f.MainAccordsPercentage) {
    for (const [accord, info] of Object.entries(f.MainAccordsPercentage)) {
      mainAccords[accord] = info.value ?? 1;
    }
  } else if (f.MainAccords) {
    for (const accord of f.MainAccords) {
      mainAccords[accord] = 1;
    }
  }

  const fragrance = await prisma.fragrance.create({
    data: {
      name: f.Name.trim(),
      brand: f.Brand.trim(),
      year: f.Year ?? null,
      gender: f.Gender ?? null,
      ratingValue: f.Rating ?? null,
      ratingCount: null,
      mainAccords:
        Object.keys(mainAccords).length > 0
          ? JSON.stringify(mainAccords)
          : null,
      imageUrl: f.ImageUrl ?? f.ImageFallbacks?.[0] ?? null,
    },
  });

  // Persist notes by layer
  const layers = [
    { notes: f.Notes?.Top ?? [], layer: "top" },
    { notes: f.Notes?.Middle ?? [], layer: "middle" },
    { notes: f.Notes?.Base ?? [], layer: "base" },
  ] as const;

  const seenNoteIds = new Set<number>();

  for (const { notes, layer } of layers) {
    for (const n of notes) {
      const name = n.name?.toLowerCase().trim();
      if (!name) continue;

      const note = await prisma.note.upsert({
        where: { name },
        update: {},
        create: { name },
      });

      if (seenNoteIds.has(note.id)) continue;
      seenNoteIds.add(note.id);

      await prisma.fragranceNote.create({
        data: {
          fragranceId: fragrance.id,
          noteId: note.id,
          layer,
        },
      });
    }
  }

  // Re-fetch with notes included to match the shape the route returns
  return prisma.fragrance.findUnique({
    where: { id: fragrance.id },
    include: { notes: { include: { note: true } } },
  });
}

/**
 * Search Fragella, persist any results not already in the DB,
 * and return the persisted fragrances.
 */
export async function searchAndPersist(query: string) {
  const results = await searchFragella(query);
  if (results.length === 0) return [];

  const persisted = [];

  for (const f of results) {
    if (!f.Name?.trim() || !f.Brand?.trim()) continue;

    // Check if we already have this exact fragrance
    const existing = await prisma.fragrance.findFirst({
      where: {
        name: f.Name.trim(),
        brand: f.Brand.trim(),
      },
      include: { notes: { include: { note: true } } },
    });

    if (existing) {
      persisted.push(existing);
      continue;
    }

    try {
      const saved = await persistFragrance(f);
      if (saved) persisted.push(saved);
    } catch (err) {
      console.error(`Failed to persist "${f.Name}":`, err);
    }
  }

  return persisted;
}
