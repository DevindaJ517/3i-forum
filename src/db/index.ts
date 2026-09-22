import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/lib/env";
import * as schema from "./schema";

function createDb(url: string) {
  // Reuse one client across hot reloads in development.
  const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> };
  const client = globalForDb.libsql ?? createClient({ url, authToken: env.DATABASE_AUTH_TOKEN });
  if (env.NODE_ENV !== "production") globalForDb.libsql = client;
  return drizzle(client, { schema });
}

// Null in demo mode (no DATABASE_URL): callers must skip persistence.
export const db = env.DATABASE_URL ? createDb(env.DATABASE_URL) : null;
