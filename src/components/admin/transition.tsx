"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const COVER_MS = 250;
const EXIT_MS = 250;
const SETTLE_MS = 300;
const FADE_MS = 150;
const HOLD_MAX_MS = 3000;
/** How long focus waits for a streaming page's heading before staying on the page itself. */
const FOCUS_WAIT_MS = 15000;

/*
  The A of the BLUE PEAK wordmark, 24.87 x 23.44 units: its two legs with the
  small peak inside, and its solid outline. Growing, the solid fills in so the
  A covers the screen without a gap through its middle.
*/
const A_WIDTH = 24.87;
const A_HEIGHT = 23.44;
const A_LEGS = "M0 23.44 9.93 0h5l9.94 23.44h-4.94L12.43 5.74 4.93 23.44Z";
const A_PEAK = "M8.03 23.44 12.43 13.04 16.83 23.44Z";
const A_SOLID = "M0 23.44 9.93 0h5l9.94 23.44Z";
/** Height of the A when it first rises into view. */
const A_START_PX = 72;

/** Fired on window once the new page is revealed, for anything that waits to be seen (the dashboard count-up). */
export const ADMIN_REVEALED_EVENT = "admin:revealed";

type Phase = "idle" | "covering" | "holding" | "revealing";

/** The admin page an anchor click would open, or null if it should be left alone. */
function transitionTarget(event: MouseEvent): URL | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return null;
  }
  const anchor = (event.target as Element | null)?.closest?.("a");
  if (!anchor || !anchor.getAttribute("href")) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (!url.pathname.startsWith("/admin") || url.pathname.startsWith("/admin/login")) return null;
  // Same page with other search params (calendar months) is an in-page change.
  if (url.pathname === window.location.pathname) return null;
  return url;
}

function main() {
  return document.getElementById("main");
}

function focusNewPage() {
  const heading = main()?.querySelector<HTMLElement>("h1");
  if (heading) {
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  } else {
    main()?.focus({ preventScroll: true });
  }
}

function pageReady() {
  return !main()?.querySelector("[data-admin-skeleton]");
}

/**
 * Behind a skeleton there is no heading yet: move focus to it once the page
 * arrives, unless the user has moved focus on. Returns a cleanup.
 */
function focusWhenReady() {
  const target = main();
  // Ready once the skeleton is gone and the page's heading is in (they can land in separate commits).
  const ready = () => pageReady() && !!target?.querySelector("h1");
  if (!target || ready()) return () => {};
  const observer = new MutationObserver(() => {
    if (!ready()) return;
    stop();
    if (document.activeElement === target || document.activeElement === document.body) focusNewPage();
  });
  const timer = window.setTimeout(() => observer.disconnect(), FOCUS_WAIT_MS);
  const stop = () => {
    observer.disconnect();
    window.clearTimeout(timer);
  };
  observer.observe(target, { childList: true, subtree: true });
  return stop;
}

/**
 * Admin page transitions. A link to another admin page is held while the
 * peak A rises from the bottom in Blue Solution and grows to cover the
 * screen; then the route is pushed. As soon as the new page's shell has
 * rendered (usually its loading skeleton, with the data still streaming in)
 * the A carries on up and the page settles in with a short fade and rise.
 * Only if the shell itself is slow is the cover held, for up to HOLD_MAX_MS. Back and forward
 * get a plain fade, as does everything under reduced motion. Filters, sorts
 * and calendar months stay on the same path and are left alone. Any failure
 * removes the cover, so it can never trap the page.
 */
export function AdminTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const coverRef = useRef<HTMLDivElement>(null);
  const solidRef = useRef<HTMLDivElement>(null);
  const run = useRef({
    phase: "idle" as Phase,
    from: "",
    arrived: false,
    timers: [] as number[],
    viewport: 0,
  });
  const arriveRef = useRef<() => void>(() => {});
  const lastPath = useRef(pathname);

  useEffect(() => {
    const state = run.current;
    const cover = coverRef.current;
    const solid = solidRef.current;
    if (!cover || !solid) return;

    const clearWaits = () => {
      state.timers.forEach((timer) => window.clearTimeout(timer));
      state.timers = [];
    };

    const reset = () => {
      clearWaits();
      const wasActive = state.phase !== "idle";
      state.phase = "idle";
      state.arrived = false;
      cover.getAnimations().forEach((animation) => animation.cancel());
      solid.getAnimations().forEach((animation) => animation.cancel());
      cover.style.display = "none";
      delete document.documentElement.dataset.adminTransition;
      if (wasActive) window.dispatchEvent(new Event(ADMIN_REVEALED_EVENT));
    };

    const reveal = () => {
      if (state.phase !== "holding") return;
      state.phase = "revealing";
      clearWaits();
      state.timers.push(window.setTimeout(reset, EXIT_MS + 1000));
      // Two frames' grace: the new page paints its first (heavy) frame while the cover is still, not mid-exit.
      requestAnimationFrame(() => requestAnimationFrame(exitCover));
    };

    const exitCover = () => {
      if (state.phase !== "revealing") return;
      try {
        const exit = cover.animate(
          [{ transform: "translateY(0)" }, { transform: `translateY(${-state.viewport}px)` }],
          { duration: EXIT_MS, easing: EASE_IN_OUT, fill: "forwards" },
        );
        main()?.animate(
          [
            { opacity: 0, transform: "translateY(16px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: SETTLE_MS, easing: EASE_OUT, fill: "backwards" },
        );
        focusNewPage();
        focusWhenReady();
        exit.finished.then(reset, reset);
      } catch {
        reset();
      }
    };

    // The new route's shell has rendered (its loading skeleton counts): reveal it and let the data stream in.
    const arrive = () => {
      if (state.phase !== "holding") return;
      reveal();
    };

    const start = (url: URL) => {
      const width = window.innerWidth;
      const viewport = Math.max(window.innerHeight, document.documentElement.clientHeight);
      // Units per pixel at which the A, standing on the bottom edge, covers the top corners.
      const legSlope = (A_WIDTH / 2 - 2.5) / A_HEIGHT;
      const unit = ((width / 2 + legSlope * viewport) / (A_WIDTH / 2)) * 1.04;
      const coverWidth = A_WIDTH * unit;
      const coverHeight = A_HEIGHT * unit;
      const startScale = A_START_PX / coverHeight;

      state.phase = "covering";
      state.arrived = false;
      state.from = window.location.pathname;
      state.viewport = viewport;
      document.documentElement.dataset.adminTransition = "true";

      Object.assign(cover.style, {
        display: "block",
        width: `${coverWidth}px`,
        height: `${coverHeight}px`,
        left: `${(width - coverWidth) / 2}px`,
        top: `${viewport - coverHeight}px`,
      });

      const href = url.pathname + url.search + url.hash;
      router.prefetch(href);

      const rise = cover.animate(
        [
          { transform: `translateY(${A_START_PX + 8}px) scale(${startScale})`, easing: EASE_OUT },
          { transform: `translateY(0) scale(${startScale})`, offset: 0.3, easing: EASE_IN_OUT },
          { transform: "translateY(0) scale(1)" },
        ],
        { duration: COVER_MS, fill: "forwards" },
      );
      solid.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1, offset: 0.75 }, { opacity: 1 }], {
        duration: COVER_MS,
        fill: "forwards",
      });

      rise.finished.then(() => {
        if (state.phase !== "covering") return;
        state.phase = "holding";
        state.timers.push(window.setTimeout(reveal, HOLD_MAX_MS));
        if (state.arrived) {
          arrive();
          return;
        }
        router.push(href);
      }, reset);

      // Last resort: whatever happens, the cover is gone after this.
      state.timers.push(window.setTimeout(reset, COVER_MS + HOLD_MAX_MS + EXIT_MS + 1000));
    };

    const onClick = (event: MouseEvent) => {
      try {
        const url = transitionTarget(event);
        if (!url) return;
        if (state.phase !== "idle") {
          event.preventDefault();
          return;
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        event.preventDefault();
        start(url);
      } catch {
        reset();
      }
    };

    // Capture on window runs before React's handlers at the root, so Next's
    // Link sees defaultPrevented and leaves the navigation to us.
    window.addEventListener("click", onClick, true);
    arriveRef.current = arrive;
    return () => {
      window.removeEventListener("click", onClick, true);
      reset();
    };
  }, [router]);

  // Before paint on a route change, so a new page is never shown uncovered or unfaded for a frame.
  useLayoutEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const state = run.current;
    if (state.phase === "holding") {
      if (pathname !== state.from) arriveRef.current();
      return;
    }
    if (state.phase === "covering") {
      state.arrived = true;
      return;
    }
    if (state.phase === "revealing") return;
    try {
      main()?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: "linear", fill: "backwards" });
      focusNewPage();
    } catch {
      // A missing fade is harmless.
    }
    return focusWhenReady();
  }, [pathname]);

  return (
    <div
      ref={coverRef}
      aria-hidden
      className="pointer-events-auto fixed z-[70] origin-bottom will-change-transform"
      style={{ display: "none" }}
    >
      <svg viewBox={`0 0 ${A_WIDTH} ${A_HEIGHT}`} className="absolute inset-0 size-full text-brand" fill="currentColor">
        <path d={A_LEGS} />
        <path d={A_PEAK} className="text-peak-fleet" />
      </svg>
      <div ref={solidRef} className="absolute inset-0 opacity-0 will-change-[opacity]">
        <svg viewBox={`0 0 ${A_WIDTH} ${A_HEIGHT}`} className="size-full text-brand" fill="currentColor">
          <path d={A_SOLID} />
        </svg>
      </div>
    </div>
  );
}
