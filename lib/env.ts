import { z } from "zod";

const Env = z.object({
  KICKBASE_API_BASE: z.string().url().default("https://api.kickbase.com"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be >= 32 chars"),
  NEXT_PUBLIC_APP_NAME: z.string().default("KickbaseMVP"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = Env.parse({
  KICKBASE_API_BASE: process.env.KICKBASE_API_BASE,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev_secret_change_me_at_least_32_chars__",
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  NODE_ENV: process.env.NODE_ENV,
});

export const isProd = env.NODE_ENV === "production";
