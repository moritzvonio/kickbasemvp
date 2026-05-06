/**
 * Pro entitlement — cookie-based MVP.
 *
 * After a successful Stripe checkout we set a JWE-encrypted cookie containing
 * the user id, plan, and an expiry timestamp. That's the source of truth until
 * we wire up Supabase or another DB.
 */

import { cookies } from "next/headers";
import { jwtDecrypt, EncryptJWT } from "jose";
import { createHash } from "node:crypto";
import { env, isProd } from "@/lib/env";

const COOKIE = "bb_entitlement";
const ALGO = "dir";
const ENC = "A256GCM";

export type Plan = "monthly" | "season";

export interface Entitlement {
  userId: string;
  plan: Plan;
  exp: number; // unix seconds
}

function getKey(): Uint8Array {
  // SHA-256 für robuste 32-byte-Schlüssel-Ableitung aus dem SESSION_SECRET.
  return new Uint8Array(createHash("sha256").update(env.SESSION_SECRET).digest());
}

export async function setEntitlement(e: Entitlement) {
  const jwe = await new EncryptJWT({ ...e })
    .setProtectedHeader({ alg: ALGO, enc: ENC })
    .setIssuedAt()
    .setExpirationTime(e.exp)
    .encrypt(getKey());
  const jar = await cookies();
  jar.set(COOKIE, jwe, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: new Date(e.exp * 1000),
  });
}

export async function getEntitlement(): Promise<Entitlement | null> {
  const jar = await cookies();
  const c = jar.get(COOKIE)?.value;
  if (!c) return null;
  try {
    const { payload } = await jwtDecrypt(c, getKey());
    const e = payload as unknown as Entitlement;
    if (!e.userId || !e.plan || !e.exp) return null;
    if (e.exp * 1000 < Date.now()) return null;
    return e;
  } catch {
    return null;
  }
}

export async function clearEntitlement() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function hasPro(forUserId?: string): Promise<boolean> {
  const e = await getEntitlement();
  if (!e) return false;
  if (forUserId && e.userId !== forUserId) return false;
  return true;
}
