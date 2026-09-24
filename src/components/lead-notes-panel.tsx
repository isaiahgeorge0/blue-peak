"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { CalendarEventRow } from "@/app/admin/calendar/actions";
import { addLeadNote, type LeadNoteRow } from "@/app/admin/leads/actions";
import { CalendarEventFormDialog } from "@/components/calendar-event-form-dialog";
import { LeadStatusSelect } from "@/components/lead-status-select";
import {
  buildSiteVisitNotes,
  formatVisitIndicator,
  pickNextUpcomingVisit,
  todayDateKeyForPrefill,
  type LeadVisitSummary,
} from "@/lib/lead-visits";

export type LeadTableRow = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  postcode: string | null;
  service_type: string | null;
  status: string | null;
};

type LeadNotesPanelProps = {
  lead: LeadTableRow;
  notes: LeadNoteRow[];
  nextVisit: LeadVisitSummary | null;
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

export function LeadNotesPanel({
  lead,
  notes,
  nextVisit,
}: LeadNotesPanelProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localNotes, setLocalNotes] = useState(notes);
  const [localVisit, setLocalVisit] = useState(nextVisit);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  useEffect(() => {
    setLocalVisit(nextVisit);
  }, [nextVisit]);

  const isNew = lead.status === "new" || !lead.status;
  const noteCount = localNotes.length;

  const schedulePrefill = useMemo(
    () => ({
      start_date: todayDateKeyForPrefill(),
      title: `Site visit - ${lead.name?.trim() || "Lead"}`,
      notes: buildSiteVisitNotes({
        phone: lead.phone,
        postcode: lead.postcode,
      }),
      lead_id: lead.id,
      recurrence: "none" as const,
    }),
    [lead.id, lead.name, lead.phone, lead.postcode],
  );

  function toggleExpanded() {
    setExpanded((value) => !value);
    setError(null);
  }

  function handleAddNote() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Note cannot be empty.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addLeadNote(lead.id, trimmed);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setDraft("");
      setLocalNotes((prev) => [result.note, ...prev]);
      router.refresh();
    });
  }

  function handleVisitCreated(event: CalendarEventRow) {
    const created: LeadVisitSummary = {
      id: event.id,
      start_date: event.start_date,
      start_time: event.start_time,
    };
    setLocalVisit((prev) =>
      pickNextUpcomingVisit(prev ? [prev, created] : [created]),
    );
  }

  return (
    <>
      <tr
        className={`border-b border-off-white/5 ${
          isNew ? "bg-baby-blue/5" : ""
        } ${expanded ? "" : "last:border-b-0"}`}
      >
        <td className="whitespace-nowrap px-4 py-3 text-off-white/70">
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse lead notes" : "Expand lead notes"}
            className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded border border-off-white/15 text-baby-blue transition-colors hover:border-baby-blue hover:bg-baby-blue/10"
          >
            <span aria-hidden className="text-xs leading-none">
              {expanded ? "−" : "+"}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleExpanded}
            className="text-left text-off-white/70 transition-colors hover:text-off-white"
          >
            {formatDate(lead.created_at)}
          </button>
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={toggleExpanded}
            className="text-left transition-colors hover:text-baby-blue"
          >
            {displayValue(lead.name)}
            {noteCount > 0 ? (
              <span className="ml-2 text-xs text-baby-blue/80">
                {noteCount} note{noteCount === 1 ? "" : "s"}
              </span>
            ) : null}
            {localVisit ? (
              <span className="mt-1 block text-xs text-baby-blue/90">
                {formatVisitIndicator(localVisit)}
              </span>
            ) : null}
          </button>
        </td>
        <td className="px-4 py-3">{displayValue(lead.phone)}</td>
        <td className="px-4 py-3">{displayValue(lead.email)}</td>
        <td className="px-4 py-3">{displayValue(lead.service_type)}</td>
        <td
          className="px-4 py-3"
          onClick={(event) => event.stopPropagation()}
        >
          <LeadStatusSelect leadId={lead.id} initialStatus={lead.status} />
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-off-white/5 last:border-b-0 bg-charcoal/40">
          <td colSpan={6} className="px-4 py-4">
            <div className="max-w-3xl">
              <p className="text-xs tracking-wide text-baby-blue uppercase">
                Activity
              </p>

              {localNotes.length === 0 ? (
                <p className="mt-3 text-sm text-off-white/55">
                  No notes yet. Add the first update below.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {localNotes.map((item) => (
                    <li
                      key={item.id}
                      className="border-l-2 border-baby-blue/50 pl-3"
                    >
                      <p className="text-xs text-off-white/50">
                        {formatDate(item.created_at)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-off-white/85">
                        {item.note}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4">
                <label className="sr-only" htmlFor={`lead-note-${lead.id}`}>
                  Add note
                </label>
                <textarea
                  id={`lead-note-${lead.id}`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  placeholder="Add a note..."
                  disabled={isPending}
                  className="w-full rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none transition-colors placeholder:text-off-white/35 focus:border-baby-blue disabled:opacity-60"
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={isPending || !draft.trim()}
                    className="rounded-md border border-baby-blue/50 bg-baby-blue/15 px-3 py-1.5 text-sm text-baby-blue transition-colors hover:bg-baby-blue/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? "Adding..." : "Add note"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    className="rounded-md border border-off-white/20 px-3 py-1.5 text-sm text-off-white/80 transition-colors hover:border-baby-blue hover:text-baby-blue"
                  >
                    Schedule site visit
                  </button>
                  {error ? (
                    <span className="text-xs text-off-white/60" role="alert">
                      {error}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}

      <CalendarEventFormDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        prefill={schedulePrefill}
        heading="Schedule site visit"
        onCreated={handleVisitCreated}
      />
    </>
  );
}
