import type { Metadata } from "next";
import { NotepadIllustration } from "@/components/admin/icons";
import { LeadsList, type LeadListRow } from "@/components/admin/leads-list";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin-auth";
import { SERVICE_NAMES } from "@/lib/admin-data";
import { leadSource, serviceLabel, waitedFor } from "@/lib/admin-leads";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { formatVisitIndicator, groupNextVisitsByLead } from "@/lib/lead-visits";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Leads",
};

type LeadRow = {
  id: string;
  created_at: string;
  reference_number: number | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  postcode: string | null;
  service_type: string | null;
  message: string | null;
  status: string | null;
};

function receivedLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric" }).format(date);
}

export default async function AdminLeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await requireAdminPage();
  const { status } = await searchParams;
  const initialStatus = (LEAD_STATUSES as readonly string[]).includes(String(status)) ? (status as LeadStatus) : "all";

  // Service role read bypasses RLS, so it must stay behind the admin check.
  const admin = getSupabaseAdmin();
  const [{ data: leads, error }, { data: notes, error: notesError }, { data: visits, error: visitsError }] = await Promise.all([
    admin
      .from("leads")
      .select("id, created_at, reference_number, name, phone, email, postcode, service_type, message, status")
      .order("created_at", { ascending: false }),
    admin.from("lead_notes").select("lead_id"),
    admin
      .from("calendar_events")
      .select("id, lead_id, start_date, start_time")
      .not("lead_id", "is", null)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (error) console.error("admin leads: failed to load", error.message);
  if (notesError) console.error("admin leads: failed to load notes", notesError.message);
  if (visitsError) console.error("admin leads: failed to load visits", visitsError.message);

  const notesByLead = new Map<string, number>();
  for (const note of notes ?? []) notesByLead.set(note.lead_id, (notesByLead.get(note.lead_id) ?? 0) + 1);
  const nextVisitByLead = groupNextVisitsByLead(visits ?? []);
  const now = new Date();

  const rows: LeadListRow[] = ((leads ?? []) as LeadRow[]).map((lead) => {
    const visit = nextVisitByLead[lead.id];
    return {
      id: lead.id,
      created_at: lead.created_at,
      reference_number: lead.reference_number,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      postcode: lead.postcode,
      status: lead.status,
      service: serviceLabel(lead.service_type, lead.message, SERVICE_NAMES),
      source: leadSource(lead.service_type),
      received: receivedLabel(lead.created_at),
      waited: waitedFor(lead.created_at, now),
      notes: notesByLead.get(lead.id) ?? 0,
      visit: visit ? formatVisitIndicator(visit) : null,
    };
  });

  return (
    <div>
      <PageHeader title="Leads" lede="Every enquiry from the website. New leads come first until you change their status." />

      {error ? (
        <Card className="mt-8 px-5 py-4 text-sm">Leads couldn&apos;t be loaded just now. Refresh the page to try again.</Card>
      ) : rows.length === 0 ? (
        <Card className="mt-8">
          <EmptyState illustration={<NotepadIllustration />} title="No leads yet.">
            Enquiries from the contact form and the estimator will appear here.
          </EmptyState>
        </Card>
      ) : (
        <LeadsList leads={rows} initialStatus={initialStatus} />
      )}
    </div>
  );
}
