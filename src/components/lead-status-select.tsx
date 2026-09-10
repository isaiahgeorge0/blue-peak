"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { updateLeadStatus } from "@/app/admin/leads/actions";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";

type LeadStatusSelectProps = {
  leadId: string;
  initialStatus: string | null;
};

function normalizeStatus(value: string | null): LeadStatus {
  if (value && (LEAD_STATUSES as readonly string[]).includes(value)) {
    return value as LeadStatus;
  }
  return "new";
}

export function LeadStatusSelect({
  leadId,
  initialStatus,
}: LeadStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(
    normalizeStatus(initialStatus),
  );

  useEffect(() => {
    setStatus(normalizeStatus(initialStatus));
  }, [initialStatus]);
  const [feedback, setFeedback] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [isPending, startTransition] = useTransition();
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(nextStatus: string) {
    const previous = status;
    const normalized = normalizeStatus(nextStatus);
    setStatus(normalized);
    setFeedback("saving");

    if (savedTimeout.current) {
      clearTimeout(savedTimeout.current);
    }

    startTransition(async () => {
      const result = await updateLeadStatus(leadId, normalized);
      if (!result.ok) {
        setStatus(previous);
        setFeedback("error");
        return;
      }

      setStatus(result.status);
      setFeedback("saved");
      // Refresh after "Saved" so sort order updates without wiping the indicator.
      savedTimeout.current = setTimeout(() => {
        setFeedback("idle");
        router.refresh();
      }, 1500);
    });
  }

  const showSaving = feedback === "saving" || isPending;

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(event) => handleChange(event.target.value)}
        disabled={showSaving}
        aria-label="Lead status"
        className="rounded-md border border-off-white/15 bg-charcoal px-2 py-1.5 text-sm text-off-white outline-none transition-colors focus:border-baby-blue disabled:opacity-60"
      >
        {LEAD_STATUSES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="min-w-14 text-xs text-off-white/60" aria-live="polite">
        {showSaving
          ? "Saving..."
          : feedback === "saved"
            ? "Saved"
            : feedback === "error"
              ? "Failed"
              : ""}
      </span>
    </div>
  );
}
