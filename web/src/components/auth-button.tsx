"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-16 animate-pulse rounded-lg bg-cream-200" />
    );
  }

  if (session?.user) {
    return (
      <button
        onClick={() => signOut()}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 transition-colors hover:bg-cream-100 hover:text-warm-800"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="rounded-lg bg-warm-700 px-3 py-1.5 text-sm font-medium text-cream-50 transition-colors hover:bg-warm-800"
    >
      Sign in
    </button>
  );
}
