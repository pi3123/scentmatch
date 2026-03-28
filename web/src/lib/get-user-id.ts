import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "./prisma";

export async function getUserId(): Promise<string> {
  // Try authenticated user first
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Ensure user row exists in our DB (first-login sync)
      await prisma.user.upsert({
        where: { id: user.id },
        update: { email: user.email!, name: user.user_metadata?.full_name },
        create: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name,
          image: user.user_metadata?.avatar_url,
        },
      });
      return user.id;
    }
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
