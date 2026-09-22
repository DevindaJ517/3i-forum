import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  APPLICATION_STATUSES,
  DISTRICTS,
  EMPLOYEE_RANGES,
  INDUSTRIES,
  REFERRAL_SOURCES,
  REVENUE_RANGES,
} from "@/lib/validation/options";

export const applications = sqliteTable(
  "applications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    status: text("status", { enum: APPLICATION_STATUSES }).notNull().default("pending"),

    // Personal
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    district: text("district", { enum: DISTRICTS }).notNull(),
    city: text("city").notNull(),
    linkedinUrl: text("linkedin_url"),

    // Business
    companyName: text("company_name").notNull(),
    designation: text("designation").notNull(),
    industry: text("industry", { enum: INDUSTRIES }).notNull(),
    companyWebsite: text("company_website"),
    yearFounded: integer("year_founded").notNull(),
    employeeRange: text("employee_range", { enum: EMPLOYEE_RANGES }).notNull(),
    revenueRange: text("revenue_range", { enum: REVENUE_RANGES }).notNull(),

    // Goals
    interests: text("interests", { mode: "json" }).$type<string[]>().notNull(),
    referralSource: text("referral_source", { enum: REFERRAL_SOURCES }).notNull(),
    motivation: text("motivation").notNull(),

    // Consent (PDPA No. 9 of 2022): what was agreed to, which wording, and when.
    consentPdpa: integer("consent_pdpa", { mode: "boolean" }).notNull(),
    consentMarketing: integer("consent_marketing", { mode: "boolean" }).notNull().default(false),
    consentVersion: text("consent_version").notNull(),
    consentedAt: integer("consented_at", { mode: "timestamp" }).notNull(),

    // Audit. The IP is stored only as a keyed hash, never in plain text.
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("applications_email_unique").on(t.email),
    index("applications_status_idx").on(t.status),
    index("applications_created_at_idx").on(t.createdAt),
  ],
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
