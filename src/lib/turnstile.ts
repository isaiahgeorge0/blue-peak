import "server-only";
import { TURNSTILE_ACTIONS } from "@/lib/lead-limits";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2048;
const ALLOWED_ACTIONS: readonly string[] = Object.values(TURNSTILE_ACTIONS);

/**
 * Enforced only when both keys are set. With only the secret, the forms would
 * render no widget and every real lead would be silently dropped.
 */
export function isTurnstileEnforced() {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
}

/**
 * "fail": Cloudflare rejected the token (bot, replayed or forged).
 * "unavailable": Cloudflare could not be reached; callers accept the lead
 * rather than lose real customers during an outage.
 */
export type TurnstileVerdict = "pass" | "fail" | "unavailable";

export async function verifyTurnstileToken(
  token: string,
  remoteIp: string | null,
): Promise<TurnstileVerdict> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return "unavailable";
  if (token.length > MAX_TOKEN_LENGTH) return "fail";

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error("turnstile: siteverify responded", response.status);
      return "unavailable";
    }

    const result = (await response.json()) as {
      success?: boolean;
      action?: string;
      "error-codes"?: string[];
    };
    if (!result.success) {
      console.warn("turnstile: token rejected", result["error-codes"]);
      return "fail";
    }
    if (result.action && !ALLOWED_ACTIONS.includes(result.action)) {
      console.warn("turnstile: unexpected action", result.action);
      return "fail";
    }
    return "pass";
  } catch (error) {
    console.error(
      "turnstile: siteverify unreachable",
      error instanceof Error ? error.message : error,
    );
    return "unavailable";
  }
}
