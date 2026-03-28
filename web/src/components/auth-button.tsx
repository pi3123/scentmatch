"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading) {
    return (
      <div className="h-8 w-16 animate-pulse rounded-lg bg-cream-200" />
    );
  }

  if (user) {
    return (
      <button
        onClick={() => supabase.auth.signOut()}
        className="text-brown-light hover:text-brown text-[12px] uppercase tracking-[0.094em] font-medium transition-colors"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      }
      className="bg-brown text-cream-50 rounded py-[7px] px-[18px] text-[12px] uppercase tracking-[0.094em] font-medium transition-colors hover:bg-[#2a2218]"
    >
      Sign in
    </button>
  );
}
