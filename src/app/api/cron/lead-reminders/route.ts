import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runLeadReminders } from "@/lib/lead-reminders";

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

/** `Authorization: Bearer <CRON_SECRET>`, compared in constant time. */
function isAuthorised(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return timingSafeEqual(sha256(header), sha256(`Bearer ${secret}`));
}

/**
 * Stalled-lead reminders. Called hourly by a Supabase pg_cron job (the Vercel
 * Hobby plan only allows daily crons); safe to call more often.
 */
export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const result = await runLeadReminders();
    if (result.status === "not-configured") {
      console.error("lead reminders: NTFY_TOPIC_URL is not configured");
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "lead reminders: run failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Reminder run failed" }, { status: 500 });
  }
}
