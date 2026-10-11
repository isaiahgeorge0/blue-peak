"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteCalendarEvent, type CalendarEventRow } from "@/app/admin/calendar/actions";
import { AdminDialog } from "@/components/admin/dialog";
import { ChevronLeftIcon, ChevronRightIcon, PlannerIllustration, PlusIcon, RepeatIcon, TrashIcon } from "@/components/admin/icons";
import { safeAction } from "@/components/admin/safe-action";
import { useToast } from "@/components/admin/toast";
import { EmptyState, PageHeader, primaryButton, secondaryButton } from "@/components/admin/ui";
import { CalendarEventFormDialog } from "@/components/calendar-event-form-dialog";
import {
  expandEventsForRange,
  formatDateKey,
  groupOccurrencesByDate,
  recurrenceLabel,
  toDateKey,
  type CalendarOccurrence,
} from "@/lib/calendar-recurrence";

const WEEKDAYS = [
  ["Sun", "Sunday"],
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
] as const;

type AdminCalendarProps = {
  year: number;
  month: number;
  rangeStart: string;
  rangeEnd: string;
  events: CalendarEventRow[];
};

function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function formatDay(dateKey: string, options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return new Intl.DateTimeFormat("en-GB", options).format(new Date(y, m - 1, d));
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

function timeLabel(event: CalendarEventRow) {
  const start = formatTime(event.start_time);
  const end = formatTime(event.end_time);
  if (!start && !end) return "All day";
  return [start ?? "–", end].filter(Boolean).join("–");
}

function adjacentMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function monthHref(year: number, month: number) {
  return `/admin/calendar?year=${year}&month=${month}`;
}

function buildMonthCells(year: number, month: number) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<{ key: string; day: number; inMonth: boolean; dateKey: string }> = [];

  const prev = adjacentMonth(year, month, -1);
  const daysInPrev = new Date(prev.year, prev.month, 0).getDate();
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = daysInPrev - i;
    cells.push({ key: `prev-${day}`, day, inMonth: false, dateKey: toDateKey(prev.year, prev.month, day) });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ key: `cur-${day}`, day, inMonth: true, dateKey: toDateKey(year, month, day) });
  }
  const next = adjacentMonth(year, month, 1);
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ key: `next-${nextDay}`, day: nextDay, inMonth: false, dateKey: toDateKey(next.year, next.month, nextDay) });
    nextDay += 1;
  }
  return cells;
}

const navButton =
  "inline-flex size-11 items-center justify-center rounded-full border border-admin-edge text-ink transition-colors hover:border-peak-fleet hover:bg-admin-raised";

export function AdminCalendar({ year, month, rangeStart, rangeEnd, events }: AdminCalendarProps) {
  const router = useRouter();
  const toast = useToast();
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [viewing, setViewing] = useState<CalendarOccurrence | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const confirmButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);

  // The confirm step replaces the Delete button, so focus follows it there and back.
  useEffect(() => {
    (confirmingDelete ? confirmButton : deleteButton).current?.focus();
  }, [confirmingDelete]);

  const prev = adjacentMonth(year, month, -1);
  const next = adjacentMonth(year, month, 1);
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);
  const eventsByDate = useMemo(() => groupOccurrencesByDate(expandEventsForRange(events, rangeStart, rangeEnd)), [events, rangeStart, rangeEnd]);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const now = new Date();
  const isThisMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const monthLabel = formatMonthLabel(year, month);
  const agendaDays = cells.filter((cell) => cell.inMonth && (eventsByDate.get(cell.dateKey)?.length ?? 0) > 0);

  function openView(occurrence: CalendarOccurrence) {
    setError(null);
    setConfirmingDelete(false);
    setViewing(occurrence);
  }

  function closeView() {
    if (isPending) return;
    setViewing(null);
    setConfirmingDelete(false);
    setError(null);
  }

  function handleDelete(eventRow: CalendarEventRow) {
    setError(null);
    startTransition(async () => {
      const result = await safeAction(() => deleteCalendarEvent(eventRow.id));
      if (!result.ok) {
        setError(result.error);
        setConfirmingDelete(false);
        return;
      }
      setViewing(null);
      setConfirmingDelete(false);
      toast(eventRow.recurrence !== "none" ? "Series deleted." : "Event deleted.");
      router.refresh();
    });
  }

  const eventChip = (occurrence: CalendarOccurrence, compact: boolean) => {
    const start = formatTime(occurrence.event.start_time);
    return (
      <button
        type="button"
        onClick={() => openView(occurrence)}
        className={
          compact
            ? "relative z-10 flex w-full items-center gap-1 rounded-md bg-peak-fleet/15 px-1.5 py-1 text-left text-xs text-ink ring-1 ring-inset ring-peak-fleet/40 transition-colors hover:bg-peak-fleet/25"
            : "flex min-h-14 w-full items-center gap-4 rounded-xl border border-admin-line bg-admin-surface px-4 py-3 text-left transition-colors hover:bg-admin-raised"
        }
      >
        {compact ? (
          <>
            {occurrence.isRecurring ? <RepeatIcon className="size-3 shrink-0 text-ridge-cyan" /> : null}
            <span className="truncate">
              {start ? <span className="font-bold tabular-nums">{start} </span> : null}
              {occurrence.event.title}
            </span>
            <span className="sr-only">, {formatDay(occurrence.occurrenceDate)}</span>
          </>
        ) : (
          <>
            <span className="w-24 shrink-0 text-sm font-bold text-peak-fleet tabular-nums">{timeLabel(occurrence.event)}</span>
            <span className="min-w-0 flex-1">
              <span className="block break-words text-[0.9375rem] text-ink">{occurrence.event.title}</span>
              {occurrence.isRecurring ? (
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink/80">
                  <RepeatIcon className="size-3.5" />
                  {recurrenceLabel(occurrence.event.recurrence)}
                </span>
              ) : null}
            </span>
          </>
        )}
      </button>
    );
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        lede="Site visits and anything else you need to plan. Repeating events show on every day they fall."
        actions={
          <button type="button" className={primaryButton} onClick={() => setCreateDate(isThisMonth ? todayKey : toDateKey(year, month, 1))}>
            <PlusIcon className="size-4" />
            New event
          </button>
        }
      />

      <nav aria-label="Month" className="mt-8 flex items-center gap-2">
        <Link href={monthHref(prev.year, prev.month)} className={navButton} aria-label={`Previous month, ${formatMonthLabel(prev.year, prev.month)}`}>
          <ChevronLeftIcon className="size-5" />
        </Link>
        <Link href={monthHref(next.year, next.month)} className={navButton} aria-label={`Next month, ${formatMonthLabel(next.year, next.month)}`}>
          <ChevronRightIcon className="size-5" />
        </Link>
        <h2 aria-live="polite" className="ml-2 min-w-0 flex-1 font-serif text-[1.5rem] leading-tight tracking-heading text-ink">
          {monthLabel}
        </h2>
        {!isThisMonth ? (
          <Link href="/admin/calendar" className={`${secondaryButton} px-4`}>
            Today
          </Link>
        ) : null}
      </nav>

      {/* Phones: an agenda of the days that have something on. */}
      <div className="mt-5 md:hidden">
        {agendaDays.length === 0 ? (
          <div className="rounded-xl border border-admin-line bg-admin-surface">
            <EmptyState illustration={<PlannerIllustration />} title={`Nothing booked in ${formatDay(toDateKey(year, month, 1), { month: "long" })}.`}>
              Add a site visit from a lead, or use New event.
            </EmptyState>
          </div>
        ) : (
          <ol className="space-y-6">
            {agendaDays.map((cell) => (
              <li key={cell.key}>
                <h3 className="flex items-baseline gap-2 text-sm font-bold text-ink">
                  {formatDay(cell.dateKey, { weekday: "long", day: "numeric", month: "long" })}
                  {cell.dateKey === todayKey ? <span className="admin-label text-ridge-cyan">Today</span> : null}
                </h3>
                <ul className="mt-2 space-y-2">
                  {(eventsByDate.get(cell.dateKey) ?? []).map((occurrence) => (
                    <li key={`${occurrence.event.id}-${occurrence.occurrenceDate}`}>{eventChip(occurrence, false)}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Tablets and up: the month grid. */}
      <div className="mt-5 hidden overflow-hidden rounded-xl border border-admin-line bg-admin-surface md:block">
        <div aria-hidden className="grid grid-cols-7 border-b border-admin-line">
          {WEEKDAYS.map(([short]) => (
            <div key={short} className="admin-label px-2 py-2.5 text-center">
              {short}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, index) => {
            const dayEvents = eventsByDate.get(cell.dateKey) ?? [];
            const isToday = cell.dateKey === todayKey;
            return (
              <div
                key={cell.key}
                className={`group relative min-h-28 border-admin-line p-1.5 ${index % 7 !== 6 ? "border-r" : ""} ${
                  index < cells.length - 7 ? "border-b" : ""
                } ${cell.inMonth ? "" : "bg-admin-base/60"}`}
              >
                <button
                  type="button"
                  onClick={() => setCreateDate(cell.dateKey)}
                  aria-label={`Add event on ${formatDay(cell.dateKey)}`}
                  className="absolute inset-0 transition-colors hover:bg-admin-raised/60 focus-visible:-outline-offset-2"
                />
                <span
                  className={`pointer-events-none relative inline-flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                    isToday ? "bg-frost text-navy" : cell.inMonth ? "text-ink" : "text-ink/60"
                  }`}
                >
                  {cell.day}
                </span>
                <PlusIcon className="pointer-events-none absolute top-2.5 right-2.5 size-3.5 text-peak-fleet opacity-0 transition-opacity group-hover:opacity-100" />
                {dayEvents.length > 0 ? (
                  <ul className="relative mt-1 space-y-1">
                    {dayEvents.map((occurrence) => (
                      <li key={`${occurrence.event.id}-${occurrence.occurrenceDate}`}>{eventChip(occurrence, true)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <CalendarEventFormDialog
        open={createDate !== null}
        onClose={() => setCreateDate(null)}
        prefill={{ start_date: createDate ?? todayKey }}
        heading="New event"
        onCreated={() => toast("Event added.")}
      />

      <AdminDialog
        open={viewing !== null}
        onClose={closeView}
        title={viewing?.event.title ?? ""}
        description={viewing ? formatDay(viewing.occurrenceDate) : null}
        busy={isPending}
      >
        {viewing ? (
          <>
            <dl className="space-y-4 text-[0.9375rem]">
              <div>
                <dt className="admin-label">Time</dt>
                <dd className="mt-1 text-ink">{timeLabel(viewing.event)}</dd>
              </div>
              <div>
                <dt className="admin-label">Repeats</dt>
                <dd className="mt-1 text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    {viewing.isRecurring ? <RepeatIcon className="size-4 text-ridge-cyan" /> : null}
                    {recurrenceLabel(viewing.event.recurrence)}
                  </span>
                  {viewing.event.recurrence_end_date ? (
                    <span className="mt-1 block text-sm text-ink/80">Until {formatDay(viewing.event.recurrence_end_date)}</span>
                  ) : null}
                </dd>
              </div>
              {viewing.event.notes?.trim() ? (
                <div>
                  <dt className="admin-label">Notes</dt>
                  <dd className="mt-1 break-words whitespace-pre-wrap text-ink">{viewing.event.notes.trim()}</dd>
                </div>
              ) : null}
              {viewing.event.lead_id ? (
                <div>
                  <dt className="admin-label">Lead</dt>
                  <dd className="mt-1">
                    <Link href={`/admin/leads/${viewing.event.lead_id}`} className="font-bold text-peak-fleet underline-offset-4 hover:text-ridge-cyan hover:underline">
                      Open the lead
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>

            {error ? (
              <p role="alert" className="mt-4 text-sm font-bold text-ridge-cyan">
                {error}
              </p>
            ) : null}

            {confirmingDelete ? (
              <div role="group" aria-label="Confirm delete" className="mt-6 rounded-xl border border-admin-edge bg-admin-raised p-4">
                <p className="text-sm text-ink">
                  {viewing.isRecurring
                    ? "Delete the whole series? Single days can't be removed on their own."
                    : "Delete this event? This can't be undone."}
                </p>
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" className={secondaryButton} disabled={isPending} onClick={() => setConfirmingDelete(false)}>
                    Keep it
                  </button>
                  <button ref={confirmButton} type="button" className={primaryButton} disabled={isPending} onClick={() => handleDelete(viewing.event)}>
                    <TrashIcon className="size-4" />
                    {isPending ? "Deleting…" : viewing.isRecurring ? "Delete series" : "Delete event"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className={secondaryButton} onClick={closeView}>
                  Close
                </button>
                <button ref={deleteButton} type="button" className={secondaryButton} onClick={() => setConfirmingDelete(true)}>
                  <TrashIcon className="size-4" />
                  {viewing.isRecurring ? "Delete series" : "Delete"}
                </button>
              </div>
            )}
          </>
        ) : null}
      </AdminDialog>
    </div>
  );
}
