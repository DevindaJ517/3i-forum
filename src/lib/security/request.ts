import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

export async function getRequestContext() {
  const h = await headers();

  let ip = "unknown";
  if (env.TRUST_PROXY) {
    ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  } else if (env.NODE_ENV !== "production") {
    ip = "local";
  }

  const userAgent = (h.get("user-agent") ?? "").slice(0, 256);
  return { ip, userAgent };
}
