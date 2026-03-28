import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchAndPersist } from "@/lib/fragella";

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

  // If local DB has results, return them
  if (fragrances.length > 0) {
    return NextResponse.json(fragrances);
  }

  // Fallback: search Fragella API and persist for next time
  const external = await searchAndPersist(query);
  return NextResponse.json(external);
}
