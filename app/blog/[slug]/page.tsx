import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { JsonLd } from "@/components/seo/json-ld";
import { BLOG_POSTS, getPost, type BlogSection } from "@/lib/blog/posts";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { env } from "@/lib/env";
import { Clock, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

const BASE = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Nicht gefunden" };
  const url = `${BASE}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    // Stub-Posts (noch ohne ausführlichen Inhalt) nicht indexieren →
    // kein Thin-Content. Wird automatisch indexierbar, sobald published.
    robots:
      post.status === "coming-soon" ? { index: false, follow: true } : undefined,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: "de_DE",
      url,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.category === post.category
  ).slice(0, 2);

  return (
    <div className="min-h-full bg-background">
      <JsonLd
        data={[
          blogPostingSchema(post, BASE),
          breadcrumbSchema([
            { name: "Start", url: `${BASE}/` },
            { name: "Blog", url: `${BASE}/blog` },
            { name: post.title, url: `${BASE}/blog/${post.slug}` },
          ]),
        ]}
      />

      <header className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Ligabase Startseite">
            <Logo size={30} />
          </Link>
          <Link href="/blog" className="text-sm font-medium text-primary hover:underline">
            ← Alle Tutorials
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 uppercase tracking-wide">
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3.5" /> {post.readingMinutes} Min. Lesezeit
          </span>
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          {post.title}
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
          {post.excerpt}
        </p>

        {post.body && post.body.length > 0 ? (
          <>
            <PostBody sections={post.body} />
            {post.sources && post.sources.length > 0 && (
              <section className="mt-12 border-t border-border/60 pt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Quellen
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {post.sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-words"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
              ✍️ Der ausführliche Guide erscheint in Kürze. Hier ist der geplante
              Aufbau – schau bald wieder vorbei oder starte direkt mit Ligabase.
            </div>
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Das erwartet dich</h2>
              <ul className="mt-4 space-y-2.5">
                {post.outline.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                    <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <div className="mt-10 rounded-2xl border border-border bg-gradient-to-br from-emerald-50/60 to-transparent p-6 text-center">
          <p className="font-semibold">Direkt ausprobieren statt nur lesen?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ligabase zeigt dir Marktwert-Prognosen, Gebots-Empfehlungen und
            Live-Statistiken für deine Liga – kostenlos.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Mit Kickbase einloggen <ArrowRight className="size-4" />
          </Link>
        </div>

        {related.length > 0 && (
          <section className="mt-12 border-t border-border/60 pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Mehr zum Thema
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group rounded-xl border border-border p-4 hover:border-primary/40 transition-colors"
                >
                  <span className="font-medium leading-snug group-hover:text-primary transition-colors">
                    {r.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
            <ArrowLeft className="size-4" /> Zurück zu allen Tutorials
          </Link>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Ligabase ist ein unabhängiges Companion-Tool und nicht offiziell mit
          Kickbase, der DFL oder einem Bundesliga-Verein verbunden.
        </p>
      </main>
    </div>
  );
}

function PostBody({ sections }: { sections: BlogSection[] }) {
  return (
    <div className="mt-8">
      {sections.map((sec) => (
        <section key={sec.h2} className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3 scroll-mt-20">
            {sec.h2}
          </h2>
          {sec.blocks.map((b, i) => {
            switch (b.type) {
              case "p":
                return (
                  <p key={i} className="text-[15px] leading-relaxed text-foreground/90 mb-4">
                    {b.text}
                  </p>
                );
              case "ul":
                return (
                  <ul key={i} className="list-disc ml-5 space-y-1.5 mb-4 text-[15px] text-foreground/90">
                    {b.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                );
              case "ol":
                return (
                  <ol key={i} className="list-decimal ml-5 space-y-1.5 mb-4 text-[15px] text-foreground/90">
                    {b.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ol>
                );
              case "tip":
                return (
                  <div key={i} className="rounded-xl border border-primary/20 bg-primary/[0.05] p-4 mb-4 text-[15px] leading-relaxed">
                    <span className="font-semibold text-primary">💡 Tipp: </span>
                    {b.text}
                  </div>
                );
              case "quote":
                return (
                  <blockquote key={i} className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground mb-4">
                    {b.text}
                    {b.cite && <span className="block not-italic text-xs mt-1">– {b.cite}</span>}
                  </blockquote>
                );
            }
          })}
        </section>
      ))}
    </div>
  );
}
