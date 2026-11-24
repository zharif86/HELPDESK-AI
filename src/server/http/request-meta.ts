import "server-only";

import { headers } from "next/headers";
import type { RequestMeta } from "@/server/access/types";

export async function getRequestMeta(): Promise<RequestMeta> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = process.env.TRUST_PROXY === "true" && forwarded ? forwarded.slice(0, 64) : null;
  const userAgent = headerList.get("user-agent")?.slice(0, 255) ?? null;
  return { ipAddress, userAgent };
}
