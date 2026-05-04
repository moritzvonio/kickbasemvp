import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  setPushSubscription,
  clearPushSubscription,
  getPushSubscription,
} from "@/lib/push";

export const runtime = "nodejs";

const Body = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function GET() {
  const sub = await getPushSubscription();
  return NextResponse.json({ subscribed: !!sub });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  await setPushSubscription({
    endpoint: body.endpoint,
    keys: body.keys,
    userId: s.userId,
    createdAt: Math.floor(Date.now() / 1000),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  await clearPushSubscription();
  return NextResponse.json({ ok: true });
}
