import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LeadVolumeChart,
  type LeadVolumePoint,
} from "@/components/lead-volume-chart";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Dashboard",
    description: "Blue Peak Solutions admin dashboard.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

type LeadRow = {
  id: string;
  created_at: string;
  name: string | null;
  service_type: string | null;
  status: string | null;
};

function greetingForNow(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "numeric",
      hour12: false,
    }).format(now),
  );

  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function displayNameFromClaims(claims: Record<string, unknown> | undefined) {
  const email =
    typeof claims?.email === "string" ? claims.email.trim() : "";
  if (email.includes("@")) {
    const local = email.split("@")[0] ?? "";
    if (local) {
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
  }
  // Placeholder until admin profiles store a preferred name.
  return "Admin";
}

function normalizeStatus(status: string | null): LeadStatus {
  if (status && (LEAD_STATUSES as readonly string[]).includes(status)) {
    return status as LeadStatus;
  }
  return "new";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/**
 * Placeholder lead-volume series for the last 8 weeks.
 * Real weekly history is still thin, so the chart uses this trend until
 * enough production leads exist to plot from the database.
 */
function placeholderLeadVolume(): LeadVolumePoint[] {
  const points: LeadVolumePoint[] = [];
  const values = [2, 3, 2, 4, 5, 3, 6, 4];
  const now = startOfWeek(new Date());

  for (let i = 7; i >= 0; i -= 1) {
    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() - i * 7);
    const label = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(weekStart);
    points.push({
      week: label,
      leads: values[7 - i] ?? 0,
    });
  }

  return points;
}

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data: leads, error } = await getSupabaseAdmin()
    .from("leads")
    .select("id, created_at, name, service_type, status")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin dashboard: failed to load leads", error.message);
  }

  const rows = (leads ?? []) as LeadRow[];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const totalLeads = rows.length;
  const newThisWeek = rows.filter(
    (lead) => new Date(lead.created_at).getTime() >= weekAgo,
  ).length;
  const openNew = rows.filter(
    (lead) => normalizeStatus(lead.status) === "new",
  ).length;
  const statusCounts = LEAD_STATUSES.reduce(
    (acc, status) => {
      acc[status] = rows.filter(
        (lead) => normalizeStatus(lead.status) === status,
      ).length;
      return acc;
    },
    {} as Record<LeadStatus, number>,
  );

  const recent = rows.slice(0, 5);
  const chartData = placeholderLeadVolume();
  const greeting = greetingForNow();
  const displayName = displayNameFromClaims(
    claimsData.claims as Record<string, unknown>,
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm tracking-wide text-baby-blue uppercase">
            Dashboard
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-off-white sm:text-4xl">
            {greeting}, {displayName}
          </h1>
          <p className="mt-3 text-sm text-off-white/65">
            Overview of quote requests coming in from the site.
          </p>
        </div>
        <Link
          href="/admin/leads"
          className="text-sm font-medium text-baby-blue transition-opacity hover:opacity-80"
        >
          View all leads
        </Link>
      </div>

      {error ? (
        <p className="mt-8 rounded-md border border-baby-blue/40 bg-black px-4 py-3 text-sm text-off-white">
          Unable to load dashboard data right now.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-off-white/10 bg-black px-5 py-4">
          <p className="text-xs tracking-wide text-off-white/45 uppercase">
            Total leads
          </p>
          <p className="mt-3 font-serif text-3xl text-off-white">{totalLeads}</p>
        </div>
        <div className="rounded-lg border border-off-white/10 bg-black px-5 py-4">
          <p className="text-xs tracking-wide text-off-white/45 uppercase">
            New this week
          </p>
          <p className="mt-3 font-serif text-3xl text-off-white">{newThisWeek}</p>
          <p className="mt-2 text-xs text-off-white/45">Created in the last 7 days</p>
        </div>
        <div className="rounded-lg border border-off-white/10 bg-black px-5 py-4">
          <p className="text-xs tracking-wide text-off-white/45 uppercase">
            Status: new
          </p>
          <p className="mt-3 font-serif text-3xl text-off-white">{openNew}</p>
          <p className="mt-2 text-xs text-off-white/45">Still marked as new</p>
        </div>
        <div className="rounded-lg border border-off-white/10 bg-black px-5 py-4">
          <p className="text-xs tracking-wide text-off-white/45 uppercase">
            By status
          </p>
          <dl className="mt-3 space-y-1.5 text-sm text-off-white/75">
            {LEAD_STATUSES.map((status) => (
              <div key={status} className="flex items-center justify-between gap-3">
                <dt className="capitalize text-off-white/55">{status}</dt>
                <dd className="tabular-nums text-off-white">
                  {statusCounts[status]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-lg border border-off-white/10 bg-black px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-off-white">Lead volume</h2>
              <p className="mt-1 text-xs text-off-white/45">
                Last 8 weeks (placeholder trend until history builds up)
              </p>
            </div>
          </div>
          <div className="mt-4">
            <LeadVolumeChart data={chartData} />
          </div>
        </section>

        <section className="rounded-lg border border-off-white/10 bg-black px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-off-white">Recent leads</h2>
            <Link
              href="/admin/leads"
              className="text-xs font-medium text-baby-blue transition-opacity hover:opacity-80"
            >
              Full list
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-off-white/55">No leads yet.</p>
          ) : (
            <ul className="mt-5 divide-y divide-off-white/10">
              {recent.map((lead) => (
                <li key={lead.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-off-white">
                        {lead.name?.trim() || "Unnamed lead"}
                      </p>
                      <p className="mt-1 truncate text-xs text-off-white/50">
                        {lead.service_type?.trim() || "Service not set"} ·{" "}
                        {formatDate(lead.created_at)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded border border-off-white/10 px-2 py-0.5 text-[11px] capitalize text-off-white/60">
                      {normalizeStatus(lead.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
