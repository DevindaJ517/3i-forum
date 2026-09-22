# 3i Forum

A community platform for Sri Lanka's entrepreneurs, from the team behind The 3i Show.

**Phase 1 (this release):** landing page and a secure, multi-step membership application form that collects applicant details into a database.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS v4 (3i Show palette: `#fdbb2b` / `#151415`, Teko display font) |
| ORM / DB | Drizzle ORM on libSQL (SQLite file locally; Turso or Postgres in production) |
| Validation | Zod v4, one shared schema for client and server |
| Forms | react-hook-form + `@hookform/resolvers/zod` |
| Motion | Custom WebGL particle intro (~3 KB), GSAP + ScrollTrigger + SplitText, Lenis smooth scroll |

## Demo mode

If `DATABASE_URL` is not set, the app runs in **demo mode**: the whole site and form work (including validation and anti-bot checks), but applications are not saved. `APP_SECRET` is optional in demo mode. This is how the Vercel preview runs with zero configuration. Add `DATABASE_URL` + `APP_SECRET` to go live.

## Getting started

```bash
cp .env.example .env.local        # then set APP_SECRET (openssl rand -base64 48)
npm install
npm run db:migrate                # creates ./data/3i-forum.db
npm run dev                       # http://localhost:3000
```

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `db:generate` (after schema changes), `db:migrate`, `db:studio` (browse applications).

## Project layout

```
src/
  app/
    page.tsx                 Landing page
    apply/
      page.tsx               Application page (issues signed form token)
      application-form.tsx   Multi-step client form
      actions.ts             Server Action: rate limit → bot checks → validate → insert
    privacy/page.tsx         Privacy notice (draft, needs legal review)
  db/
    schema.ts                Drizzle schema (applications table)
    index.ts                 DB client
  lib/
    env.ts                   Zod-validated environment variables
    validation/              Shared Zod schema + option lists
    security/                Rate limiter, HMAC form tokens, IP hashing
  proxy.ts                   Per-request CSP with nonce
drizzle/                     SQL migrations (committed)
```

## Intro and motion

- **Intro** (`src/components/hero/`): gold particles drift in 3D while the words *Founders → Innovators → Leaders → Entrepreneurs* flash by. The particles then form a glowing "3i" and burst into a rotating particle sphere, and the hero content lands in place. It plays once per session and can be skipped. It's skipped entirely for `prefers-reduced-motion`, and a CSS failsafe reveals the page after 6 s if JavaScript is slow or fails.
- **Particles** are raw WebGL (no Three.js). All motion runs in the vertex shader. The particle count and pixel ratio scale to the device, resolution drops automatically if frames are slow, and rendering pauses when the hero is off-screen or the tab is hidden.
- **Scroll effects** are declared with data attributes (`data-anim="chars|words|reveal|stagger|line"`, `data-speed`, `data-stack-card`). See `src/components/motion/scroll-effects.tsx`.

## Security

- **Validation everywhere:** the same Zod schema runs in the browser and again in the Server Action. Inputs are normalised (NFC, control/bidi characters stripped, emails lowercased, phones in E.164, URLs forced to http(s) with no credentials). Select fields only accept whitelisted values.
- **Injection:** all queries go through the Drizzle ORM (parameterised). React escapes output; no `dangerouslySetInnerHTML`.
- **XSS / clickjacking:** strict nonce-based CSP (`src/proxy.ts`) plus HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, COOP/CORP (`next.config.ts`). `X-Powered-By` is disabled.
- **CSRF:** Server Actions accept only POST and Next.js checks the `Origin` against the host.
- **Bots and abuse:** honeypot field, HMAC-signed form token (rejects direct posts, instant submissions and stale forms), rate limits per IP, per email and globally (see the event checklist). Request body capped at 64 KB.
- **No enumeration:** duplicate emails and honeypot hits get the same success response, and nothing extra is stored.
- **Privacy (PDPA No. 9 of 2022):** explicit consent is required, and the consent version and timestamp are stored. IPs are only stored as keyed hashes. Errors are logged on the server, never shown to users.
- **Config:** env vars are validated at startup, and the app refuses to run without a strong `APP_SECRET`.

## Launch event checklist

A single Node process handled ~700 home-page loads per second at 200 concurrent connections (local load test, all served). For the event:

- [ ] Deploy to an autoscaling host (e.g. Vercel). Static assets (JS/CSS/fonts) are content-hashed and served from the CDN; the page itself is ~7 KB gzipped.
- [ ] **Use a hosted database, not the local SQLite file.** A file database won't persist or scale on serverless. Create a Turso database and set `DATABASE_URL=libsql://…` and `DATABASE_AUTH_TOKEN`. No code changes are needed.
- [ ] Rate limits are tuned for venue WiFi, where many phones share one IP: 120 per IP per 10 minutes, 3 per email per day, 5,000 per hour globally (`src/app/apply/actions.ts`).
- [ ] Test on a real phone over mobile data the day before.

## Production checklist

- [ ] Set `APP_SECRET`, `DATABASE_URL` (+ `DATABASE_AUTH_TOKEN`) in the host's secret store.
- [ ] Set `TRUST_PROXY=true` when behind Vercel / Cloudflare / nginx. Without it, per-IP rate limiting is off in production (the global limit still applies).
- [ ] For multiple instances or serverless, move the rate limiter to Redis/Upstash (`src/lib/security/rate-limit.ts`) and set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.
- [ ] Have the privacy notice reviewed by a legal advisor.
- [ ] Consider adding Cloudflare Turnstile if spam gets through.

## Roadmap

1. Admin dashboard (authentication + roles) to review, approve and export applications.
2. Member accounts and profiles.
3. Forums/chapters, events, member directory.
