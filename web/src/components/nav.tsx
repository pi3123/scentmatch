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
    <header
      className="fixed top-0 left-0 w-full z-100 border-b"
      style={{
        height: 54,
        background: "rgba(250,248,245,0.88)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        borderColor: "rgba(0,0,0,0.05)",
        padding: "0 48px",
      }}
    >
      <div className="flex h-full items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] font-semibold"
          style={{ fontSize: 20, color: "#1e1812" }}
        >
          ScentMatch
        </Link>

        <nav className="flex items-center gap-8">
          {links.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="uppercase font-medium transition-[color] duration-300"
                style={{
                  fontSize: 12,
                  letterSpacing: "0.112em",
                  color: active ? "#1e1812" : "#a69279",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "#1e1812";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "#a69279";
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <AuthButton />
      </div>
    </header>
  );
}
