import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { readFileSync } from "fs";
import { resolve } from "path";

const dbPath = resolve(__dirname, "../dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

interface Perfume {
  id: string;
  name: string;
  brand: string;
  gender: string | null;
  year: number | null;
  fragrance_family: string | null;
  rating: number | null;
  rating_count: number | null;
  top_notes: string[];
  middle_notes: string[];
  base_notes: string[];
  accords: string[];
  image_url: string | null;
  url: string | null;
}

async function main() {
  const jsonPath = resolve(__dirname, "../../data/top_1000_perfumes.json");
  const raw = readFileSync(jsonPath, "utf-8");
  const perfumes: Perfume[] = JSON.parse(raw);

  console.log(`Found ${perfumes.length} perfumes to import`);

  const noteCache = new Map<string, number>();

  async function getOrCreateNote(name: string, category?: string): Promise<number> {
    const key = name.toLowerCase().trim();
    if (noteCache.has(key)) return noteCache.get(key)!;

    const note = await prisma.note.upsert({
      where: { name: key },
      update: {},
      create: { name: key, category: category ?? null },
    });
    noteCache.set(key, note.id);
    return note.id;
  }

  // Clear existing fragrance data for clean re-seed
  await prisma.fragranceNote.deleteMany();
  await prisma.userCollection.deleteMany();
  await prisma.fragrance.deleteMany();
  await prisma.note.deleteMany();
  console.log("Cleared existing fragrance data");

  let imported = 0;
  let skipped = 0;

  for (const p of perfumes) {
    try {
      if (!p.name?.trim() || !p.brand?.trim()) {
        skipped++;
        continue;
      }

      // Convert accords list to a record (no strength % available, use equal weights)
      const mainAccords: Record<string, number> = {};
      for (const accord of p.accords ?? []) {
        mainAccords[accord] = 1;
      }

      const fragrance = await prisma.fragrance.create({
        data: {
          name: p.name.trim(),
          brand: p.brand.trim(),
          year: p.year ?? null,
          gender: p.gender ?? null,
          ratingValue: p.rating ?? null,
          ratingCount: p.rating_count ?? null,
          mainAccords: Object.keys(mainAccords).length > 0
            ? JSON.stringify(mainAccords)
            : null,
          imageUrl: p.image_url ?? null,
        },
      });

      const layers = [
        { key: "top_notes" as const, layer: "top" },
        { key: "middle_notes" as const, layer: "middle" },
        { key: "base_notes" as const, layer: "base" },
      ];

      // Track seen noteIds per fragrance to avoid duplicate composite keys
      const seenNotes = new Set<number>();

      for (const { key, layer } of layers) {
        for (const noteName of p[key] ?? []) {
          if (!noteName.trim()) continue;
          const noteId = await getOrCreateNote(
            noteName,
            p.fragrance_family ?? undefined
          );
          if (seenNotes.has(noteId)) continue;
          seenNotes.add(noteId);
          await prisma.fragranceNote.create({
            data: {
              fragranceId: fragrance.id,
              noteId,
              layer,
            },
          });
        }
      }

      imported++;
      if (imported % 100 === 0) {
        console.log(`  ${imported} imported...`);
      }
    } catch (err) {
      console.error(`Error importing "${p.name}":`, err);
      skipped++;
    }
  }

  console.log(`\nDone. Imported: ${imported}, Skipped: ${skipped}`);
  console.log(`Total unique notes: ${noteCache.size}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
