"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  deleteLeads,
  markLeadsAsSpam,
  type BulkLeadsResult,
  type LeadNoteRow,
} from "@/app/admin/leads/actions";
import {
  LeadNotesPanel,
  type LeadTableRow,
} from "@/components/lead-notes-panel";
import {
  LEAD_STATUSES,
  SPAM_STATUS,
  type LeadStatus,
} from "@/lib/lead-status";
import type { LeadVisitSummary } from "@/lib/lead-visits";

type StatusFilter = "all" | LeadStatus;

type LeadsTableProps = {
  leads: LeadTableRow[];
  notesByLead: Record<string, LeadNoteRow[]>;
  nextVisitByLead: Record<string, LeadVisitSummary>;
};

function matchesSearch(lead: LeadTableRow, query: string) {
  if (!query) return true;
  const haystack = [lead.name, lead.phone, lead.email, lead.service_type]
    .map((value) => (value ?? "").toLowerCase())
    .join(" ");
  return haystack.includes(query);
}

function matchesStatus(lead: LeadTableRow, status: StatusFilter) {
  const current =
    lead.status && (LEAD_STATUSES as readonly string[]).includes(lead.status)
      ? lead.status
      : "new";
  // "All" hides spam so a flood doesn't bury real leads; filter by Spam to see it.
  if (status === "all") return current !== SPAM_STATUS;
  return current === status;
}

const bulkButtonClassName =
  "rounded-md border border-off-white/15 px-3 py-1.5 text-sm text-off-white transition-colors hover:border-baby-blue hover:text-baby-blue disabled:opacity-60";

export function LeadsTable({
  leads,
  notesByLead,
  nextVisitByLead,
}: LeadsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [isBulkPending, startBulkTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter(
      (lead) => matchesSearch(lead, query) && matchesStatus(lead, status),
    );
  }, [leads, search, status]);

  // Bulk actions only touch selected leads that are currently visible.
  const visibleSelected = filtered.filter((lead) => selectedIds.has(lead.id));
  const allVisibleSelected =
    filtered.length > 0 && visibleSelected.length === filtered.length;

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

  function runBulk(
    action: (ids: string[]) => Promise<BulkLeadsResult>,
    describe: (count: number) => string,
  ) {
    const ids = visibleSelected.map((lead) => lead.id);
    setBulkMessage(null);
    setConfirmingDelete(false);
    startBulkTransition(async () => {
      const result = await action(ids);
      if (!result.ok) {
        setBulkMessage(result.error);
        return;
      }
      setSelectedIds(new Set());
      setBulkMessage(describe(result.count));
      router.refresh();
    });
  }

  const selectedCount = visibleSelected.length;
  const plural = (count: number) => `${count} lead${count === 1 ? "" : "s"}`;

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="leads-search">
          Search leads
        </label>
        <input
          id="leads-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone, email, service..."
          className="w-full rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none transition-colors placeholder:text-off-white/35 focus:border-baby-blue sm:max-w-sm"
        />
        <label className="sr-only" htmlFor="leads-status-filter">
          Filter by status
        </label>
        <select
          id="leads-status-filter"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none transition-colors focus:border-baby-blue sm:w-44"
        >
          <option value="all">All except spam</option>
          {LEAD_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {selectedCount > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-baby-blue/30 bg-black px-4 py-3 text-sm">
          <span className="text-off-white">{plural(selectedCount)} selected</span>
          <button
            type="button"
            className={bulkButtonClassName}
            disabled={isBulkPending}
            onClick={() =>
              runBulk(markLeadsAsSpam, (count) => `Marked ${plural(count)} as spam.`)
            }
          >
            Mark as spam
          </button>
          {confirmingDelete ? (
            <>
              <button
                type="button"
                className="rounded-md border border-red-400/60 px-3 py-1.5 text-sm text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-60"
                disabled={isBulkPending}
                onClick={() =>
                  runBulk(deleteLeads, (count) => `Deleted ${plural(count)}.`)
                }
              >
                Permanently delete {plural(selectedCount)}
              </button>
              <button
                type="button"
                className={bulkButtonClassName}
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className={bulkButtonClassName}
              disabled={isBulkPending}
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="ml-auto text-sm text-off-white/70 underline-offset-2 hover:text-off-white hover:underline"
            onClick={() => setAllVisibleSelected(false)}
          >
            Clear selection
          </button>
        </div>
      ) : null}

      {bulkMessage ? (
        <p role="status" className="mt-3 text-sm text-baby-blue">
          {bulkMessage}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-off-white/65">
          No leads match your search
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-off-white/10 bg-black">
          <table className="min-w-full text-left text-sm text-off-white/85">
            <thead className="border-b border-off-white/10 text-xs tracking-wide text-baby-blue uppercase">
              <tr>
                <th className="w-10 py-3 pr-0 pl-4">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) =>
                      setAllVisibleSelected(event.target.checked)
                    }
                    aria-label="Select all listed leads"
                    className="h-4 w-4 accent-baby-blue"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <LeadNotesPanel
                  key={lead.id}
                  lead={lead}
                  notes={notesByLead[lead.id] ?? []}
                  nextVisit={nextVisitByLead[lead.id] ?? null}
                  selected={selectedIds.has(lead.id)}
                  onSelectedChange={(selected) =>
                    setLeadSelected(lead.id, selected)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
