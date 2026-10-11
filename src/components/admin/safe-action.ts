export const OFFLINE_ERROR = "Couldn't reach the server. Check your connection and try again.";

/**
 * Runs a server action, turning a thrown error (offline, timeout, server down)
 * into an ordinary failed result, so callers keep what was entered and say so
 * instead of falling through to the error page.
 */
export async function safeAction<T extends { ok: boolean }>(run: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await run();
  } catch {
    return { ok: false, error: OFFLINE_ERROR };
  }
}
