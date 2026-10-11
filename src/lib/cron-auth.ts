import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

/** `Authorization: Bearer <CRON_SECRET>`, compared in constant time. */
export function isCronAuthorised(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return timingSafeEqual(sha256(header), sha256(`Bearer ${secret}`));
}
