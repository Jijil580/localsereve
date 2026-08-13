import "server-only";

import { cache } from "react";
import { ObjectId, type Document } from "mongodb";
import { getMongoDb } from "./mongodb";

export type PublicProvider = {
  id: string;
  name: string;
  business: string;
  service: string;
  locality: string;
  description: string;
  verified: boolean;
  available: boolean;
  emergency: boolean;
  experience: number;
  startingPrice: number;
  rating: number;
  reviews: number;
  likes: number;
  completedJobs: number;
  initials: string;
  photoUrl: string | null;
  portfolioUrls: string[];
  phone: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  updatedAt: Date | null;
};

const publicProjection = {
  name: 1,
  businessName: 1,
  service: 1,
  locality: 1,
  description: 1,
  verified: 1,
  available: 1,
  emergency: 1,
  experienceYears: 1,
  startingPrice: 1,
  averageRating: 1,
  reviewCount: 1,
  likeCount: 1,
  completedJobs: 1,
  initials: 1,
  profilePhotoId: 1,
  portfolioImageIds: 1,
  userId: 1,
  phone: 1,
  contactEmail: 1,
  instagramUrl: 1,
  facebookUrl: 1,
  youtubeUrl: 1,
  updatedAt: 1,
} as const;

const publishedProviderFilter = {
  status: { $ne: "disabled" },
  published: { $ne: false },
  service: { $exists: true, $ne: "" },
  phone: { $exists: true, $ne: "" },
};

const kannurLocalityPattern = /kannur|mattannur|iritty|thalassery|payyannur|taliparamba|koothuparamba/i;

function toPublicProvider(row: Document, emailFallback = ""): PublicProvider {
  const id = String(row._id);
  const name = String(row.name ?? "Local professional");
  const portfolioIds = Array.isArray(row.portfolioImageIds) ? row.portfolioImageIds.slice(0, 4) : [];
  return {
    id,
    name,
    business: String(row.businessName ?? name),
    service: String(row.service ?? "Local service"),
    locality: String(row.locality ?? "Kannur"),
    description: String(row.description ?? "").trim(),
    verified: Boolean(row.verified),
    available: Boolean(row.available),
    emergency: Boolean(row.emergency),
    experience: Math.max(0, Number(row.experienceYears ?? 0)),
    startingPrice: Math.max(0, Number(row.startingPrice ?? 0)),
    rating: Math.max(0, Number(row.averageRating ?? 0)),
    reviews: Math.max(0, Number(row.reviewCount ?? 0)),
    likes: Math.max(0, Number(row.likeCount ?? 0)),
    completedJobs: Math.max(0, Number(row.completedJobs ?? 0)),
    initials: String(row.initials ?? name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("") ?? "LS"),
    photoUrl: row.profilePhotoId ? `/api/providers/photo/${id}` : portfolioIds.length ? `/api/providers/portfolio/${id}/0` : null,
    portfolioUrls: portfolioIds.map((_imageId: unknown, index: number) => `/api/providers/portfolio/${id}/${index}`),
    phone: String(row.phone ?? ""),
    email: String(row.contactEmail ?? emailFallback),
    instagramUrl: String(row.instagramUrl ?? ""),
    facebookUrl: String(row.facebookUrl ?? ""),
    youtubeUrl: String(row.youtubeUrl ?? ""),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : null,
  };
}

export function displayKannurLocality(locality: string) {
  const normalized = locality.trim();
  if (/kannur/i.test(normalized)) return normalized;
  if (/mattannur/i.test(normalized)) return "Mattannur, Kannur, Kerala";
  if (/iritty/i.test(normalized)) return "Iritty, Kannur, Kerala";
  if (/thalassery/i.test(normalized)) return "Thalassery, Kannur, Kerala";
  if (/payyannur/i.test(normalized)) return "Payyannur, Kannur, Kerala";
  if (/taliparamba/i.test(normalized)) return "Taliparamba, Kannur, Kerala";
  if (/koothuparamba/i.test(normalized)) return "Koothuparamba, Kannur, Kerala";
  return normalized;
}

export const getKannurProviders = cache(async (service?: string): Promise<PublicProvider[]> => {
  const db = await getMongoDb();
  const filter: Record<string, unknown> = {
    ...publishedProviderFilter,
    locality: { $regex: kannurLocalityPattern },
  };
  if (service) filter.service = service;
  const rows = await db.collection("providers").find(filter, { projection: publicProjection }).sort({ verified: -1, averageRating: -1, updatedAt: -1 }).limit(200).toArray();
  return rows.map(row => toPublicProvider(row));
});

export const getPublicProvider = cache(async (id: string): Promise<PublicProvider | null> => {
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const row = await db.collection("providers").findOne({ ...publishedProviderFilter, _id: new ObjectId(id) }, { projection: publicProjection });
  if (!row) return null;
  const account = row.userId instanceof ObjectId ? await db.collection("users").findOne({ _id: row.userId }, { projection: { email: 1 } }) : null;
  return toPublicProvider(row, String(account?.email ?? ""));
});
