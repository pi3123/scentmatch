import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns the most common notes across all fragrances, for cold-start onboarding
export async function GET() {
  const notes = await prisma.note.findMany({
    where: {
      fragrances: { some: {} },
    },
    orderBy: { id: "asc" },
    take: 50,
    select: { id: true, name: true, category: true },
  });

  return NextResponse.json(notes);
}
