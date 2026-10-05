import type { Metadata } from "next";
import type { LeadNoteRow } from "@/app/admin/leads/actions";
import { LeadsTable } from "@/components/leads-table";
import type { LeadTableRow } from "@/components/lead-notes-panel";
import { requireAdminPage } from "@/lib/admin-auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { groupNextVisitsByLead } from "@/lib/lead-visits";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

const STATUS_RANK: Record<LeadStatus, number> = {
  new: 0,
  contacted: 1,
  quoted: 2,
  won: 3,
  lost: 4,
  spam: 5,
};

function sortLeads(rows: LeadTableRow[]) {
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

function groupNotesByLead(notes: LeadNoteRow[]) {
  const grouped: Record<string, LeadNoteRow[]> = {};
  for (const note of notes) {
    const list = grouped[note.lead_id] ?? [];
    list.push(note);
    grouped[note.lead_id] = list;
  }
  return grouped;
}

export default async function AdminLeadsPage() {
  await requireAdminPage();

  // Service role read bypasses RLS, so it must stay behind the admin check.
  const admin = getSupabaseAdmin();
  const [
    { data: leads, error },
    { data: notes, error: notesError },
    { data: visits, error: visitsError },
  ] = await Promise.all([
    admin
      .from("leads")
      .select(
        "id, created_at, name, phone, email, postcode, service_type, status",
      )
      .order("created_at", { ascending: false }),
    admin
      .from("lead_notes")
      .select("id, lead_id, note, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("calendar_events")
      .select("id, lead_id, start_date, start_time")
      .not("lead_id", "is", null)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (error) {
    console.error("admin leads: failed to load", error.message);
  }
  if (notesError) {
    console.error("admin leads: failed to load notes", notesError.message);
  }
  if (visitsError) {
    console.error("admin leads: failed to load visits", visitsError.message);
  }

  const rows = sortLeads((leads ?? []) as LeadTableRow[]);
  const notesByLead = groupNotesByLead((notes ?? []) as LeadNoteRow[]);
  const nextVisitByLead = groupNextVisitsByLead(visits ?? []);

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
        Leads
      </h1>
      <p className="mt-3 text-sm text-ink/70">
        Quote requests from the website. New leads are listed first. Expand a
        row to view or add notes.
      </p>

      {error ? (
        <p className="mt-8 rounded-md border border-accent/40 bg-panel px-4 py-3 text-sm text-ink">
          Unable to load leads right now.
        </p>
      ) : null}

      {!error && rows.length === 0 ? (
        <p className="mt-8 text-sm text-ink/65">No leads yet.</p>
      ) : null}

      {!error && rows.length > 0 ? (
        <LeadsTable
          leads={rows}
          notesByLead={notesByLead}
          nextVisitByLead={nextVisitByLead}
        />
      ) : null}
    </div>
  );
}
