import "server-only";

// Fixed-window in-memory rate limiter. Good enough for a single server
// instance. When the app runs on several instances (or serverless), swap the
// store for Redis/Upstash so limits are shared; the interface stays the same.

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as { rateLimitStore?: Map<string, Bucket> };
const store = (globalStore.rateLimitStore ??= new Map<string, Bucket>());

const MAX_KEYS = 10_000;

function sweep(now: number) {
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  if (store.size > MAX_KEYS) sweep(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}
