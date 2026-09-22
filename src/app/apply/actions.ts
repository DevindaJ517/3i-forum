"use server";

import { z } from "zod";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { applicationSchema, botCheckSchema } from "@/lib/validation/application";
import { CONSENT_VERSION } from "@/lib/validation/options";
import { hashIp, verifyFormToken } from "@/lib/security/crypto";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";

export type SubmitApplicationResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Tuned for launch events: hundreds of attendees on the venue WiFi share one
// public IP, so the per-IP limit only stops floods from a single source.
// Duplicates are handled per email, and bots by the token + honeypot.
const LIMITS = {
  perIp: { limit: 120, windowMs: 10 * MINUTE },
  perEmail: { limit: 3, windowMs: 24 * HOUR },
  global: { limit: 5000, windowMs: HOUR },
};

// Returned for every accepted-looking submission, including duplicates and
// silently dropped bots, so responses never reveal whether an email is
// already registered or which anti-bot check tripped.
const SUCCESS: SubmitApplicationResult = { ok: true };

export async function submitApplication(application: unknown, botCheck: unknown): Promise<SubmitApplicationResult> {
  const { ip, userAgent } = await getRequestContext();
  const ipHash = hashIp(ip);

  // 1. Rate limits: per client, plus a global ceiling against floods.
  const perClient = ip === "unknown" ? { allowed: true } : rateLimit(`apply:ip:${ipHash}`, LIMITS.perIp);
  const global = rateLimit("apply:global", LIMITS.global);
  if (!perClient.allowed || !global.allowed) {
    return { ok: false, message: "Too many submissions. Please wait a while and try again." };
  }

  // 2. Bot checks.
  const bot = botCheckSchema.safeParse(botCheck);
  if (!bot.success) {
    return { ok: false, message: "Your session has expired. Please refresh the page and try again." };
  }
  if (bot.data.companyFax) {
    return SUCCESS; // Honeypot filled: pretend it worked, store nothing.
  }
  const token = verifyFormToken(bot.data.formToken);
  if (token === "invalid" || token === "expired") {
    return { ok: false, message: "Your session has expired. Please refresh the page and try again." };
  }
  if (token === "too-fast") {
    return { ok: false, message: "That was quick! Please review your details and submit again." };
  }

  // 3. Authoritative server-side validation of every field.
  const parsed = applicationSchema.safeParse(application);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Some details need attention. Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  const perEmail = rateLimit(`apply:email:${data.email}`, LIMITS.perEmail);
  if (!perEmail.allowed) {
    return { ok: false, message: "Too many submissions. Please wait a while and try again." };
  }

  // 4. Persist. Parameterised by the ORM, so no SQL injection surface.
  try {
    await db
      .insert(applications)
      .values({
        ...data,
        linkedinUrl: data.linkedinUrl || null,
        companyWebsite: data.companyWebsite || null,
        consentVersion: CONSENT_VERSION,
        consentedAt: new Date(),
        ipHash: ip === "unknown" ? null : ipHash,
        userAgent: userAgent || null,
      })
      .onConflictDoNothing({ target: applications.email });
  } catch (error) {
    // Log server-side only; never leak database details to the client.
    console.error("[apply] failed to save application", error);
    return { ok: false, message: "We couldn't save your application right now. Please try again shortly." };
  }

  return SUCCESS;
}
