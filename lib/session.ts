import { cookies } from "next/headers";
import { jwtDecrypt, EncryptJWT } from "jose";
import { createHash } from "node:crypto";
import { env, isProd } from "@/lib/env";

const COOKIE_NAME = "bb_session";
const ALGO = "dir";
const ENC = "A256GCM";

function getKey(): Uint8Array {
  // SHA-256 produces a uniform 32-byte key from any secret length —
  // robust gegen schwache/short/weak SESSION_SECRET-Werte (besser als
  // byte-modulo padding das die Entropie nicht erhöht).
  return new Uint8Array(createHash("sha256").update(env.SESSION_SECRET).digest());
}

export interface SessionPayload {
  /** Kickbase bearer token (JWT) */
  token: string;
  /** Kickbase user id */
  userId: string;
  /** Display name */
  name?: string;
  /** Email (only stored for UX, not auth) */
  email?: string;
  /** When the Kickbase token expires (unix seconds) */
  exp: number;
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return await new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: ALGO, enc: ENC })
    .setIssuedAt()
    .setExpirationTime(payload.exp)
    .encrypt(getKey());
}

export async function decryptSession(jwe: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtDecrypt(jwe, getKey());
    if (!payload || typeof payload !== "object") return null;
    const p = payload as unknown as SessionPayload;
    if (!p.token || !p.userId) return null;
    if (p.exp && p.exp * 1000 < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const jwe = await encryptSession(payload);
  const jar = await cookies();
  jar.set(COOKIE_NAME, jwe, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: new Date(payload.exp * 1000),
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const c = jar.get(COOKIE_NAME);
  if (!c?.value) return null;
  return decryptSession(c.value);
}

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export const SESSION_COOKIE = COOKIE_NAME;

/** Decode a Kickbase JWT (no verification) to read kb.uid, kb.name, exp etc. */
export function decodeKickbaseToken(token: string): {
  uid?: string;
  name?: string;
  exp?: number;
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const json = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return {
      uid: json["kb.uid"] ?? json.sub,
      name: json["kb.name"],
      exp: json.exp,
    };
  } catch {
    return {};
  }
}
