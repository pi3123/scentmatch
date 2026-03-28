import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const fragrances = await prisma.fragrance.findMany({
    where: {
      imageUrl: { not: null },
      ratingCount: { not: null },
    },
    orderBy: { ratingCount: "desc" },
    take: 6,
  });

  return NextResponse.json(fragrances);
}
