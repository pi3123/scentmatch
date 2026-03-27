import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function getUserId(): Promise<string> {
  // Try authenticated user first
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) return session.user.id;
  } catch {
    // auth not configured, fall through
  }

  // Per-browser anonymous user via cookie
  const cookieStore = await cookies();
  let anonId = cookieStore.get("scentmatch_uid")?.value;

  if (!anonId) {
    anonId = `anon-${crypto.randomUUID()}`;
    cookieStore.set("scentmatch_uid", anonId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  // Ensure user row exists
  await prisma.user.upsert({
    where: { id: anonId },
    update: {},
    create: {
      id: anonId,
      email: `${anonId}@scentmatch.local`,
      name: "Guest",
    },
  });

  return anonId;
}
