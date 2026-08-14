import type { Metadata } from "next";
import { SITE_URL } from "../lib/seo-services";
import InitialLoadingScreen from "./initial-loading-screen";
import PwaInstall from "./pwa-install";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const description =
  "Find plumbers, electricians, carpenters, cleaners and other local service professionals near you. Compare profiles, prices and verification status, then send a service request on Nearleo.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nearleo | Find Trusted Local Service Professionals Near You",
    template: "%s | Nearleo",
  },
  description,
  applicationName: "Nearleo",
  authors: [{ name: "Lumier Technologies" }],
  creator: "Lumier Technologies",
  publisher: "Lumier Technologies",
  category: "Local services marketplace",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Nearleo" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/nearleo-favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Nearleo | Find Local Service Professionals Near You",
    description,
    url: SITE_URL,
    siteName: "Nearleo",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-blue.png",
        width: 1734,
        height: 907,
        alt: "Nearleo - Where Local Experts Meet Local Customers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nearleo | Find Local Service Professionals Near You",
    description,
    images: ["/og-blue.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1769e0" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/nearleo-favicon-96.png" type="image/png" sizes="96x96" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <InitialLoadingScreen />
        {children}
        <PwaInstall />
      </body>
    </html>
  );
}
