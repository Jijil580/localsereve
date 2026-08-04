import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const description = "Find, compare and book verified local service professionals with transparent pricing and trusted reviews.";
  return {
    metadataBase: base,
    title: "LocalServe — Trusted local professionals near you",
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "LocalServe", description, type: "website", images: [{ url: new URL("/og.png", base).toString(), width: 1734, height: 907, alt: "LocalServe — trusted local professionals near you" }] },
    twitter: { card: "summary_large_image", title: "LocalServe", description, images: [new URL("/og.png", base).toString()] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
