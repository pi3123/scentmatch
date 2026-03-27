import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fragrance = await prisma.fragrance.findUnique({
    where: { id: parseInt(id) },
    include: {
      notes: { include: { note: true } },
    },
  });

  if (!fragrance) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(fragrance);
}
