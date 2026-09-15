"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/admin/actions";

const primaryNav = [
  { href: "/admin", label: "Dashboard", match: (path: string) => path === "/admin" },
  {
    href: "/admin/leads",
    label: "Leads",
    match: (path: string) => path.startsWith("/admin/leads"),
  },
] as const;

const upcomingNav = [
  { label: "Subcontractors" },
  { label: "Quotes & Invoices" },
  { label: "Referrals" },
  { label: "SEO & Visibility" },
] as const;

function navClass(active: boolean) {
  return [
    "block rounded-md px-3 py-2 text-sm transition-colors",
    active
      ? "bg-baby-blue/15 text-baby-blue"
      : "text-off-white/75 hover:bg-off-white/5 hover:text-off-white",
  ].join(" ");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/admin/login");

  if (isLogin) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-charcoal">
        <div className="border-b border-off-white/10 bg-black px-6 py-4">
          <p className="font-serif text-lg tracking-tight text-off-white">
            Blue Peak Admin
          </p>
        </div>
        <div className="mx-auto w-full max-w-md flex-1 px-6 py-10">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-charcoal md:flex-row">
      <aside className="flex w-full flex-col border-b border-off-white/10 bg-black md:w-60 md:border-r md:border-b-0">
        <div className="border-b border-off-white/10 px-5 py-5">
          <p className="font-serif text-lg tracking-tight text-off-white">
            Blue Peak Admin
          </p>
          <p className="mt-1 text-xs text-off-white/45">Internal tools</p>
        </div>

        <nav aria-label="Admin" className="flex flex-1 flex-col px-3 py-4">
          <div className="space-y-1">
            {primaryNav.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 border-t border-off-white/10 pt-5">
            <p className="px-3 text-[11px] font-medium tracking-wide text-off-white/35 uppercase">
              Coming next
            </p>
            <ul className="mt-2 space-y-1">
              {upcomingNav.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-off-white/40">
                    <span>{item.label}</span>
                    <span className="shrink-0 rounded border border-off-white/10 px-1.5 py-0.5 text-[10px] tracking-wide text-off-white/35 uppercase">
                      Soon
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto border-t border-off-white/10 pt-4">
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="w-full rounded-md border border-off-white/15 px-3 py-2 text-left text-sm text-off-white/70 transition-colors hover:border-baby-blue hover:text-baby-blue"
              >
                Log out
              </button>
            </form>
          </div>
        </nav>
      </aside>

      <div className="flex-1 overflow-x-auto">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
