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

  // If we have zero local results, go straight to Fragella
  if (fragrances.length === 0) {
    try {
      const fragellaResults = await searchAndPersist(query);
      return NextResponse.json(fragellaResults);
    } catch {
      return NextResponse.json([]);
    }
  }

  // Determine confidence level based on local results
  const queryLower = query.toLowerCase();
  const hasExactMatch = fragrances.some(
    (f) => f.name.toLowerCase() === queryLower
  );
  const hasStartsWithMatch = fragrances.some(
    (f) => f.name.toLowerCase().startsWith(queryLower)
  );

  const isHighConfidence = hasExactMatch;
  const isMediumConfidence = !isHighConfidence && hasStartsWithMatch;
  const isLowConfidence = !isHighConfidence && !isMediumConfidence && fragrances.length < 3;

  // Only supplement with Fragella when confidence is low
  if (isLowConfidence) {
    try {
      const fragellaResults = await searchAndPersist(query);
      // Merge and deduplicate by id
      const existingIds = new Set(fragrances.map((f) => f.id));
      const newResults = fragellaResults.filter((f) => !existingIds.has(f.id));
      return NextResponse.json([...fragrances, ...newResults]);
    } catch {
      // Silent failure -- return local results as-is
      return NextResponse.json(fragrances);
    }
  }

  return NextResponse.json(fragrances);
}
