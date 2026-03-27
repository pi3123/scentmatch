import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

export async function GET() {
  const userId = await getUserId();

  const collection = await prisma.userCollection.findMany({
    where: { userId },
    include: {
      fragrance: {
        include: { notes: { include: { note: true } } },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(collection);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();

  const body = await request.json();
  const { fragranceId, status, rating } = body;

  if (!fragranceId || !["own", "tried", "want"].includes(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const item = await prisma.userCollection.upsert({
    where: {
      userId_fragranceId: {
        userId,
        fragranceId: parseInt(fragranceId),
      },
    },
    update: { status, rating: rating ?? null },
    create: {
      userId,
      fragranceId: parseInt(fragranceId),
      status,
      rating: rating ?? null,
    },
    include: {
      fragrance: {
        include: { notes: { include: { note: true } } },
      },
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId();

  const { fragranceId } = await request.json();

  await prisma.userCollection.delete({
    where: {
      userId_fragranceId: {
        userId,
        fragranceId: parseInt(fragranceId),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
