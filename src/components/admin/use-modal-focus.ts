"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * While open: focus moves into the panel, Tab cycles inside it and Escape
 * closes it. On close, focus goes back to the opener (or whatever had focus
 * when it opened).
 */
export function useModalFocus(
  open: boolean,
  panel: RefObject<HTMLElement | null>,
  close: () => void,
  opener?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const element = panel.current;
    const returnTo = opener?.current ?? (document.activeElement as HTMLElement | null);
    const focusable = () => [...(element?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    const focusFirst = () => (element?.querySelector<HTMLElement>("[data-autofocus]") ?? focusable()[0])?.focus();
    focusFirst();
    // If the panel was not focusable yet (still becoming visible), try again on the next frame.
    const frame = requestAnimationFrame(() => {
      if (!element?.contains(document.activeElement)) focusFirst();
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      if (returnTo?.isConnected) returnTo.focus({ preventScroll: true });
    };
  }, [open, panel, opener, close]);
}
