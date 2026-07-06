/**
 * schema.org JSON-LD-Builder für SEO & GEO.
 * Strukturierte Daten helfen Google (Rich Results) UND AI-Suchmaschinen,
 * die Seite korrekt zu verstehen und zu zitieren.
 */
import { FAQ_ITEMS } from "./faq-data";
import type { BlogPost } from "@/lib/blog/posts";

type Json = Record<string, unknown>;

const ORG = (base: string): Json => ({
  "@type": "Organization",
  "@id": `${base}/#organization`,
  name: "Ligabase",
  url: base,
  logo: `${base}/icons/icon-512.svg`,
  description:
    "Ligabase ist ein unabhängiges Companion-Tool für Kickbase mit Marktwert-Prognosen, Transfer-Advisor, Live-Punkten und Liga-Statistiken.",
});

export function organizationSchema(base: string): Json {
  return { "@context": "https://schema.org", ...ORG(base) };
}

export function softwareApplicationSchema(base: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Ligabase",
    url: base,
    applicationCategory: "SportsApplication",
    operatingSystem: "Web, iOS, Android (PWA)",
    inLanguage: "de-DE",
    isAccessibleForFree: true,
    description:
      "Kickbase-Tool mit Marktwert-Prognosen, Transfer- & Gebots-Advisor, Live-Punkten, Top-50-Rangliste und Teamwert-Vergleich seit Saisonstart.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: ORG(base),
  };
}

export function faqPageSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function blogPostingSchema(post: BlogPost, base: string): Json {
  const url = `${base}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: "de-DE",
    author: ORG(base),
    publisher: {
      "@type": "Organization",
      name: "Ligabase",
      logo: { "@type": "ImageObject", url: `${base}/icons/icon-512.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    keywords: post.keyword,
  };
}

export function blogCollectionSchema(posts: BlogPost[], base: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Ligabase Blog – Kickbase Tipps & Tutorials",
    url: `${base}/blog`,
    inLanguage: "de-DE",
    publisher: ORG(base),
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${base}/blog/${p.slug}`,
      datePublished: p.publishedAt,
    })),
  };
}
