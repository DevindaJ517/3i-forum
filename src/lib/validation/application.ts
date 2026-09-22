import { z } from "zod";
import {
  DISTRICTS,
  EMPLOYEE_RANGES,
  INDUSTRIES,
  INTERESTS,
  REFERRAL_SOURCES,
  REVENUE_RANGES,
} from "./options";

// This schema is the single source of truth for the membership application.
// The client uses it for instant feedback; the server action re-runs it on
// every submission, so client-side checks are never trusted on their own.

// Strip ASCII control characters (keeping \n and \t for multi-line fields)
// and Unicode bidi overrides that can be used to spoof text.
const CONTROL_CHARS = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u202A-\\u202E\\u2066-\\u2069]", "g");

const clean = (value: string) => value.normalize("NFC").replace(CONTROL_CHARS, "").trim();
const cleanLine = (value: string) => clean(value).replace(/\s+/g, " ");

const singleLine = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required` })
    .transform(cleanLine)
    .pipe(
      z
        .string()
        .min(1, { error: `${label} is required` })
        .min(min, { error: `${label} must be at least ${min} characters` })
        .max(max, { error: `${label} must be at most ${max} characters` }),
    );

// Letters in any script (Sinhala, Tamil, Latin...), combining marks, spaces,
// apostrophes, hyphens and dots.
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

const personName = (label: string) =>
  singleLine(label, 1, 60).pipe(
    z.string().regex(PERSON_NAME, { error: `${label} can only contain letters, spaces, hyphens and apostrophes` }),
  );

const oneOf = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z.enum(values, { error: message });

// Accepts common Sri Lankan formats (077 123 4567, +94 77 123 4567, 0094...)
// and international numbers, and normalises everything to E.164.
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[\s().-]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (/^0\d{9}$/.test(digits)) digits = `+94${digits.slice(1)}`;
  return digits;
}

const phone = z
  .string({ error: "Phone number is required" })
  .transform((v) => normalizePhone(clean(v)))
  .pipe(
    z
      .string()
      .min(1, { error: "Phone number is required" })
      .regex(/^\+[1-9]\d{7,14}$/, { error: "Enter a valid phone number, e.g. 077 123 4567 or +94 77 123 4567" })
      .refine((v) => !v.startsWith("+94") || /^\+94\d{9}$/.test(v), {
        error: "Sri Lankan numbers must have 9 digits after +94",
      }),
  );

const httpUrl = (label: string, { hosts }: { hosts?: string[] } = {}) =>
  z
    .string()
    .transform((v) => {
      const trimmed = cleanLine(v);
      if (!trimmed) return trimmed;
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    })
    .pipe(
      z
        .string()
        .max(200, { error: `${label} must be at most 200 characters` })
        .refine(
          (v) => {
            if (!v) return true;
            try {
              const url = new URL(v);
              if (url.protocol !== "https:" && url.protocol !== "http:") return false;
              if (url.username || url.password) return false;
              if (!url.hostname.includes(".")) return false;
              if (hosts) {
                return hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
              }
              return true;
            } catch {
              return false;
            }
          },
          { error: hosts ? `Enter a valid ${label} URL (${hosts[0]})` : `Enter a valid ${label} URL` },
        ),
    );

const currentYear = () => new Date().getFullYear();

export const personalSchema = z.object({
  firstName: personName("First name"),
  lastName: personName("Last name"),
  email: z
    .string({ error: "Email is required" })
    .transform((v) => clean(v).toLowerCase())
    .pipe(z.email({ error: "Enter a valid email address" }).max(254, { error: "Email is too long" })),
  phone,
  district: oneOf(DISTRICTS, "Select your district"),
  city: singleLine("City", 2, 60),
  linkedinUrl: httpUrl("LinkedIn", { hosts: ["linkedin.com"] }),
});

export const businessSchema = z.object({
  companyName: singleLine("Company name", 2, 120),
  designation: singleLine("Designation", 2, 80),
  industry: oneOf(INDUSTRIES, "Select an industry"),
  companyWebsite: httpUrl("website"),
  yearFounded: z
    .number({ error: "Enter the year your company was founded" })
    .int({ error: "Enter a whole year" })
    .min(1900, { error: "Year must be 1900 or later" })
    .refine((y) => y <= currentYear(), { error: "Year cannot be in the future" }),
  employeeRange: oneOf(EMPLOYEE_RANGES, "Select your team size"),
  revenueRange: oneOf(REVENUE_RANGES, "Select your annual revenue range"),
});

export const goalsSchema = z.object({
  interests: z
    .array(z.enum(INTERESTS), { error: "Select at least one interest" })
    .min(1, { error: "Select at least one interest" })
    .max(INTERESTS.length)
    .transform((v) => Array.from(new Set(v))),
  referralSource: oneOf(REFERRAL_SOURCES, "Tell us how you heard about us"),
  motivation: z
    .string({ error: "Tell us a little about yourself" })
    .transform(clean)
    .pipe(
      z
        .string()
        .min(50, { error: "Please write at least 50 characters" })
        .max(1500, { error: "Please keep it under 1500 characters" }),
    ),
  consentPdpa: z.boolean().refine((v) => v === true, {
    error: "You must agree to the processing of your personal data to apply",
  }),
  consentMarketing: z.boolean(),
});

export const applicationSchema = personalSchema.extend(businessSchema.shape).extend(goalsSchema.shape);

export type ApplicationInput = z.input<typeof applicationSchema>;
export type ApplicationData = z.output<typeof applicationSchema>;

// Field groups for the multi-step form. Step validation on the client uses
// these; the server always validates the full schema.
const fieldsOf = (schema: z.ZodObject) => Object.keys(schema.shape) as (keyof ApplicationInput)[];

export const APPLICATION_STEPS = [
  { title: "About you", fields: fieldsOf(personalSchema) },
  { title: "Your business", fields: fieldsOf(businessSchema) },
  { title: "Your goals", fields: fieldsOf(goalsSchema) },
];

// Anti-bot fields sent alongside the application but validated separately.
export const botCheckSchema = z.object({
  formToken: z.string().max(200),
  // Honeypot: hidden from humans, must stay empty.
  companyFax: z.string().max(200).optional(),
});
