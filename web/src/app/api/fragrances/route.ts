import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const fragrances = await prisma.fragrance.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { brand: { contains: query } },
      ],
    },
    include: {
      notes: { include: { note: true } },
    },
    take: 20,
    orderBy: { ratingCount: "desc" },
  });

  return NextResponse.json(fragrances);
}
