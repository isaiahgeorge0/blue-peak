import { looksLikeEmail } from "./email-format.ts";

/** Default lead-alert sender once cortexbuilding.co.uk is verified in Resend. */
export const DEFAULT_LEAD_ALERT_FROM = "Cortex Notifications <notifications@cortexbuilding.co.uk>";

/**
 * A usable Resend `from`: either a bare address, or `Display Name <address>`.
 * Same shape FOLLOW_UP_FROM is expected to take.
 */
export function looksLikeFromAddress(value: string) {
  const trimmed = value.trim();
  if (!/[<>]/.test(trimmed)) return looksLikeEmail(trimmed);
  const match = /^(.+)<([^<>]+)>$/.exec(trimmed);
  if (!match) return false;
  const name = match[1].trim();
  const address = match[2].trim();
  return name.length > 0 && looksLikeEmail(address);
}

/**
 * LEAD_ALERT_FROM, or the default when unset or not a usable from address.
 * Callers that need to log a bad value should check looksLikeFromAddress first.
 */
export function leadAlertFrom(value: string | undefined): { from: string; invalid: boolean } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { from: DEFAULT_LEAD_ALERT_FROM, invalid: false };
  if (looksLikeFromAddress(trimmed)) return { from: trimmed, invalid: false };
  return { from: DEFAULT_LEAD_ALERT_FROM, invalid: true };
}
