import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Leads",
    description: "Admin leads inbox for Blue Peak Solutions.",
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
  phone: string | null;
  email: string | null;
  service_type: string | null;
  status: string | null;
};

const STATUS_RANK: Record<LeadStatus, number> = {
  new: 0,
  contacted: 1,
  quoted: 2,
  won: 3,
  lost: 4,
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function displayValue(value: string | null) {
  return value && value.trim() ? value : "-";
}

function sortLeads(rows: LeadRow[]) {
  return [...rows].sort((a, b) => {
    const aStatus = (
      a.status && (LEAD_STATUSES as readonly string[]).includes(a.status)
        ? a.status
        : "new"
    ) as LeadStatus;
    const bStatus = (
      b.status && (LEAD_STATUSES as readonly string[]).includes(b.status)
        ? b.status
        : "new"
    ) as LeadStatus;

    const rankDiff = STATUS_RANK[aStatus] - STATUS_RANK[bStatus];
    if (rankDiff !== 0) {
      return rankDiff;
    }

    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export default async function AdminLeadsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  // Authenticated admin only. Service role read bypasses RLS after auth check.
  const { data: leads, error } = await getSupabaseAdmin()
    .from("leads")
    .select("id, created_at, name, phone, email, service_type, status")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin leads: failed to load", error.message);
  }

  const rows = sortLeads((leads ?? []) as LeadRow[]);

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight text-off-white sm:text-4xl">
        Leads
      </h1>
      <p className="mt-3 text-sm text-off-white/70">
        Quote requests from the website. New leads are listed first.
      </p>

      {error ? (
        <p className="mt-8 rounded-md border border-baby-blue/40 bg-black px-4 py-3 text-sm text-off-white">
          Unable to load leads right now.
        </p>
      ) : null}

      {!error && rows.length === 0 ? (
        <p className="mt-8 text-sm text-off-white/65">No leads yet.</p>
      ) : null}

      {!error && rows.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-lg border border-off-white/10 bg-black">
          <table className="min-w-full text-left text-sm text-off-white/85">
            <thead className="border-b border-off-white/10 text-xs tracking-wide text-baby-blue uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-b border-off-white/5 last:border-b-0 ${
                    lead.status === "new" || !lead.status
                      ? "bg-baby-blue/5"
                      : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-off-white/70">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="px-4 py-3">{displayValue(lead.name)}</td>
                  <td className="px-4 py-3">{displayValue(lead.phone)}</td>
                  <td className="px-4 py-3">{displayValue(lead.email)}</td>
                  <td className="px-4 py-3">{displayValue(lead.service_type)}</td>
                  <td className="px-4 py-3">
                    <LeadStatusSelect
                      leadId={lead.id}
                      initialStatus={lead.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
