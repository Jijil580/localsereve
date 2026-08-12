import type { MetadataRoute } from "next";
import { getKannurProviders } from "../lib/public-providers";
import { SITE_URL, findSeoServiceByName, seoServices } from "../lib/seo-services";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const updated = new Date();
  const providers = await getKannurProviders().catch(() => []);
  const kannurServices = Array.from(new Set(providers.map((provider) => provider.service)))
    .map((name) => findSeoServiceByName(name))
    .filter((service) => service !== undefined);

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
    {
      url: `${SITE_URL}/kannur`,
      lastModified: updated,
      changeFrequency: "daily",
      priority: 0.95,
    },
    ...seoServices.map((service) => ({
      url: `${SITE_URL}/services/${service.slug}`,
      lastModified: updated,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...kannurServices.map((service) => ({
      url: `${SITE_URL}/services/${service.slug}/kannur`,
      lastModified: updated,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...providers.map((provider) => ({
      url: `${SITE_URL}/professionals/${provider.id}`,
      lastModified: provider.updatedAt ?? updated,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  ];
}
