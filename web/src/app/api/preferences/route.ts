import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

export async function GET() {
  const userId = await getUserId();

  const preferences = await prisma.notePreference.findMany({
    where: { userId },
    include: { note: true },
  });

  return NextResponse.json(preferences);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();

  const body = await request.json();
  const { noteId, preference } = body;

  if (!noteId || !["love", "like", "neutral", "dislike"].includes(preference)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const pref = await prisma.notePreference.upsert({
    where: {
      userId_noteId: {
        userId,
        noteId: parseInt(noteId),
      },
    },
    update: { preference, source: "explicit" },
    create: {
      userId,
      noteId: parseInt(noteId),
      preference,
      source: "explicit",
    },
    include: { note: true },
  });

  return NextResponse.json(pref);
}
