"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { BrandMark } from "@/components/brand/brand-logo";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const COVER_MS = 300;
const EXIT_MS = 300;
const RISE_MS = 350;
const FADE_MS = 150;
const HOLD_MAX_MS = 3000;
/** tan(31deg): the roof pitch. */
const PITCH = 0.60086;

type Phase = "idle" | "covering" | "holding" | "revealing";

type Geometry = { rise: number; height: number };

/** The internal page an anchor click would open, or null if it should be left alone. */
function transitionTarget(event: MouseEvent): URL | null {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }
  const anchor = (event.target as Element | null)?.closest?.("a");
  if (!anchor || !anchor.getAttribute("href")) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  const url = new URL(anchor.href, window.location.href);
  // tel:, mailto: and other schemes have an opaque ("null") origin.
  if (url.origin !== window.location.origin) return null;
  // Same page, including hash links to a section of it.
  if (url.pathname === window.location.pathname) return null;
  if (url.pathname.startsWith("/admin") || window.location.pathname.startsWith("/admin")) {
    return null;
  }
  return url;
}

function focusNewPage() {
  const main = document.getElementById("main");
  const heading = main?.querySelector<HTMLElement>("h1");
  if (heading) {
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  } else {
    main?.focus({ preventScroll: true });
  }
}

/**
 * Page transitions between public pages. An internal link click is held while
 * a Blue Solution panel, its leading edge cut at the 31 degree roof pitch,
 * sweeps up over the page; then the route is pushed. Once the new route has
 * rendered (or after HOLD_MAX_MS regardless) the panel carries on off the top
 * while the new page rises in. Back/forward and reduced motion get a plain
 * fade instead. Any failure removes the panel, so it can never trap the page.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const run = useRef({
    phase: "idle" as Phase,
    from: "",
    arrived: false,
    geometry: { rise: 0, height: 0 } as Geometry,
    timers: [] as number[],
  });
  const revealRef = useRef<() => void>(() => {});
  const lastPath = useRef(pathname);

  useEffect(() => {
    const state = run.current;
    const panel = panelRef.current;
    const mark = markRef.current;
    if (!panel || !mark) return;

    const clearTimers = () => {
      state.timers.forEach((timer) => window.clearTimeout(timer));
      state.timers = [];
    };

    const reset = () => {
      clearTimers();
      state.phase = "idle";
      state.arrived = false;
      panel.getAnimations().forEach((animation) => animation.cancel());
      panel.style.display = "none";
      delete document.documentElement.dataset.pageTransition;
    };

    const reveal = () => {
      if (state.phase !== "holding") return;
      state.phase = "revealing";
      clearTimers();
      try {
        const { rise, height } = state.geometry;
        const exit = panel.animate(
          [
            { transform: `translateY(${-rise}px)` },
            { transform: `translateY(${-height}px)` },
          ],
          { duration: EXIT_MS, easing: EASE_IN_OUT, fill: "forwards" },
        );
        document.getElementById("main")?.animate(
          [
            { opacity: 0, transform: "translateY(24px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: RISE_MS, easing: EASE_OUT, fill: "backwards" },
        );
        focusNewPage();
        exit.finished.then(reset, reset);
        state.timers.push(window.setTimeout(reset, EXIT_MS + 500));
      } catch {
        reset();
      }
    };

    const start = (url: URL) => {
      const width = window.innerWidth;
      // The pitched edge spans the full width on phones and 60% of it above,
      // so the slope never gets taller than about a third of a desktop screen.
      const slope = width < 768 ? width : width * 0.6;
      const rise = Math.round(slope * PITCH);
      const viewport = Math.max(
        window.innerHeight,
        document.documentElement.clientHeight,
      );
      const height = viewport + 2 * rise;
      state.geometry = { rise, height };
      state.phase = "covering";
      state.arrived = false;
      state.from = window.location.pathname;
      document.documentElement.dataset.pageTransition = "true";

      panel.style.height = `${height}px`;
      panel.style.clipPath = `polygon(0 ${rise}px, ${slope}px 0, 100% 0, 100% ${height - rise}px, ${slope}px ${height - rise}px, 0 100%)`;
      mark.style.top = `${rise + viewport / 2}px`;
      panel.style.display = "block";

      const href = url.pathname + url.search + url.hash;
      router.prefetch(href);

      const cover = panel.animate(
        [
          { transform: `translateY(${viewport}px)` },
          { transform: `translateY(${-rise}px)` },
        ],
        { duration: COVER_MS, easing: EASE_IN_OUT, fill: "forwards" },
      );

      cover.finished.then(() => {
        if (state.phase !== "covering") return;
        state.phase = "holding";
        state.timers.push(window.setTimeout(reveal, HOLD_MAX_MS));
        if (state.arrived) {
          reveal();
          return;
        }
        router.push(href);
      }, reset);

      // Last resort: whatever happens, the panel is gone after this.
      state.timers.push(
        window.setTimeout(reset, COVER_MS + HOLD_MAX_MS + EXIT_MS + 1000),
      );
    };

    const onClick = (event: MouseEvent) => {
      try {
        const url = transitionTarget(event);
        if (!url) return;
        if (state.phase !== "idle") {
          event.preventDefault();
          return;
        }
        if (
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          document.documentElement.dataset.intro === "play"
        ) {
          return;
        }
        event.preventDefault();
        start(url);
      } catch {
        reset();
      }
    };

    // Capture on window runs before React's handlers at the root, so Next's
    // Link sees defaultPrevented and leaves the navigation to us.
    window.addEventListener("click", onClick, true);
    revealRef.current = reveal;
    return () => {
      window.removeEventListener("click", onClick, true);
      reset();
    };
  }, [router]);

  // Runs before paint when the route changes, so a new page is never shown
  // uncovered or unfaded for a frame.
  useLayoutEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const state = run.current;
    if (state.phase === "holding") {
      if (pathname !== state.from) revealRef.current();
      return;
    }
    if (state.phase === "covering") {
      state.arrived = true;
      return;
    }
    if (state.phase === "revealing") return;
    try {
      document
        .getElementById("main")
        ?.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: FADE_MS,
          easing: "linear",
          fill: "backwards",
        });
      focusNewPage();
    } catch {
      // A missing fade is harmless.
    }
  }, [pathname]);

  return (
    <div
      ref={panelRef}
      aria-hidden
      className="pointer-events-auto fixed top-0 left-0 z-[70] w-screen bg-brand will-change-transform"
      style={{ display: "none" }}
    >
      <div ref={markRef} className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2">
        <BrandMark title="" className="h-10 w-auto text-peak-white sm:h-12" />
      </div>
    </div>
  );
}
