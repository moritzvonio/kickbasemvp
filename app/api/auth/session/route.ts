import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ authenticated: false }, { status: 200 });
  return NextResponse.json({
    authenticated: true,
    user: { id: s.userId, name: s.name ?? null, email: s.email ?? null },
    expiresAt: new Date(s.exp * 1000).toISOString(),
  });
}
