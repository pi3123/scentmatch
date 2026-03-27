"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "./auth-button";

const links = [
  { href: "/", label: "Score" },
  { href: "/collection", label: "Collection" },
  { href: "/profile", label: "Taste Profile" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-cream-200 bg-cream-50/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-warm-800"
        >
          ScentMatch
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-cream-200 text-warm-800"
                    : "text-warm-600 hover:bg-cream-100 hover:text-warm-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="ml-2 border-l border-cream-200 pl-2">
            <AuthButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
