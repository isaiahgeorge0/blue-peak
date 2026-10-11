"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { logoutAdmin } from "@/app/admin/actions";
import { AdminTransition } from "@/components/admin/transition";
import { CloseIcon, LogOutIcon, MoreIcon, PanelIcon } from "@/components/admin/icons";
import { addonNav, pageTitleFor, primaryNav, type NavItem } from "@/components/admin/nav-items";
import { ToastProvider } from "@/components/admin/toast";
import { useModalFocus } from "@/components/admin/use-modal-focus";
import { BrandMark } from "@/components/brand/brand-logo";

export type AdminUser = { firstName: string | null; email: string };

type Mode = "full" | "rail" | "sheet";

function NavLink({ item, mode, active, tag }: { item: NavItem; mode: Mode; active: boolean; tag?: string }) {
  const { Icon } = item;
  // In the rail the label is a visually hidden name plus a tooltip; from xl it is plain text.
  const railOnly = mode === "rail";
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors duration-200 ${
        railOnly ? "justify-center xl:justify-start" : ""
      } ${active ? "bg-admin-raised text-ink" : "text-ink/80 hover:bg-admin-raised/60 hover:text-ink"}`}
    >
      {active ? <span aria-hidden className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-ridge-cyan" /> : null}
      <Icon className={`size-5 transition-colors ${active ? "text-ridge-cyan" : "text-peak-fleet"}`} />
      <span className={`min-w-0 ${railOnly ? "sr-only xl:not-sr-only" : ""}`}>{item.label}</span>
      {tag ? (
        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] whitespace-nowrap font-bold tracking-wide text-ink/80 ring-1 ring-inset ring-ink/30 ${railOnly ? "hidden xl:inline" : ""}`}>
          {tag}
        </span>
      ) : null}
      {railOnly ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-md bg-frost px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-navy opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 xl:hidden"
        >
          {item.label}
        </span>
      ) : null}
    </Link>
  );
}

function UserBlock({ user, mode }: { user: AdminUser | null; mode: Mode }) {
  if (!user) return null;
  const name = user.firstName ?? user.email;
  const railOnly = mode === "rail";
  return (
    <div className={`flex items-center gap-3 ${railOnly ? "flex-col xl:flex-row" : ""}`}>
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-admin-raised font-serif text-lg text-ink uppercase ring-1 ring-inset ring-admin-line">
        {name.charAt(0)}
      </span>
      <div className={`min-w-0 flex-1 ${railOnly ? "sr-only xl:not-sr-only" : ""}`}>
        <p className="text-xs text-ink/80">Signed in as</p>
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
      </div>
      <form action={logoutAdmin}>
        {mode === "sheet" ? (
          <button
            type="submit"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-admin-edge px-4 text-sm font-bold text-ink transition-colors hover:border-peak-fleet hover:bg-admin-raised"
          >
            <LogOutIcon className="size-4" />
            Log out
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Log out"
            title="Log out"
            className="grid size-11 place-items-center rounded-full text-ink/80 transition-colors hover:bg-admin-raised hover:text-ink"
          >
            <LogOutIcon className="size-5" />
          </button>
        )}
      </form>
    </div>
  );
}

function NavContents({
  mode,
  pathname,
  user,
  onExpand,
  expandRef,
}: {
  mode: Mode;
  pathname: string;
  user: AdminUser | null;
  onExpand?: () => void;
  expandRef?: RefObject<HTMLButtonElement | null>;
}) {
  const railOnly = mode === "rail";
  return (
    <>
      <div className={`flex h-16 shrink-0 items-center gap-3 px-3 ${railOnly ? "justify-center xl:justify-start" : ""}`}>
        <Link href="/admin" className="flex min-h-11 items-center gap-3 rounded-lg px-1 text-ink" aria-label="Blue Peak admin, Dashboard">
          <BrandMark title="" className="h-7 w-auto shrink-0 text-frost" />
          <span className={`font-serif text-xl leading-none tracking-heading ${railOnly ? "hidden xl:inline" : ""}`}>Blue Peak</span>
        </Link>
      </div>
      {railOnly && onExpand ? (
        <button
          ref={expandRef}
          type="button"
          onClick={onExpand}
          aria-label="Expand menu"
          aria-haspopup="dialog"
          className="mx-auto mb-2 grid size-11 place-items-center rounded-lg text-ink/80 transition-colors hover:bg-admin-raised hover:text-ink xl:hidden"
        >
          <PanelIcon className="size-5" />
        </button>
      ) : null}

      <nav aria-label={mode === "full" ? "Admin menu" : "Admin"} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {primaryNav.map((item) => (
            <li key={item.href}>
              <NavLink item={item} mode={mode} active={item.match(pathname)} />
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-admin-line pt-5">
          <p className={`admin-label mb-2 px-3 ${railOnly ? "sr-only xl:not-sr-only" : ""}`}>Add-ons</p>
          <ul className="space-y-1">
            {addonNav.map((item) => (
              <li key={item.href}>
                <NavLink item={item} mode={mode} active={item.match(pathname)} tag="Add-on" />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="shrink-0 border-t border-admin-line p-3">
        <UserBlock user={user} mode={mode} />
      </div>
    </>
  );
}

/** Slides in over the page: the expanded rail on tablets, the More sheet on phones. */
function Overlay({
  open,
  onClose,
  opener,
  label,
  side,
  children,
}: {
  open: boolean;
  onClose: () => void;
  opener: RefObject<HTMLElement | null>;
  label: string;
  side: "left" | "bottom";
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalFocus(open, panel, onClose, opener);
  const closed = side === "left" ? "-translate-x-full" : "translate-y-full";
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-admin-base/75 transition-[opacity,visibility] duration-300 ease-out ${open ? "opacity-100" : "invisible opacity-0"}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!open}
        className={`fixed z-50 flex flex-col bg-admin-surface shadow-[0_0_48px_rgba(4,10,20,0.5)] duration-300 ease-out ${
          side === "left"
            ? "inset-y-0 left-0 w-72 border-r border-admin-line"
            : "admin-tabbar inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t border-admin-line"
        } ${
          // Visible at once on open (so focus can move in); hidden only after the slide out on close.
          open
            ? "visible translate-0 transition-transform motion-reduce:transition-none"
            : `invisible ${closed} transition-[transform,visibility] motion-reduce:transition-[visibility]`
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <h2 id={titleId} className="sr-only">
            {label}
          </h2>
          {side === "bottom" ? <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-admin-line" /> : null}
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${label.toLowerCase()}`}
            className="ml-auto grid size-11 place-items-center rounded-full text-ink/80 transition-colors hover:bg-admin-raised hover:text-ink"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

function PhoneTabBar({ pathname, onMore, moreRef, moreOpen }: { pathname: string; onMore: () => void; moreRef: RefObject<HTMLButtonElement | null>; moreOpen: boolean }) {
  const onAddon = addonNav.some((item) => item.match(pathname));
  const tab = "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-bold transition-colors";
  return (
    <nav aria-label="Admin" className="admin-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-admin-line bg-admin-surface/95 backdrop-blur md:hidden">
      <ul className="flex">
        {primaryNav.map((item) => {
          const active = item.match(pathname);
          const { Icon } = item;
          return (
            <li key={item.href} className="flex flex-1">
              <Link href={item.href} aria-current={active ? "page" : undefined} className={`${tab} ${active ? "text-ridge-cyan" : "text-ink/80"}`}>
                {active ? <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full bg-ridge-cyan" /> : null}
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button
            ref={moreRef}
            type="button"
            onClick={onMore}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={`${tab} ${onAddon ? "text-ridge-cyan" : "text-ink/80"}`}
          >
            {onAddon ? <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full bg-ridge-cyan" /> : null}
            <MoreIcon className="size-5" />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function AdminShell({ user, children }: { user: AdminUser | null; children: ReactNode }) {
  const pathname = usePathname();
  const [railOpen, setRailOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const railButton = useRef<HTMLButtonElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const [shownPath, setShownPath] = useState(pathname);
  if (pathname !== shownPath) {
    setShownPath(pathname);
    setRailOpen(false);
    setMoreOpen(false);
  }

  if (pathname.startsWith("/admin/login")) {
    return <div className="theme-admin flex min-h-dvh flex-1 flex-col bg-page">{children}</div>;
  }

  return (
    <ToastProvider>
      <div className="theme-admin flex min-h-dvh flex-1 flex-col bg-page text-ink">
        <a
          href="#main"
          className="sr-only rounded-full bg-frost text-sm font-bold text-navy focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] focus:px-5 focus:py-3"
        >
          Skip to content
        </a>

        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[4.5rem] flex-col border-r border-admin-line bg-admin-surface md:flex xl:w-64">
          <NavContents mode="rail" pathname={pathname} user={user} onExpand={() => setRailOpen(true)} expandRef={railButton} />
        </aside>

        <div className="hidden md:block xl:hidden">
          <Overlay open={railOpen} onClose={() => setRailOpen(false)} opener={railButton} label="Menu" side="left">
            <NavContents mode="full" pathname={pathname} user={user} />
          </Overlay>
        </div>

        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-admin-line bg-admin-surface/95 px-4 backdrop-blur md:hidden">
          <Link href="/admin" aria-label="Dashboard" className="grid size-11 place-items-center rounded-lg">
            <BrandMark title="" className="h-6 w-auto text-frost" />
          </Link>
          <p className="font-serif text-xl tracking-heading text-ink">{pageTitleFor(pathname)}</p>
        </header>

        <main id="main" tabIndex={-1} className="admin-main flex-1 outline-none md:pl-[4.5rem] xl:pl-64">
          <div className="mx-auto w-full max-w-6xl px-5 pt-6 pb-10 sm:px-8 md:pt-10 lg:pb-16">{children}</div>
        </main>

        <PhoneTabBar pathname={pathname} onMore={() => setMoreOpen(true)} moreRef={moreButton} moreOpen={moreOpen} />
        <div className="md:hidden">
          <Overlay open={moreOpen} onClose={() => setMoreOpen(false)} opener={moreButton} label="More" side="bottom">
            <div className="overflow-y-auto px-4 pb-4">
              <p className="admin-label px-3 pb-2">Add-ons</p>
              <ul className="space-y-1">
                {addonNav.map((item) => (
                  <li key={item.href}>
                    <NavLink item={item} mode="sheet" active={item.match(pathname)} tag="Add-on" />
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-admin-line px-3 pt-4">
                <UserBlock user={user} mode="sheet" />
              </div>
            </div>
          </Overlay>
        </div>

        <AdminTransition />
      </div>
    </ToastProvider>
  );
}
