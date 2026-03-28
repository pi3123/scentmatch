import { prisma } from "./prisma";

const FRAGELLA_BASE = "https://api.fragella.com/api/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FragellaNote {
  name?: string;
  Name?: string;
  imageUrl?: string;
  ImageUrl?: string;
}

interface FragellaAccordPercentage {
  level: string;
  value?: number;
}

interface FragellaFragrance {
  // PascalCase variants
  Name?: string;
  Brand?: string;
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
    top?: FragellaNote[];
    middle?: FragellaNote[];
    base?: FragellaNote[];
  };
  Popularity?: number;
  // camelCase variants
  name?: string;
  brand?: string;
  year?: number;
  rating?: number;
  gender?: string;
  imageUrl?: string;
  imageFallbacks?: string[];
  longevity?: string;
  sillage?: string;
  mainAccords?: string[];
  mainAccordsPercentage?: Record<string, FragellaAccordPercentage>;
  notes?: {
    Top?: FragellaNote[];
    Middle?: FragellaNote[];
    Base?: FragellaNote[];
    top?: FragellaNote[];
    middle?: FragellaNote[];
    base?: FragellaNote[];
  };
  popularity?: number;
}

interface FragellaSimilarResponse {
  similar_to?: string;
  similar_fragrances?: FragellaFragrance[];
}

interface FragellaNoteResult {
  name: string;
  occurrence: number;
  description: string;
  imageUrl: string;
}

interface FragellaAccordResult {
  name: string;
  occurrence: number;
  description: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick the first defined value between PascalCase and camelCase fields. */
function pick<T>(pascal: T | undefined, camel: T | undefined): T | undefined {
  return pascal !== undefined ? pascal : camel;
}

function getApiKey(): string | null {
  return process.env.FRAGELLA_API_KEY ?? null;
}

/** Normalize a raw API fragrance object into consistent field access. */
function norm(f: FragellaFragrance) {
  const name = (pick(f.Name, f.name) as string | undefined)?.trim() ?? "";
  const brand = (pick(f.Brand, f.brand) as string | undefined)?.trim() ?? "";
  const year = pick(f.Year, f.year) as number | undefined;
  const rating = pick(f.Rating, f.rating) as number | undefined;
  const gender = pick(f.Gender, f.gender) as string | undefined;
  const imageUrl = pick(f.ImageUrl, f.imageUrl) as string | undefined;
  const imageFallbacks = pick(f.ImageFallbacks, f.imageFallbacks) as string[] | undefined;
  const longevity = pick(f.Longevity, f.longevity) as string | undefined;
  const sillage = pick(f.Sillage, f.sillage) as string | undefined;
  const mainAccordsArr = pick(f.MainAccords, f.mainAccords) as string[] | undefined;
  const mainAccordsPct = pick(f.MainAccordsPercentage, f.mainAccordsPercentage) as
    | Record<string, FragellaAccordPercentage>
    | undefined;
  const rawNotes = pick(f.Notes, f.notes);

  const topNotes = rawNotes?.Top ?? rawNotes?.top ?? [];
  const middleNotes = rawNotes?.Middle ?? rawNotes?.middle ?? [];
  const baseNotes = rawNotes?.Base ?? rawNotes?.base ?? [];

  return {
    name,
    brand,
    year: year ?? null,
    rating: rating ?? null,
    gender: gender ?? null,
    imageUrl: imageUrl ?? imageFallbacks?.[0] ?? null,
    longevity: longevity ?? null,
    sillage: sillage ?? null,
    mainAccordsArr,
    mainAccordsPct,
    topNotes,
    middleNotes,
    baseNotes,
  };
}

/** Build a mainAccords JSON string from API data. */
function buildMainAccordsJson(
  pct: Record<string, FragellaAccordPercentage> | undefined,
  arr: string[] | undefined,
): string | null {
  const accords: Record<string, number> = {};
  if (pct) {
    for (const [accord, info] of Object.entries(pct)) {
      accords[accord] = info.value ?? 1;
    }
  } else if (arr) {
    for (const accord of arr) {
      accords[accord] = 1;
    }
  }
  return Object.keys(accords).length > 0 ? JSON.stringify(accords) : null;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

export async function isCached(endpoint: string, queryKey: string): Promise<boolean> {
  try {
    const row = await prisma.fragellaCache.findUnique({
      where: { endpoint_queryKey: { endpoint, queryKey } },
    });
    return row !== null;
  } catch {
    return false;
  }
}

async function markCached(endpoint: string, queryKey: string): Promise<void> {
  try {
    await prisma.fragellaCache.upsert({
      where: { endpoint_queryKey: { endpoint, queryKey } },
      update: { fetchedAt: new Date() },
      create: { endpoint, queryKey },
    });
  } catch (err) {
    console.error("Failed to write FragellaCache:", err);
  }
}

// ---------------------------------------------------------------------------
// Generic fetch
// ---------------------------------------------------------------------------

async function fragellaFetch<T>(path: string): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("FRAGELLA_API_KEY is not set");
    return null;
  }

  try {
    const url = `${FRAGELLA_BASE}${path}`;
    const res = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });

    if (!res.ok) {
      console.error(`Fragella API error: ${res.status} ${res.statusText} for ${path}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error("Fragella API fetch failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/** Persist a single fragrance and its notes. Returns the DB record with notes included. */
async function persistFragrance(f: FragellaFragrance) {
  const n = norm(f);
  if (!n.name || !n.brand) return null;

  // Check if already exists
  const existing = await prisma.fragrance.findFirst({
    where: { name: n.name, brand: n.brand },
    include: { notes: { include: { note: true } } },
  });
  if (existing) return existing;

  const fragrance = await prisma.fragrance.create({
    data: {
      name: n.name,
      brand: n.brand,
      year: n.year,
      gender: n.gender,
      ratingValue: n.rating,
      ratingCount: null,
      mainAccords: buildMainAccordsJson(n.mainAccordsPct, n.mainAccordsArr),
      longevity: n.longevity,
      sillage: n.sillage,
      imageUrl: n.imageUrl,
      source: "fragella",
    },
  });

  // Persist notes by layer
  const layers: { notes: FragellaNote[]; layer: string }[] = [
    { notes: n.topNotes, layer: "top" },
    { notes: n.middleNotes, layer: "middle" },
    { notes: n.baseNotes, layer: "base" },
  ];

  const seenNoteIds = new Set<number>();

  for (const { notes, layer } of layers) {
    for (const rawNote of notes) {
      const noteName = (rawNote.name ?? rawNote.Name ?? "").toLowerCase().trim();
      if (!noteName) continue;

      const note = await prisma.note.upsert({
        where: { name: noteName },
        update: {},
        create: { name: noteName },
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

  return prisma.fragrance.findUnique({
    where: { id: fragrance.id },
    include: { notes: { include: { note: true } } },
  });
}

/** Persist an array of raw API fragrances, returning the DB records. */
async function persistMany(fragrances: FragellaFragrance[]) {
  const persisted = [];
  for (const f of fragrances) {
    try {
      const saved = await persistFragrance(f);
      if (saved) persisted.push(saved);
    } catch (err) {
      const n = norm(f);
      console.error(`Failed to persist "${n.name}":`, err);
    }
  }
  return persisted;
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Search fragrances by name, persist results, and return persisted DB records.
 */
export async function searchAndPersist(query: string) {
  const endpoint = "/fragrances";
  const queryKey = `search=${query}`;

  try {
    if (await isCached(endpoint, queryKey)) {
      // Return what we already have in the DB matching this query
      const cached = await prisma.fragrance.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
          source: "fragella",
        },
        include: { notes: { include: { note: true } } },
      });
      return cached;
    }

    const data = await fragellaFetch<FragellaFragrance[]>(
      `${endpoint}?search=${encodeURIComponent(query)}&limit=20`,
    );
    if (!data || !Array.isArray(data)) return [];

    const persisted = await persistMany(data);
    await markCached(endpoint, queryKey);
    return persisted;
  } catch (err) {
    console.error("searchAndPersist failed:", err);
    return [];
  }
}

/**
 * Find similar fragrances, persist results, and return persisted DB records.
 */
export async function findSimilarAndPersist(fragranceName: string, limit = 10) {
  const endpoint = "/fragrances/similar";
  const queryKey = `name=${fragranceName}&limit=${limit}`;

  try {
    if (await isCached(endpoint, queryKey)) {
      const cached = await prisma.fragrance.findMany({
        where: { source: "fragella" },
        include: { notes: { include: { note: true } } },
        take: limit,
      });
      return cached;
    }

    const data = await fragellaFetch<FragellaSimilarResponse>(
      `${endpoint}?name=${encodeURIComponent(fragranceName)}&limit=${limit}`,
    );
    if (!data?.similar_fragrances || !Array.isArray(data.similar_fragrances)) return [];

    const persisted = await persistMany(data.similar_fragrances);
    await markCached(endpoint, queryKey);
    return persisted;
  } catch (err) {
    console.error("findSimilarAndPersist failed:", err);
    return [];
  }
}

/**
 * Match fragrances by accords and note traits, persist results, return persisted DB records.
 */
export async function matchByTraitsAndPersist(params: {
  accords?: string;
  top?: string;
  middle?: string;
  base?: string;
  limit?: number;
}) {
  const endpoint = "/fragrances/match";
  const limit = params.limit ?? 10;
  const parts: string[] = [];
  if (params.accords) parts.push(`accords=${encodeURIComponent(params.accords)}`);
  if (params.top) parts.push(`top=${encodeURIComponent(params.top)}`);
  if (params.middle) parts.push(`middle=${encodeURIComponent(params.middle)}`);
  if (params.base) parts.push(`base=${encodeURIComponent(params.base)}`);
  parts.push(`limit=${limit}`);
  const qs = parts.join("&");
  const queryKey = qs;

  try {
    if (await isCached(endpoint, queryKey)) {
      const cached = await prisma.fragrance.findMany({
        where: { source: "fragella" },
        include: { notes: { include: { note: true } } },
        take: limit,
      });
      return cached;
    }

    const data = await fragellaFetch<FragellaFragrance[]>(`${endpoint}?${qs}`);
    if (!data || !Array.isArray(data)) return [];

    const persisted = await persistMany(data);
    await markCached(endpoint, queryKey);
    return persisted;
  } catch (err) {
    console.error("matchByTraitsAndPersist failed:", err);
    return [];
  }
}

/**
 * Get fragrances by brand, persist results, return persisted DB records.
 */
export async function searchBrandAndPersist(brand: string, limit = 20) {
  const endpoint = `/brands/${encodeURIComponent(brand)}`;
  const queryKey = `limit=${limit}`;

  try {
    if (await isCached(endpoint, queryKey)) {
      const cached = await prisma.fragrance.findMany({
        where: {
          brand: { equals: brand, mode: "insensitive" },
          source: "fragella",
        },
        include: { notes: { include: { note: true } } },
        take: limit,
      });
      return cached;
    }

    const data = await fragellaFetch<FragellaFragrance[]>(`${endpoint}?limit=${limit}`);
    if (!data || !Array.isArray(data)) return [];

    const persisted = await persistMany(data);
    await markCached(endpoint, queryKey);
    return persisted;
  } catch (err) {
    console.error("searchBrandAndPersist failed:", err);
    return [];
  }
}

/**
 * Search notes from Fragella. Returns raw API data, no DB persistence.
 */
export async function searchNotes(
  query: string,
  limit = 20,
): Promise<FragellaNoteResult[]> {
  const endpoint = "/notes";
  const queryKey = `search=${query}&limit=${limit}`;

  try {
    if (await isCached(endpoint, queryKey)) return [];

    const data = await fragellaFetch<FragellaNoteResult[]>(
      `${endpoint}?search=${encodeURIComponent(query)}&limit=${limit}`,
    );
    if (!data || !Array.isArray(data)) return [];

    await markCached(endpoint, queryKey);
    return data;
  } catch (err) {
    console.error("searchNotes failed:", err);
    return [];
  }
}

/**
 * Search accords from Fragella. Returns raw API data, no DB persistence.
 */
export async function searchAccords(
  query: string,
  limit = 20,
): Promise<FragellaAccordResult[]> {
  const endpoint = "/accords";
  const queryKey = `search=${query}&limit=${limit}`;

  try {
    if (await isCached(endpoint, queryKey)) return [];

    const data = await fragellaFetch<FragellaAccordResult[]>(
      `${endpoint}?search=${encodeURIComponent(query)}&limit=${limit}`,
    );
    if (!data || !Array.isArray(data)) return [];

    await markCached(endpoint, queryKey);
    return data;
  } catch (err) {
    console.error("searchAccords failed:", err);
    return [];
  }
}
