import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { JsonLd } from "@/components/seo/json-ld";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { blogCollectionSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { env } from "@/lib/env";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

const BASE = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Kickbase Tipps & Tutorials",
  description:
    "Kickbase Tipps, Trading-Guides & Marktwert-Strategien. Tutorials für Anfänger und Profis, um deine Liga zu gewinnen.",
  alternates: { canonical: `${BASE}/blog` },
  openGraph: {
    title: "Kickbase Tipps & Tutorials – LigaBase Blog",
    description:
      "Trading-Guides, Marktwert-Strategien und Einsteiger-Tutorials für Kickbase.",
    type: "website",
    locale: "de_DE",
    url: `${BASE}/blog`,
  },
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-full bg-background">
      <JsonLd
        data={[
          blogCollectionSchema(BLOG_POSTS, BASE),
          breadcrumbSchema([
            { name: "Start", url: `${BASE}/` },
            { name: "Blog", url: `${BASE}/blog` },
          ]),
        ]}
      />

      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="LigaBase Startseite">
            <Logo size={30} />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Zur App →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <BookOpen className="size-3.5" /> LigaBase Blog
          </div>
          <h1 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">
            Kickbase Tipps & Tutorials
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Trading-Guides, Marktwert-Strategien und Einsteiger-Tutorials –
            damit du deine Kickbase-Liga gewinnst. Schritt für Schritt, ohne
            Bla-bla.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {BLOG_POSTS.map((post) => {
            const soon = post.status === "coming-soon";
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="flex items-center gap-2 text-[11px] font-medium">
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 uppercase tracking-wide">
                    {post.category}
                  </span>
                  {soon && (
                    <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                      Bald verfügbar
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {post.readingMinutes} Min.
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    Lesen <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-12 text-xs text-muted-foreground">
          LigaBase ist ein unabhängiges Companion-Tool und nicht offiziell mit
          Kickbase, der DFL oder einem Bundesliga-Verein verbunden.
        </p>
      </main>
    </div>
  );
}
