// Option lists shared by the form UI, the Zod schema, and the database layer.
// Changing a value here changes what the server will accept.

export const DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
  "Outside Sri Lanka",
] as const;

export const INDUSTRIES = [
  "Agriculture & Plantation",
  "Apparel & Textiles",
  "Banking & Financial Services",
  "Construction & Real Estate",
  "Education",
  "Energy & Utilities",
  "FMCG & Retail",
  "Healthcare & Pharma",
  "Hospitality & Tourism",
  "IT & Software",
  "Logistics & Transport",
  "Manufacturing",
  "Media & Creative",
  "Professional Services",
  "Telecommunications",
  "Other",
] as const;

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const REVENUE_RANGES = [
  "Pre-revenue",
  "Under LKR 50M",
  "LKR 50M - 150M",
  "LKR 150M - 300M",
  "LKR 300M - 1B",
  "Above LKR 1B",
] as const;

export const INTERESTS = [
  "Peer learning forums",
  "Mentorship",
  "Networking events",
  "Investment & funding",
  "Global connections",
  "Speaking & visibility",
] as const;

export const REFERRAL_SOURCES = [
  "The 3i Show podcast",
  "Social media",
  "Friend or member referral",
  "Event",
  "Search engine",
  "Other",
] as const;

export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;

// Bump this whenever the consent wording on the form changes, so every stored
// application records exactly which version the applicant agreed to.
export const CONSENT_VERSION = "2026-09-22";
