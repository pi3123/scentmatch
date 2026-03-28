import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const fragrances = await prisma.fragrance.findMany({
    where: {
      imageUrl: { not: null },
      ratingCount: { not: null },
    },
    orderBy: { ratingCount: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      brand: true,
      imageUrl: true,
      ratingValue: true,
    },
  });

  return NextResponse.json(fragrances);
}
