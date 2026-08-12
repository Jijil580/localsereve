import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nearleo – Local Services Near You",
    short_name: "Nearleo",
    description: "Find approved local professionals, post service requests and follow replies near you.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8faf8",
    theme_color: "#0d7c59",
    orientation: "portrait-primary",
    categories: ["business", "lifestyle", "utilities"],
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
