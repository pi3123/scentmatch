import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const fragranceCount = await prisma.fragrance.count();
  const noteCount = await prisma.note.count();

  return NextResponse.json({ fragranceCount, noteCount });
}
