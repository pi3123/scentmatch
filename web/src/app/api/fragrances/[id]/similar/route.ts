// src/app/api/fragrances/[id]/similar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { findSimilarAndPersist } from "@/lib/fragella";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fragranceId = parseInt(id);

  const userId = await getUserId();

  // Get target fragrance (need its name for Fragella fallback)
  const targetFragrance = await prisma.fragrance.findUnique({
    where: { id: fragranceId },
    select: { name: true },
  });

  // Get target fragrance's note IDs
  const targetNotes = await prisma.fragranceNote.findMany({
    where: { fragranceId },
    select: { noteId: true },
  });
  const noteIds = targetNotes.map((n: { noteId: number }) => n.noteId);

  if (noteIds.length === 0) {
    return NextResponse.json([]);
  }

  // Get user's collection fragrance IDs to exclude
  const collection = await prisma.userCollection.findMany({
    where: { userId },
    select: { fragranceId: true },
  });
  const excludeIds = [fragranceId, ...collection.map((c: { fragranceId: number }) => c.fragranceId)];

  // Get user's note preferences for scoring
  const preferences = await prisma.notePreference.findMany({
    where: { userId },
    include: { note: true },
  });
  const prefMap = new Map(preferences.map((p: { note: { name: string }; preference: string }) => [p.note.name, p.preference]));

  // Find fragrances sharing the most notes with target
  let similar = await prisma.fragrance.findMany({
    where: {
      id: { notIn: excludeIds },
      notes: { some: { noteId: { in: noteIds } } },
      imageUrl: { not: null },
    },
    include: {
      notes: { include: { note: true } },
    },
    take: 50,
  });

  // If fewer than 4 local results, supplement with Fragella
  if (similar.length < 4 && targetFragrance?.name) {
    try {
      await findSimilarAndPersist(targetFragrance.name, 10);

      // Re-fetch target notes in case Fragella persisted new data
      const refreshedTargetNotes = await prisma.fragranceNote.findMany({
        where: { fragranceId },
        select: { noteId: true },
      });
      const refreshedNoteIds = refreshedTargetNotes.map((n: { noteId: number }) => n.noteId);

      // Re-query local DB to pick up newly persisted fragrances
      similar = await prisma.fragrance.findMany({
        where: {
          id: { notIn: excludeIds },
          notes: { some: { noteId: { in: refreshedNoteIds.length > 0 ? refreshedNoteIds : noteIds } } },
          imageUrl: { not: null },
        },
        include: {
          notes: { include: { note: true } },
        },
        take: 50,
      });
    } catch {
      // Silent failure -- continue with whatever local results we had
    }
  }

  // Score and sort by shared note count + preference alignment
  const scored = similar.map((frag) => {
    const fragNoteNames = frag.notes.map((fn) => fn.note.name);
    const sharedCount = frag.notes.filter((fn) => noteIds.includes(fn.noteId)).length;

    let prefScore = 0;
    for (const name of fragNoteNames) {
      const pref = prefMap.get(name);
      if (pref === "love") prefScore += 3;
      else if (pref === "like") prefScore += 1;
      else if (pref === "dislike") prefScore -= 2;
    }

    // Lightweight match score (0-100 scale)
    const maxPossible = fragNoteNames.length * 3;
    const matchScore = maxPossible > 0
      ? Math.round(Math.max(0, Math.min(100, ((prefScore + sharedCount * 2) / (maxPossible + sharedCount * 2)) * 100)))
      : Math.round((sharedCount / noteIds.length) * 50);

    return { ...frag, sharedCount, matchScore };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore || b.sharedCount - a.sharedCount);

  return NextResponse.json(scored.slice(0, 8));
}
