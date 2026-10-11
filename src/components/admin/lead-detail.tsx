"use client";

import { useId, useState, useTransition, type ComponentType } from "react";
import { addLeadNote } from "@/app/admin/leads/actions";
import { CalendarEventFormDialog, type CalendarEventFormPrefill } from "@/components/calendar-event-form-dialog";
import { CalendarIcon, LeadsIcon, MailIcon, NoteIcon } from "@/components/admin/icons";
import { safeAction } from "@/components/admin/safe-action";
import { useToast } from "@/components/admin/toast";
import { secondaryButton } from "@/components/admin/ui";

export type TimelineItem = {
  id: string;
  kind: "arrived" | "alert" | "note";
  at: string;
  /** Preformatted UK date and time. */
  when: string;
  title: string;
  body?: string;
};

const KIND_ICONS: Record<TimelineItem["kind"], ComponentType<{ className?: string }>> = {
  arrived: LeadsIcon,
  alert: MailIcon,
  note: NoteIcon,
};

function stamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

/** Notes and events on a lead, newest first, with a box to add a note at the top. */
export function LeadActivity({ leadId, items }: { leadId: string; items: TimelineItem[] }) {
  const toast = useToast();
  const fieldId = useId();
  const [added, setAdded] = useState<TimelineItem[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const seen = new Set(items.map((item) => item.id));
  const timeline = [...added.filter((item) => !seen.has(item.id)), ...items].sort((a, b) => b.at.localeCompare(a.at));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const note = draft.trim();
    if (!note) return;
    setError(null);
    startTransition(async () => {
      const result = await safeAction(() => addLeadNote(leadId, note));
      if (!result.ok) {
        // The draft stays in the box so nothing typed is lost.
        setError(`${result.error} Your note is still in the box.`);
        return;
      }
      setAdded((current) => [
        {
          id: result.note.id,
          kind: "note",
          at: result.note.created_at,
          when: stamp(result.note.created_at),
          title: "Note",
          body: result.note.note,
        },
        ...current,
      ]);
      setDraft("");
      toast("Note added.");
    });
  }

  return (
    <div>
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor={fieldId} className="admin-label">
          Add a note
        </label>
        <textarea
          id={fieldId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder="Called back, left a message…"
          className="block w-full resize-y rounded-lg border border-admin-edge bg-admin-base px-4 py-3 text-[0.9375rem] text-ink placeholder:text-ink/60 hover:border-peak-fleet"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink/80">Notes can&apos;t be edited or removed once saved.</p>
          <button type="submit" disabled={isPending || !draft.trim()} className={secondaryButton}>
            <NoteIcon className="size-4" />
            {isPending ? "Saving…" : "Save note"}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-bold text-ridge-cyan">
            {error}
          </p>
        ) : null}
      </form>

      <ol className="mt-6 space-y-0">
        {timeline.map((item, index) => {
          const Icon = KIND_ICONS[item.kind];
          return (
            <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
              {index < timeline.length - 1 ? (
                <span aria-hidden className="absolute top-9 bottom-1 left-[1.0625rem] w-px bg-admin-line" />
              ) : null}
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-admin-line bg-admin-raised text-peak-fleet">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 pt-1.5">
                <p className="text-sm">
                  <span className="font-bold text-ink">{item.title}</span>
                  <span className="text-ink/80"> · {item.when}</span>
                </p>
                {item.body ? <p className="mt-1 text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap text-ink">{item.body}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ScheduleVisitButton({ prefill }: { prefill: CalendarEventFormPrefill }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  return (
    <>
      <button type="button" className={secondaryButton} onClick={() => setOpen(true)}>
        <CalendarIcon className="size-4" />
        Schedule visit
      </button>
      <CalendarEventFormDialog
        open={open}
        onClose={() => setOpen(false)}
        prefill={prefill}
        heading="Schedule a site visit"
        onCreated={() => toast("Visit added to the calendar.")}
      />
    </>
  );
}
