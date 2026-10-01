import "server-only";

/**
 * Posts a plain-text alert to LEAD_ALERT_WEBHOOK_URL (Slack or Discord
 * incoming webhook). Returns false when no webhook is configured.
 */
export async function sendLeadAlert(text: string): Promise<boolean> {
  const url = process.env.LEAD_ALERT_WEBHOOK_URL?.trim();
  if (!url) return false;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Slack reads `text`, Discord reads `content`; each ignores the other.
    body: JSON.stringify({ text, content: text }),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Alert webhook responded ${response.status}`);
  }
  return true;
}
