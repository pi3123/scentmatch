import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collection = await prisma.userCollection.findMany({
    where: { userId: session.user.id },
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        userId: session.user.id,
        fragranceId: parseInt(fragranceId),
      },
    },
    update: { status, rating: rating ?? null },
    create: {
      userId: session.user.id,
      fragranceId: parseInt(fragranceId),
      status,
      rating: rating ?? null,
    },
    include: {
      fragrance: true,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fragranceId } = await request.json();

  await prisma.userCollection.delete({
    where: {
      userId_fragranceId: {
        userId: session.user.id,
        fragranceId: parseInt(fragranceId),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
