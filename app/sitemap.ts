import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/news`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/upgrade`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
