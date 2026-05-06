/**
 * Discord-Webhook-Empfänger (PLATZHALTER).
 *
 * Mourice setzt später einen Discord-Server auf. Mods melden News in einen
 * Channel, Discord-Webhook hittet diesen Endpoint mit unserem Secret.
 *
 * Headers:
 *   x-discord-secret: <DISCORD_INGEST_SECRET>
 *
 * Body:
 *   { content: string, author: string, url?, imageUrl?, clubSlug?, timestamp? }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { storeIfNew } from "@/lib/news/store";
import { tagItem, registerSource } from "@/lib/news/tagger";

export const runtime = "nodejs";

const Body = z.object({
  content: z.string().min(10).max(2000),
  author: z.string().min(1).max(80),
  url: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  clubSlug: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const expected = process.env.DISCORD_INGEST_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "DISCORD_INGEST_NOT_CONFIGURED" },
      { status: 503 }
    );
  }
  const secret = req.headers.get("x-discord-secret");
  if (secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "invalid_body", message: e instanceof Error ? e.message : "bad" },
      { status: 400 }
    );
  }

  const sourceId = `community-${body.author.toLowerCase().replace(/[^\w-]/g, "")}`;
  registerSource(sourceId, body.author, "community", body.clubSlug);

  const id = `disc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tagged = await tagItem({
    externalId: id,
    title: body.content.slice(0, 120),
    body: body.content,
    url: body.url ?? `https://betterbase.vercel.app/news#${id}`,
    publishedAt: body.timestamp ? new Date(body.timestamp) : new Date(),
    imageUrl: body.imageUrl,
    sourceId,
  });
  // Override clubSlug if provided
  if (body.clubSlug) tagged.clubSlug = body.clubSlug;

  const wasStored = await storeIfNew(tagged);
  return NextResponse.json({ ok: true, stored: wasStored, id });
}
