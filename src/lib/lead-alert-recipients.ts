/** Where new-lead alerts went before LEAD_ALERT_TO existed; still used until it is set. */
export const DEFAULT_LEAD_ALERT_TO = "isaiah120303@gmail.com";

const ADDRESS_PATTERN = /^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/;

/**
 * LEAD_ALERT_TO as a list: comma-separated, trimmed, duplicates removed.
 * Entries that aren't addresses are dropped; if nothing usable is left the
 * alert goes to the default address rather than nowhere.
 */
export function leadAlertRecipients(value: string | undefined): { to: string[]; ignored: string[] } {
  const entries = [...new Set((value ?? "").split(",").map((entry) => entry.trim()).filter(Boolean))];
  const to = entries.filter((entry) => ADDRESS_PATTERN.test(entry));
  const ignored = entries.filter((entry) => !ADDRESS_PATTERN.test(entry));
  return { to: to.length > 0 ? to : [DEFAULT_LEAD_ALERT_TO], ignored };
}
