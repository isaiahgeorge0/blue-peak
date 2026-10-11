import { NextResponse } from "next/server";
import { isCronAuthorised } from "@/lib/cron-auth";
import { runFollowUps } from "@/lib/follow-ups";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Local testing only: with FOLLOW_UP_LOCAL_TESTING=true (never on Vercel),
 * `?now=<ISO time>` simulates the clock and `?lead=<id>` (required, may
 * repeat) limits the run to those leads.
 */
function localTestOptions(url: URL): { now?: Date; leadIds?: string[] } | "invalid" | null {
  if (process.env.FOLLOW_UP_LOCAL_TESTING !== "true" || process.env.VERCEL) return null;
  const leadIds = url.searchParams.getAll("lead");
  if (leadIds.length === 0 || !leadIds.every((id) => UUID_PATTERN.test(id))) return "invalid";
  const nowParam = url.searchParams.get("now");
  const now = nowParam ? new Date(nowParam) : undefined;
  if (now && Number.isNaN(now.getTime())) return "invalid";
  return { now, leadIds };
}

/**
 * Follow-up emails. Called every 5 minutes by a Supabase pg_cron job; safe
 * to call more often, since every send is claimed in follow_up_sends first.
 */
export async function GET(request: Request) {
  if (!isCronAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const testing = localTestOptions(new URL(request.url));
  if (testing === "invalid") {
    return NextResponse.json({ error: "Local test runs need ?lead=<id> and a valid ?now" }, { status: 400 });
  }

  try {
    const result = await runFollowUps(testing ?? {});
    if (result.status === "not-configured") {
      console.error("follow-ups: not configured, missing", result.missing?.join(", "));
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("follow-ups: run failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Follow-up run failed" }, { status: 500 });
  }
}
