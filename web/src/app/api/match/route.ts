import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMatch } from "@/lib/matching-client";
import { createLLMAdapter } from "@/lib/llm/adapter";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fragranceId } = await request.json();
  if (!fragranceId) {
    return NextResponse.json({ error: "fragranceId required" }, { status: 400 });
  }

  const fragrance = await prisma.fragrance.findUnique({
    where: { id: parseInt(fragranceId) },
    include: { notes: { include: { note: true } } },
  });

  if (!fragrance) {
    return NextResponse.json({ error: "Fragrance not found" }, { status: 404 });
  }

  const collection = await prisma.userCollection.findMany({
    where: { userId: session.user.id },
    include: {
      fragrance: { include: { notes: { include: { note: true } } } },
    },
  });

  const preferences = await prisma.notePreference.findMany({
    where: { userId: session.user.id },
    include: { note: true },
  });

  // Transform to engine format
  const target = {
    id: fragrance.id,
    name: fragrance.name,
    brand: fragrance.brand,
    notes: fragrance.notes.map((fn) => ({
      name: fn.note.name,
      category: fn.note.category || "",
      layer: fn.layer,
    })),
    main_accords: fragrance.mainAccords ? JSON.parse(fragrance.mainAccords as string) : {},
  };

  const collectionPayload = collection.map((item) => ({
    fragrance: {
      id: item.fragrance.id,
      name: item.fragrance.name,
      brand: item.fragrance.brand,
      notes: item.fragrance.notes.map((fn) => ({
        name: fn.note.name,
        category: fn.note.category || "",
        layer: fn.layer,
      })),
      main_accords: item.fragrance.mainAccords ? JSON.parse(item.fragrance.mainAccords as string) : {},
    },
    status: item.status,
    rating: item.rating,
  }));

  const prefsPayload = preferences.map((p) => ({
    note_name: p.note.name,
    category: p.note.category || "",
    preference: p.preference,
    source: p.source,
  }));

  const matchResult = await getMatch({
    target,
    collection: collectionPayload,
    note_preferences: prefsPayload,
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  const tone = user?.preferredTone || "casual";

  let explanation = "";
  try {
    const llm = await createLLMAdapter();
    explanation = await llm.generateExplanation(matchResult, tone);
  } catch (err) {
    console.error("LLM explanation failed:", err);
    explanation = "Couldn't generate an explanation right now. Check the score and breakdown above.";
  }

  return NextResponse.json({
    ...matchResult,
    explanation,
    fragrance: {
      id: fragrance.id,
      name: fragrance.name,
      brand: fragrance.brand,
      imageUrl: fragrance.imageUrl,
    },
  });
}
