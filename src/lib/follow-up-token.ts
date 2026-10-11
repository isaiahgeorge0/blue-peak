import { createHmac, timingSafeEqual } from "node:crypto";

/*
  Stop-link tokens: the lead's id and a truncated HMAC of it, base64url.
  Without the secret a token can't be made or altered, so a link can only
  ever pause the lead it was sent to.
*/

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAC_BYTES = 16;

/** Separates this use of the base secret from any other. */
function linkKey(secret: string) {
  return createHmac("sha256", secret).update("blue-peak:follow-up-stop-link:v1").digest();
}

function mac(idBytes: Buffer, secret: string) {
  return createHmac("sha256", linkKey(secret)).update(idBytes).digest().subarray(0, MAC_BYTES);
}

export function createStopToken(leadId: string, secret: string) {
  if (!UUID_PATTERN.test(leadId)) throw new Error("Invalid lead id");
  const idBytes = Buffer.from(leadId.replace(/-/g, ""), "hex");
  return Buffer.concat([idBytes, mac(idBytes, secret)]).toString("base64url");
}

/** The lead id inside a valid token, or null. */
export function readStopToken(token: string | null | undefined, secret: string): string | null {
  if (!token || !TOKEN_PATTERN.test(token)) return null;
  const bytes = Buffer.from(token, "base64url");
  if (bytes.length !== 16 + MAC_BYTES) return null;
  const idBytes = bytes.subarray(0, 16);
  if (!timingSafeEqual(bytes.subarray(16), mac(idBytes, secret))) return null;
  const hex = idBytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
