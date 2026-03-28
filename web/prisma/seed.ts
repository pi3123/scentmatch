import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local first (matches prisma.config.ts behavior)
const envLocal = resolve(process.cwd(), ".env.local");
const envDefault = resolve(process.cwd(), ".env");
config({ path: existsSync(envLocal) ? envLocal : envDefault, override: true });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
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

function loadJson(filename: string): Perfume[] {
  const filePath = resolve(__dirname, "../../data", filename);
  if (!existsSync(filePath)) {
    console.log(`  Skipping ${filename} (not found)`);
    return [];
  }
  const raw = readFileSync(filePath, "utf-8");
  const data: Perfume[] = JSON.parse(raw);
  console.log(`  ${filename}: ${data.length} perfumes`);
  return data;
}

async function main() {
  console.log("Loading data...");
  const perfumes = loadJson("perfumes.json");
  console.log(`Total: ${perfumes.length} perfumes to import\n`);

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
  await prisma.$executeRawUnsafe("TRUNCATE fragrance_notes, user_collection, note_preferences, fragrances, notes CASCADE");
  console.log("Cleared existing fragrance data\n");

  let imported = 0;
  let skipped = 0;

  for (const p of perfumes) {
    try {
      if (!p.name?.trim() || !p.brand?.trim()) {
        skipped++;
        continue;
      }

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
      if (imported % 1000 === 0) {
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
