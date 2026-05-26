import { z } from "zod";

const Env = z.object({
  KICKBASE_API_BASE: z.string().url().default("https://api.kickbase.com"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be >= 32 chars"),
  NEXT_PUBLIC_APP_NAME: z.string().default("LigaBase"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // News-Layer (Phase 2)
  CRON_SECRET: z.string().min(16).optional(),
  DISCORD_INGEST_SECRET: z.string().optional(),
  NEWS_DISABLE_MOCKS: z.string().optional(),
});

// Production: KEIN Fallback — fehlt SESSION_SECRET wird der Build crashen
// statt mit publicly-known Default zu laufen.
const isProdBuild = process.env.NODE_ENV === "production";
const sessionSecret =
  process.env.SESSION_SECRET ??
  (isProdBuild ? undefined : "dev_secret_change_me_at_least_32_chars__");

export const env = Env.parse({
  KICKBASE_API_BASE: process.env.KICKBASE_API_BASE,
  SESSION_SECRET: sessionSecret,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  NODE_ENV: process.env.NODE_ENV,
  CRON_SECRET: process.env.CRON_SECRET,
  DISCORD_INGEST_SECRET: process.env.DISCORD_INGEST_SECRET,
  NEWS_DISABLE_MOCKS: process.env.NEWS_DISABLE_MOCKS,
});

export const isProd = env.NODE_ENV === "production";
