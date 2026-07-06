import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { getRecentNews } from "@/lib/news/store";
import { getPlayerIndex } from "@/lib/news/player-index";
import { NewsStream } from "@/components/news/news-stream";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "Bundesliga-News für Kickbase-Manager",
  description:
    "Aktuelle News, Verletzungen, Aufstellungen und Transfers – für deine Kickbase-Strategie. Kostenlos, ohne Account.",
  alternates: {
    canonical: "/news",
    types: { "application/rss+xml": "/news/feed.xml" },
  },
  openGraph: {
    title: "Bundesliga-News · Ligabase",
    description:
      "Aktuelle Bundesliga-News, Verletzungen und Transfers für Kickbase-Manager.",
    type: "website",
  },
};

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function PublicNewsPage() {
  const [items, idx] = await Promise.all([
    getRecentNews({ limit: 50 }),
    getPlayerIndex(),
  ]);

  const playerNameMap: Record<
    string,
    { name: string; pim?: string; tid?: string }
  > = {};
  for (const [pid, meta] of Object.entries(idx.byPlayerId)) {
    playerNameMap[pid] = { name: meta.name, pim: meta.pim, tid: meta.tid };
  }

  // Schema.org structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Bundesliga-News für Kickbase-Manager",
    itemListElement: items.slice(0, 20).map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "NewsArticle",
        headline: item.title,
        url: item.url,
        datePublished: item.publishedAt.toISOString(),
        publisher: { "@type": "Organization", name: item.sourceDisplayName },
      },
    })),
  };

  return (
    <>
      <AppHeader />
      <main className="container mx-auto max-w-3xl py-8 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 mb-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Newspaper className="size-5" />
          </span>
          News
        </h1>
        <p className="text-sm text-muted-foreground mb-2">
          Aktuelle Bundesliga-News, frisch aus offiziellen Vereins- und
          Medienquellen. Aggregiert für Kickbase-Manager.
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Mit Kickbase einloggen für Liga-Filter →
          </Link>
          <span>·</span>
          <a href="/news/feed.xml" className="hover:underline">
            RSS-Feed
          </a>
        </div>
      </header>

      <NewsStream
        initialItems={items}
        playerNameMap={playerNameMap}
        showFilters={false}
      />
      </main>
    </>
  );
}
