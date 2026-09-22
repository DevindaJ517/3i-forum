import "server-only";
import { z } from "zod";

// Validated once at startup. The app refuses to run with a missing or weak
// secret instead of silently falling back to an insecure default.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, { error: "DATABASE_URL is required" }),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  APP_SECRET: z
    .string({ error: "APP_SECRET is required. Generate one with: openssl rand -base64 48" })
    .min(32, { error: "APP_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48" }),
  // Set to "true" only when running behind a proxy/CDN you control that sets
  // X-Forwarded-For (Vercel, Cloudflare, nginx). Otherwise the header is
  // client-controlled and could be spoofed to dodge rate limits.
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
