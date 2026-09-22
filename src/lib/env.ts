import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";

// Validated once at startup.
//
// Two modes:
// - Live (DATABASE_URL set): applications are saved, and a strong APP_SECRET
//   is mandatory. The app refuses to start without one.
// - Demo (no DATABASE_URL): the full site and form work, including all
//   validation and anti-bot checks, but nothing is stored. Useful for
//   previews and presentations.

// Treat unset and empty-string variables the same (hosting dashboards often
// save blank fields as "").
const optional = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: optional,
  DATABASE_AUTH_TOKEN: optional,
  APP_SECRET: optional,
  // Set to "true" only when running behind a proxy/CDN you control that sets
  // X-Forwarded-For (Vercel, Cloudflare, nginx). Otherwise the header is
  // client-controlled and could be spoofed to dodge rate limits.
  TRUST_PROXY: optional.transform((v) => v?.trim().toLowerCase() === "true"),
  VERCEL: optional,
  VERCEL_DEPLOYMENT_ID: optional,
  VERCEL_GIT_COMMIT_SHA: optional,
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}
const raw = parsed.data;

export const DEMO_MODE = !raw.DATABASE_URL;

function resolveSecret(): string {
  if (raw.APP_SECRET && raw.APP_SECRET.length >= 32) return raw.APP_SECRET;

  if (!DEMO_MODE) {
    throw new Error(
      "Invalid environment configuration:\n  - APP_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48",
    );
  }

  // Demo only: derive a secret that is stable across all server instances of
  // this deployment, so form tokens verify wherever the request lands. It is
  // not confidential, which is acceptable only because demo mode stores no data.
  const seed = raw.VERCEL_DEPLOYMENT_ID ?? raw.VERCEL_GIT_COMMIT_SHA ?? "local";
  return createHash("sha256").update(`3i-forum-demo:${seed}`).digest("base64url");
}

export const env = {
  NODE_ENV: raw.NODE_ENV,
  DATABASE_URL: raw.DATABASE_URL,
  DATABASE_AUTH_TOKEN: raw.DATABASE_AUTH_TOKEN,
  APP_SECRET: resolveSecret(),
  // On Vercel the forwarding headers are set by the platform and can be trusted.
  TRUST_PROXY: raw.TRUST_PROXY || raw.VERCEL === "1",
};

if (DEMO_MODE && raw.NODE_ENV === "production") {
  console.warn("[3i-forum] DEMO MODE: DATABASE_URL is not set, so applications will NOT be saved.");
}
