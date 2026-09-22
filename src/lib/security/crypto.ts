import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

function hmac(purpose: string, value: string) {
  return createHmac("sha256", env.APP_SECRET).update(`${purpose}:${value}`).digest("base64url");
}

// Keyed hash so stored IPs can be compared (abuse tracking) but not reversed.
export function hashIp(ip: string) {
  return hmac("ip", ip);
}

// Signed timestamp embedded in the form when the page renders. On submit we
// check the signature and that a human-plausible amount of time has passed.
// Bots that post directly without loading the page, or submit instantly,
// are rejected.
const MIN_FILL_MS = 4_000;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function createFormToken(now = Date.now()) {
  const issued = String(now);
  return `${issued}.${hmac("form", issued)}`;
}

export type FormTokenCheck = "ok" | "invalid" | "too-fast" | "expired";

export function verifyFormToken(token: string, now = Date.now()): FormTokenCheck {
  const [issued, signature] = token.split(".");
  if (!issued || !signature || !/^\d{13}$/.test(issued)) return "invalid";

  const expected = Buffer.from(hmac("form", issued));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return "invalid";

  const age = now - Number(issued);
  if (age < MIN_FILL_MS) return "too-fast";
  if (age > MAX_AGE_MS) return "expired";
  return "ok";
}
