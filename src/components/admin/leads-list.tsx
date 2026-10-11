"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteLeads, markLeadsAsSpam, type BulkLeadsResult } from "@/app/admin/leads/actions";
import { CalendarIcon, ChevronDownIcon, NoteIcon, SearchIcon, SearchIllustration, StatusSpamIcon, TrashIcon } from "@/components/admin/icons";
import { safeAction } from "@/components/admin/safe-action";
import { StatusControl } from "@/components/admin/status";
import { EmptyState, primaryButton, secondaryButton } from "@/components/admin/ui";
import { normalizeStatus, STATUS_LABELS } from "@/lib/admin-leads";
import { LEAD_STATUSES, SPAM_STATUS, type LeadStatus } from "@/lib/lead-status";

export type LeadListRow = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  postcode: string | null;
  status: string | null;
  service: string;
  source: string;
  received: string;
  waited: string;
  notes: number;
  visit: string | null;
};

type StatusFilter = "all" | LeadStatus;
type Sort = "attention" | "newest" | "oldest" | "name";

const SORTS: { value: Sort; label: string }[] = [
  { value: "attention", label: "New first" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
];

const STATUS_RANK: Record<LeadStatus, number> = { new: 0, contacted: 1, quoted: 2, won: 3, lost: 4, spam: 5 };

function nameOf(lead: LeadListRow) {
  return lead.name?.trim() || "Unnamed lead";
}

function matchesSearch(lead: LeadListRow, query: string) {
  if (!query) return true;
  return [lead.name, lead.phone, lead.email, lead.postcode, lead.service, lead.source]
    .map((value) => (value ?? "").toLowerCase())
    .join(" ")
    .includes(query);
}

function matchesStatus(lead: LeadListRow, status: StatusFilter) {
  const current = normalizeStatus(lead.status);
  // "All" hides spam so a flood doesn't bury real leads; filter by Spam to see it.
  if (status === "all") return current !== SPAM_STATUS;
  return current === status;
}

function compare(sort: Sort) {
  const time = (lead: LeadListRow) => new Date(lead.created_at).getTime();
  switch (sort) {
    case "newest":
      return (a: LeadListRow, b: LeadListRow) => time(b) - time(a);
    case "oldest":
      return (a: LeadListRow, b: LeadListRow) => time(a) - time(b);
    case "name":
      return (a: LeadListRow, b: LeadListRow) => nameOf(a).localeCompare(nameOf(b), "en-GB", { sensitivity: "base" });
    default:
      return (a: LeadListRow, b: LeadListRow) =>
        STATUS_RANK[normalizeStatus(a.status)] - STATUS_RANK[normalizeStatus(b.status)] || time(b) - time(a);
  }
}

const plural = (count: number) => `${count} lead${count === 1 ? "" : "s"}`;

const checkboxClass = "size-5 cursor-pointer rounded accent-peak-fleet";

function Extras({ lead }: { lead: LeadListRow }) {
  if (!lead.notes && !lead.visit) return null;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/80">
      {lead.visit ? (
        <span className="inline-flex items-center gap-1">
          <CalendarIcon className="size-3.5 text-peak-fleet" />
          {lead.visit}
        </span>
      ) : null}
      {lead.notes ? (
        <span className="inline-flex items-center gap-1">
          <NoteIcon className="size-3.5 text-peak-fleet" />
          {lead.notes === 1 ? "1 note" : `${lead.notes} notes`}
        </span>
      ) : null}
    </span>
  );
}

export function LeadsList({ leads, initialStatus }: { leads: LeadListRow[]; initialStatus: StatusFilter }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [sort, setSort] = useState<Sort>("attention");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [isBulkPending, startBulkTransition] = useTransition();

  const statusCounts = useMemo(() => {
    const counts = { all: 0 } as Record<StatusFilter, number>;
    for (const value of LEAD_STATUSES) counts[value] = 0;
    for (const lead of leads) {
      const value = normalizeStatus(lead.status);
      counts[value] += 1;
      if (value !== SPAM_STATUS) counts.all += 1;
    }
    return counts;
  }, [leads]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => matchesSearch(lead, query) && matchesStatus(lead, status)).sort(compare(sort));
  }, [leads, search, status, sort]);

  // Bulk actions only touch selected leads that are currently visible.
  const visibleSelected = filtered.filter((lead) => selectedIds.has(lead.id));
  const allVisibleSelected = filtered.length > 0 && visibleSelected.length === filtered.length;
  const selectedCount = visibleSelected.length;

  function chooseStatus(next: StatusFilter) {
    setStatus(next);
    setConfirmingDelete(false);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("status");
    else url.searchParams.set("status", next);
    window.history.replaceState(null, "", url);
  }

  function setLeadSelected(id: string, selected: boolean) {
    setConfirmingDelete(false);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function setAllVisibleSelected(selected: boolean) {
    setConfirmingDelete(false);
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const lead of filtered) {
        if (selected) next.add(lead.id);
        else next.delete(lead.id);
      }
      return next;
    });
  }

  function runBulk(action: (ids: string[]) => Promise<BulkLeadsResult>, describe: (count: number) => string) {
    const ids = visibleSelected.map((lead) => lead.id);
    setBulkMessage(null);
    setConfirmingDelete(false);
    startBulkTransition(async () => {
      const result = await safeAction(() => action(ids));
      if (!result.ok) {
        setBulkMessage(result.error);
        return;
      }
      setSelectedIds(new Set());
      setBulkMessage(describe(result.count));
      router.refresh();
    });
  }

  const chips: StatusFilter[] = ["all", ...LEAD_STATUSES];

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <label className="sr-only" htmlFor="leads-search">
            Search leads
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink/80" />
          <input
            id="leads-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, phone, email, postcode"
            className="h-11 w-full rounded-full border border-admin-edge bg-admin-surface pr-4 pl-10 text-[0.9375rem] text-ink placeholder:text-ink/60 hover:border-peak-fleet"
          />
        </div>
        <div className="relative sm:ml-auto">
          <label className="sr-only" htmlFor="leads-sort">
            Sort leads
          </label>
          <select
            id="leads-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="h-11 w-full cursor-pointer appearance-none rounded-full border border-admin-edge bg-admin-surface pr-10 pl-4 text-sm font-bold text-ink hover:border-peak-fleet sm:w-auto"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2" />
        </div>
      </div>

      <div role="group" aria-label="Filter by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((chip) => {
          const active = status === chip;
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={active}
              onClick={() => chooseStatus(chip)}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors md:h-9 ${
                active
                  ? "border-frost bg-frost text-navy"
                  : "border-admin-line bg-admin-surface text-ink hover:border-peak-fleet"
              }`}
            >
              {chip === "all" ? "All" : STATUS_LABELS[chip]}
              <span className={`tabular-nums ${active ? "text-navy/80" : "text-ink/70"}`}>{statusCounts[chip]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-11 flex-wrap items-center gap-3">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            disabled={filtered.length === 0}
            onChange={(event) => setAllVisibleSelected(event.target.checked)}
            className={checkboxClass}
          />
          {selectedCount > 0 ? `${plural(selectedCount)} selected` : "Select all shown"}
        </label>
        {selectedCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <button
              type="button"
              className={secondaryButton}
              disabled={isBulkPending}
              onClick={() => runBulk(markLeadsAsSpam, (count) => `Marked ${plural(count)} as spam.`)}
            >
              <StatusSpamIcon className="size-4" />
              Mark as spam
            </button>
            {confirmingDelete ? (
              <>
                <button
                  type="button"
                  className={primaryButton}
                  disabled={isBulkPending}
                  onClick={() => runBulk(deleteLeads, (count) => `Deleted ${plural(count)}.`)}
                >
                  <TrashIcon className="size-4" />
                  Permanently delete {plural(selectedCount)}
                </button>
                <button type="button" className={secondaryButton} onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" className={secondaryButton} disabled={isBulkPending} onClick={() => setConfirmingDelete(true)}>
                <TrashIcon className="size-4" />
                Delete
              </button>
            )}
            <button
              type="button"
              className="min-h-11 rounded-full px-3 text-sm font-bold text-peak-fleet hover:text-ridge-cyan"
              onClick={() => setAllVisibleSelected(false)}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <p role="status" className="text-sm font-bold text-ridge-cyan empty:hidden">
        {bulkMessage}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-admin-line bg-admin-surface">
          <EmptyState
            illustration={<SearchIllustration />}
            title="No leads match."
            action={
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  setSearch("");
                  chooseStatus("all");
                }}
              >
                Clear search and filters
              </button>
            }
          >
            {status === "all" ? "Try another search." : `Nothing is at ${STATUS_LABELS[status]} with this search.`}
          </EmptyState>
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {filtered.map((lead) => (
              <li key={lead.id} className="rounded-xl border border-admin-line bg-admin-surface p-4">
                <div className="flex items-start gap-3">
                  <label className="-m-3 flex shrink-0 cursor-pointer p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={(event) => setLeadSelected(lead.id, event.target.checked)}
                      aria-label={`Select ${nameOf(lead)}`}
                      className={`${checkboxClass} mt-0.5`}
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/leads/${lead.id}`} className="-my-2.5 block rounded-sm py-2.5 text-base font-bold break-words text-ink hover:text-ridge-cyan">
                      {nameOf(lead)}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink/80">
                      {lead.service} · {lead.source}
                    </p>
                    <p className="mt-0.5 text-sm text-ink/80">
                      {lead.received} · {lead.waited} ago
                    </p>
                    <div className="mt-2">
                      <Extras lead={lead} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 pl-8">
                  <StatusControl leadId={lead.id} leadName={nameOf(lead)} initialStatus={lead.status} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-xl border border-admin-line bg-admin-surface md:block">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Leads</caption>
              <thead className="border-b border-admin-line">
                <tr className="admin-label">
                  <th scope="col" className="w-12 py-3 pl-5">
                    <span className="sr-only">Select</span>
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Lead
                  </th>
                  <th scope="col" className="w-[22%] px-4 py-3 font-bold">
                    Received
                  </th>
                  <th scope="col" className="w-44 px-4 py-3 font-bold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-line">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="align-top transition-colors hover:bg-admin-raised/60">
                    <td className="py-4 pl-5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={(event) => setLeadSelected(lead.id, event.target.checked)}
                        aria-label={`Select ${nameOf(lead)}`}
                        className={checkboxClass}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/leads/${lead.id}`} className="rounded-sm text-[0.9375rem] font-bold break-words text-ink hover:text-ridge-cyan hover:underline underline-offset-4">
                        {nameOf(lead)}
                      </Link>
                      <p className="mt-0.5 text-ink/80">
                        {lead.service} · {lead.source}
                      </p>
                      <div className="mt-1.5">
                        <Extras lead={lead} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-ink/80">
                      <span className="block text-ink">{lead.received}</span>
                      {lead.waited} ago
                    </td>
                    <td className="px-4 py-4">
                      <StatusControl leadId={lead.id} leadName={nameOf(lead)} initialStatus={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
