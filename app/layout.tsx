import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const description = "Where Local Experts Meet Local Customers.";
  return {
    metadataBase: base,
    title: "Nearlio – Where Local Experts Meet Local Customers",
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "Nearlio", description, type: "website", images: [{ url: new URL("/og.png", base).toString(), width: 1734, height: 907, alt: "Nearlio – Where Local Experts Meet Local Customers" }] },
    twitter: { card: "summary_large_image", title: "Nearlio", description, images: [new URL("/og.png", base).toString()] },
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
