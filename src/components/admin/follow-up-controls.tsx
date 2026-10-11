"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setFollowUpsPaused, setJobCompleted } from "@/app/admin/leads/actions";
import { FollowUpsIcon, PauseIcon, PlayIcon, StatusWonIcon } from "@/components/admin/icons";
import { safeAction } from "@/components/admin/safe-action";
import { useToast } from "@/components/admin/toast";
import { secondaryButton, textLink } from "@/components/admin/ui";

type Props = {
  leadId: string;
  leadName: string;
  /** Why this lead never gets follow-ups, in a sentence, or null. Pausing doesn't count. */
  blockedReason: string | null;
  paused: boolean;
  isWon: boolean;
  /** Preformatted UK date and time, or null. */
  completedAt: string | null;
  /** "Quote chaser 1 on Tue 14 Oct, 08:00", or null when nothing is coming up. */
  next: string | null;
  globallyOff: boolean;
};

/** The lead's follow-up state, the pause switch and, on Won leads, job completion. */
export function FollowUpControls({ leadId, leadName, blockedReason, paused: savedPaused, isWon, completedAt, next, globallyOff }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [paused, setPaused] = useState(savedPaused);
  const [synced, setSynced] = useState(savedPaused);
  if (savedPaused !== synced) {
    setSynced(savedPaused);
    setPaused(savedPaused);
  }
  const [pausePending, startPause] = useTransition();
  const [completePending, startComplete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function togglePause() {
    const nextPaused = !paused;
    setError(null);
    setPaused(nextPaused);
    startPause(async () => {
      const result = await safeAction(() => setFollowUpsPaused(leadId, nextPaused));
      if (!result.ok) {
        setPaused(!nextPaused);
        setError(result.error);
        return;
      }
      toast(nextPaused ? `Follow-ups paused for ${leadName}.` : `Follow-ups resumed for ${leadName}.`);
      router.refresh();
    });
  }

  function complete(done: boolean) {
    setError(null);
    startComplete(async () => {
      const result = await safeAction(() => setJobCompleted(leadId, done));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast(done ? "Job marked complete." : "Job no longer marked complete.");
      router.refresh();
    });
  }

  const summary = blockedReason
    ? blockedReason
    : paused
      ? `Paused. Nothing will be sent to ${leadName} until you resume.`
      : next
        ? `Next: ${next}.`
        : "Nothing scheduled.";

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <FollowUpsIcon className="mt-0.5 size-5 shrink-0 text-peak-fleet" />
        <div className="min-w-0 space-y-1">
          <p className="text-[0.9375rem] text-ink">{summary}</p>
          {globallyOff && !blockedReason ? (
            <p className="text-sm text-ink/80">Follow-ups are switched off for everyone, so due emails are logged as skipped.</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {blockedReason ? null : (
          <button type="button" onClick={togglePause} disabled={pausePending} className={secondaryButton}>
            {paused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
            {paused ? "Resume follow-ups" : "Pause follow-ups"}
          </button>
        )}
        {completedAt ? null : isWon ? (
          <button type="button" onClick={() => complete(true)} disabled={completePending} className={secondaryButton}>
            <StatusWonIcon className="size-4" />
            {completePending ? "Saving…" : "Mark job complete"}
          </button>
        ) : null}
      </div>

      {completedAt ? (
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink">
          <span className="inline-flex items-center gap-1.5">
            <StatusWonIcon className="size-4 text-peak-fleet" />
            Job completed {completedAt}
          </span>
          <button
            type="button"
            onClick={() => complete(false)}
            disabled={completePending}
            className={`${textLink} inline-flex min-h-11 items-center`}
            aria-label="Undo: job not complete"
          >
            {completePending ? "Saving…" : "Undo"}
          </button>
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-bold text-ridge-cyan">
          {error}
        </p>
      ) : null}
    </div>
  );
}
