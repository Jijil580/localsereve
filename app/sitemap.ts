import type { MetadataRoute } from "next";
import { SITE_URL, seoServices } from "../lib/seo-services";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: updated,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...seoServices.map((service) => ({
      url: `${SITE_URL}/services/${service.slug}`,
      lastModified: updated,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
