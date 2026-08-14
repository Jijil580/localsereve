import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Nearleo: Local Services Near You",
    short_name: "Nearleo",
    description: "Find local service professionals, compare profiles and send service requests near you.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#f7faff",
    theme_color: "#1769e0",
    orientation: "portrait-primary",
    categories: ["business", "lifestyle", "utilities"],
    icons: [
      { src: "/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Find services", short_name: "Find", description: "Find local professionals near you", url: "/?service=All%20services", icons: [{ src: "/app-icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
