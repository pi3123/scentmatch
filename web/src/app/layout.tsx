import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "ScentMatch - Blind Buy Confidence",
  description:
    "Score how likely you are to love a fragrance before buying it blind.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-brown">
        <Providers>
          <Nav />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
