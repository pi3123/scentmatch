import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await prisma.notePreference.findMany({
    where: { userId: session.user.id },
    include: { note: true },
  });

  return NextResponse.json(preferences);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { noteId, preference } = body;

  if (!noteId || !["love", "like", "neutral", "dislike"].includes(preference)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const pref = await prisma.notePreference.upsert({
    where: {
      userId_noteId: {
        userId: session.user.id,
        noteId: parseInt(noteId),
      },
    },
    update: { preference, source: "explicit" },
    create: {
      userId: session.user.id,
      noteId: parseInt(noteId),
      preference,
      source: "explicit",
    },
    include: { note: true },
  });

  return NextResponse.json(pref);
}
