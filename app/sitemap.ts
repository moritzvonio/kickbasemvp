import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { PUBLISHED_POSTS } from "@/lib/blog/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const now = new Date();
  // Nur veröffentlichte Blog-Posts (coming-soon ist noindex → nicht in Sitemap)
  const posts: MetadataRoute.Sitemap = PUBLISHED_POSTS.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt ?? p.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/news`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/upgrade`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...posts,
  ];
}
