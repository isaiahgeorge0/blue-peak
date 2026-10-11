"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ComponentType } from "react";
import { updateLeadStatus } from "@/app/admin/leads/actions";
import {
  ChevronDownIcon,
  StatusContactedIcon,
  StatusLostIcon,
  StatusNewIcon,
  StatusQuotedIcon,
  StatusSpamIcon,
  StatusWonIcon,
} from "@/components/admin/icons";
import { safeAction } from "@/components/admin/safe-action";
import { useToast } from "@/components/admin/toast";
import { normalizeStatus, STATUS_LABELS } from "@/lib/admin-leads";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";

/*
  Statuses in brand blues and greys only, each with its own mark and label:
  New is the bright highlight (it needs a reply), Contacted and Quoted step
  through the blues, Won is solid Frost White, Lost and Spam recede.
*/
const STATUS_STYLES: Record<LeadStatus, { className: string; Icon: ComponentType<{ className?: string }> }> = {
  new: { className: "bg-ridge-cyan/15 text-ridge-cyan ring-1 ring-inset ring-ridge-cyan/40", Icon: StatusNewIcon },
  contacted: { className: "bg-peak-fleet/10 text-peak-fleet ring-1 ring-inset ring-peak-fleet/40", Icon: StatusContactedIcon },
  quoted: { className: "bg-traverse text-frost ring-1 ring-inset ring-frost/20", Icon: StatusQuotedIcon },
  won: { className: "bg-frost text-navy", Icon: StatusWonIcon },
  lost: { className: "text-ink/80 ring-1 ring-inset ring-ink/35", Icon: StatusLostIcon },
  spam: { className: "text-ink/70 ring-1 ring-inset ring-ink/25", Icon: StatusSpamIcon },
};

export function StatusBadge({ status, className = "" }: { status: string | null; className?: string }) {
  const value = normalizeStatus(status);
  const { className: tone, Icon } = STATUS_STYLES[value];
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full pr-3 pl-2 text-xs font-bold ${tone} ${className}`}>
      <Icon className="size-3.5" />
      {STATUS_LABELS[value]}
    </span>
  );
}

type StatusControlProps = {
  leadId: string;
  leadName: string;
  initialStatus: string | null;
  /** Large in the lead header, compact in lists. */
  size?: "md" | "sm";
};

/**
 * The status as a badge that is also a native select, so it works the same
 * with a keyboard, a screen reader and a phone's picker. The change shows at
 * once and is confirmed with a toast; if saving fails it goes back to what
 * was saved, and says so.
 */
export function StatusControl({ leadId, leadName, initialStatus, size = "sm" }: StatusControlProps) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<LeadStatus>(normalizeStatus(initialStatus));
  const [synced, setSynced] = useState(initialStatus);
  if (initialStatus !== synced) {
    setSynced(initialStatus);
    setStatus(normalizeStatus(initialStatus));
  }
  const [isPending, startTransition] = useTransition();
  const refreshTimer = useRef<number | undefined>(undefined);

  function change(next: string) {
    const previous = status;
    const value = normalizeStatus(next);
    if (value === previous) return;
    setStatus(value);
    window.clearTimeout(refreshTimer.current);
    startTransition(async () => {
      const result = await safeAction(() => updateLeadStatus(leadId, value));
      if (!result.ok) {
        setStatus(previous);
        toast(`Couldn't save. ${leadName} is still ${STATUS_LABELS[previous]}.`);
        return;
      }
      setStatus(result.status);
      toast(`${leadName}: ${STATUS_LABELS[result.status]}.`);
      // Let the toast land before the list re-sorts around the change.
      refreshTimer.current = window.setTimeout(() => router.refresh(), 1200);
    });
  }

  const { className: tone, Icon } = STATUS_STYLES[status];
  const height = size === "md" ? "h-11" : "h-11 md:h-9";

  return (
    <span className={`relative inline-flex ${height} items-center rounded-full ${tone} ${isPending ? "opacity-70" : ""} transition-opacity`}>
      <Icon className="pointer-events-none absolute left-3 size-3.5" />
      <select
        value={status}
        onChange={(event) => change(event.target.value)}
        disabled={isPending}
        aria-label={`Status for ${leadName}`}
        className={`${height} cursor-pointer appearance-none rounded-full bg-transparent pr-8 pl-8 text-sm font-bold text-current outline-none disabled:cursor-wait`}
      >
        {LEAD_STATUSES.map((option) => (
          <option key={option} value={option} className="bg-admin-surface text-ink">
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-4" />
    </span>
  );
}
