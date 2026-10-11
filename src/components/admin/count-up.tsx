"use client";

import { useEffect, useRef } from "react";
import { ADMIN_REVEALED_EVENT } from "./transition";

const SESSION_KEY = "bp-admin-counted";
const COUNT_MS = 700;

/**
 * A dashboard figure that counts up from zero the first time the dashboard is
 * seen in a browser session, then simply shows its value. The real number is
 * in the server HTML, so nothing depends on this running; reduced motion
 * skips it.
 */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || value === 0) return;
    let counted = true;
    try {
      counted = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Storage blocked: just show the value.
    }
    if (counted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const count = () => {
      const start = performance.now();
      const tick = (time: number) => {
        const progress = Math.min(1, (time - start) / COUNT_MS);
        const eased = 1 - (1 - progress) ** 3;
        element.textContent = String(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    element.textContent = "0";
    // Behind a page transition the count waits until the page is revealed.
    const covered = document.documentElement.dataset.adminTransition === "true";
    if (covered) window.addEventListener(ADMIN_REVEALED_EVENT, count, { once: true });
    else count();
    return () => {
      window.removeEventListener(ADMIN_REVEALED_EVENT, count);
      cancelAnimationFrame(frame);
      element.textContent = String(value);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}

/** Marks the session's count-up as done, once every figure on the page has started. */
export function CountUpDone() {
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Storage blocked: figures will count again next time, which is harmless.
    }
  }, []);
  return null;
}
