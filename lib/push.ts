/**
 * Push subscription persistence — cookie-based MVP.
 *
 * Stores ONE web-push subscription per browser, encrypted in an httpOnly cookie.
 * When we add Supabase, swap this module for a DB-backed implementation that
 * supports multiple devices per user.
 */

import { cookies } from "next/headers";
import { jwtDecrypt, EncryptJWT } from "jose";
import { env, isProd } from "@/lib/env";

const COOKIE = "bb_push";

export interface StoredPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId: string;
  createdAt: number;
}

function getKey(): Uint8Array {
  const raw = new TextEncoder().encode(env.SESSION_SECRET);
  if (raw.length === 32) return raw;
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = raw[i % raw.length] ?? 0;
  return out;
}

export async function setPushSubscription(sub: StoredPushSubscription) {
  const jwe = await new EncryptJWT({ ...sub })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .encrypt(getKey());
  const jar = await cookies();
  jar.set(COOKIE, jwe, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getPushSubscription(): Promise<StoredPushSubscription | null> {
  const jar = await cookies();
  const c = jar.get(COOKIE)?.value;
  if (!c) return null;
  try {
    const { payload } = await jwtDecrypt(c, getKey());
    return payload as unknown as StoredPushSubscription;
  } catch {
    return null;
  }
}

export async function clearPushSubscription() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
