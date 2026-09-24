"use client";

import { useMemo, useState } from "react";
import type { LeadNoteRow } from "@/app/admin/leads/actions";
import {
  LeadNotesPanel,
  type LeadTableRow,
} from "@/components/lead-notes-panel";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";

type StatusFilter = "all" | LeadStatus;

type LeadsTableProps = {
  leads: LeadTableRow[];
  notesByLead: Record<string, LeadNoteRow[]>;
};

function matchesSearch(lead: LeadTableRow, query: string) {
  if (!query) return true;
  const haystack = [lead.name, lead.phone, lead.email, lead.service_type]
    .map((value) => (value ?? "").toLowerCase())
    .join(" ");
  return haystack.includes(query);
}

function matchesStatus(lead: LeadTableRow, status: StatusFilter) {
  if (status === "all") return true;
  const current =
    lead.status && (LEAD_STATUSES as readonly string[]).includes(lead.status)
      ? lead.status
      : "new";
  return current === status;
}

export function LeadsTable({ leads, notesByLead }: LeadsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter(
      (lead) => matchesSearch(lead, query) && matchesStatus(lead, status),
    );
  }, [leads, search, status]);

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
          <option value="all">All</option>
          {LEAD_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-off-white/65">
          No leads match your search
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-off-white/10 bg-black">
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
              {filtered.map((lead) => (
                <LeadNotesPanel
                  key={lead.id}
                  lead={lead}
                  notes={notesByLead[lead.id] ?? []}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
