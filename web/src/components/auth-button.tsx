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
        className="text-brown-light hover:text-brown text-[12px] uppercase tracking-[0.094em] font-medium transition-colors"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="bg-brown text-cream-50 rounded py-[7px] px-[18px] text-[12px] uppercase tracking-[0.094em] font-medium transition-colors hover:bg-[#2a2218]"
    >
      Sign in
    </button>
  );
}
