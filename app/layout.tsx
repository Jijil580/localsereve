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
    title: "LumNearo – Where Local Experts Meet Local Customers",
    description,
    applicationName: "LumNearo",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: "LumNearo" },
    formatDetection: { telephone: false },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "LumNearo", description, type: "website", images: [{ url: new URL("/og.png", base).toString(), width: 1734, height: 907, alt: "LumNearo – Where Local Experts Meet Local Customers" }] },
    twitter: { card: "summary_large_image", title: "LumNearo", description, images: [new URL("/og.png", base).toString()] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head><meta name="theme-color" content="#0d7c59"/><link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous"/></head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
