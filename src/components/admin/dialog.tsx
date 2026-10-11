"use client";

import { useCallback, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/admin/icons";
import { useModalFocus } from "@/components/admin/use-modal-focus";

/**
 * A modal dialog: a sheet from the bottom on phones, centred from sm. Escape,
 * the close button and the scrim all close it, unless `busy`.
 */
export function AdminDialog({
  open,
  onClose,
  title,
  description,
  busy = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  busy?: boolean;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const close = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);
  useModalFocus(open, panel, close);

  if (!open) return null;

  return (
    <div className="theme-admin fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div aria-hidden className="absolute inset-0 bg-admin-base/80" onClick={close} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="admin-toast relative max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto rounded-t-2xl border border-admin-line bg-admin-surface px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-2xl sm:pb-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-serif text-[1.5rem] leading-tight tracking-heading break-words text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-ink/80">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink/80 transition-colors hover:bg-admin-raised hover:text-ink"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export const fieldClass =
  "mt-1.5 block h-11 w-full rounded-lg border border-admin-edge bg-admin-base px-3.5 text-[0.9375rem] text-ink placeholder:text-ink/60 hover:border-peak-fleet disabled:opacity-60";

export const fieldLabelClass = "text-sm font-bold text-ink";
