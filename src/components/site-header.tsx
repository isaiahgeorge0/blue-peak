"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  headerCtaClassName,
  primaryCtaClassName,
} from "@/components/cta-styles";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/quote", label: "Estimate" },
  { href: "/contact", label: "Contact" },
];

const COMPACT_AFTER_PX = 96;

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function isScrolledPastTop() {
  return window.scrollY > COMPACT_AFTER_PX;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Full solid header at the top of the page. Once scrolled, it collapses into a
 * floating logo pill and a hamburger pill that opens the same overlay menu
 * used on mobile.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const compact = useSyncExternalStore(
    subscribeToScroll,
    isScrolledPastTop,
    () => false,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousGutter = root.style.scrollbarGutter;
    root.style.overflow = "hidden";
    root.style.scrollbarGutter = "stable";

    panelRef.current?.querySelector("a")?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu(true);
    };
    // The full desktop nav has no toggle, so an open menu would be stranded.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches && !isScrolledPastTop()) setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      root.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousGutter;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
      <div
        id={menuId}
        ref={panelRef}
        inert={!menuOpen}
        className={`fixed inset-0 z-40 bg-black/92 backdrop-blur-xl duration-300 ease-out motion-reduce:transition-none ${
          menuOpen
            ? "visible opacity-100 transition-opacity"
            : "invisible opacity-0 transition-[opacity,visibility]"
        }`}
      >
        <nav
          aria-label="Menu"
          className="mx-auto flex h-full max-w-6xl flex-col justify-center gap-10 overflow-y-auto px-6 pt-[var(--site-header-height)] pb-10"
        >
          <ul className="space-y-1 sm:space-y-2">
            {navLinks.map((link, index) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => closeMenu()}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className={`inline-block font-serif text-4xl tracking-tight transition-[opacity,translate,color] duration-500 ease-out hover:text-baby-blue motion-reduce:transition-none sm:text-5xl ${
                    isActive(pathname, link.href)
                      ? "text-baby-blue"
                      : "text-off-white"
                  } ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                  style={{
                    transitionDelay: menuOpen ? `${80 + index * 40}ms` : "0ms",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/contact"
              onClick={() => closeMenu()}
              className={primaryCtaClassName}
            >
              Get a quote
            </Link>
            <a
              href={`tel:${sitePhoneTel}`}
              className="text-sm text-off-white/75 transition-colors hover:text-baby-blue"
            >
              {sitePhoneDisplay}
            </a>
          </div>
        </nav>
      </div>

      <header
        data-compact={compact ? "true" : "false"}
        className="site-header group sticky top-0 z-50 h-[var(--site-header-height)]"
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
          <Link
            href="/"
            onClick={() => closeMenu()}
            className="pointer-events-auto shrink-0 rounded-full border border-transparent font-serif text-base tracking-tight text-off-white transition-all duration-300 ease-out hover:text-baby-blue motion-reduce:transition-none sm:text-lg group-data-[compact=true]:border-off-white/15 group-data-[compact=true]:bg-black/45 group-data-[compact=true]:px-4 group-data-[compact=true]:py-2 group-data-[compact=true]:text-sm group-data-[compact=true]:shadow-lg group-data-[compact=true]:shadow-black/30 group-data-[compact=true]:backdrop-blur-md"
          >
            Blue Peak Solutions
          </Link>

          <div className="relative flex min-h-10 min-w-10 items-center justify-end">
            <nav
              aria-label="Primary"
              className="hidden items-center gap-5 whitespace-nowrap transition-[opacity,translate,visibility] duration-300 ease-out motion-reduce:transition-none lg:flex group-data-[compact=true]:invisible group-data-[compact=true]:-translate-y-1 group-data-[compact=true]:opacity-0"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className="text-sm text-off-white/80 transition-colors hover:text-baby-blue aria-[current=page]:text-off-white"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={`tel:${sitePhoneTel}`}
                className="text-sm text-off-white/80 transition-colors hover:text-baby-blue"
              >
                {sitePhoneDisplay}
              </a>
              <Link href="/contact" className={headerCtaClassName}>
                Get a quote
              </Link>
            </nav>

            <button
              ref={toggleRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
              className="pointer-events-auto absolute top-1/2 right-0 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-transparent text-off-white transition-all duration-300 ease-out hover:text-baby-blue motion-reduce:transition-none group-data-[compact=true]:border-off-white/15 group-data-[compact=true]:bg-black/45 group-data-[compact=true]:shadow-lg group-data-[compact=true]:shadow-black/30 group-data-[compact=true]:backdrop-blur-md lg:group-data-[compact=false]:invisible lg:group-data-[compact=false]:scale-90 lg:group-data-[compact=false]:opacity-0"
            >
              <span aria-hidden className="relative block h-3.5 w-5">
                <span
                  className={`absolute top-0 left-0 h-0.5 w-5 rounded-full bg-current transition-[translate,rotate] duration-300 ease-out motion-reduce:transition-none ${
                    menuOpen ? "translate-y-[6px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute top-[6px] left-0 h-0.5 w-5 rounded-full bg-current transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none ${
                    menuOpen ? "scale-x-0 opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute top-3 left-0 h-0.5 w-5 rounded-full bg-current transition-[translate,rotate] duration-300 ease-out motion-reduce:transition-none ${
                    menuOpen ? "-translate-y-[6px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
