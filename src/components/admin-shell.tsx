"use client";

import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/admin/actions";

function sectionLabel(pathname: string) {
  if (pathname.startsWith("/admin/leads")) {
    return "Leads";
  }
  if (pathname.startsWith("/admin/login")) {
    return "Login";
  }
  return "Admin";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = sectionLabel(pathname);
  const showLogout = !pathname.startsWith("/admin/login");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-charcoal">
      <header className="border-b border-off-white/10 bg-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <p className="font-serif text-lg tracking-tight text-off-white">
              Blue Peak Admin
            </p>
            <span className="hidden text-off-white/25 sm:inline" aria-hidden>
              /
            </span>
            <p className="truncate text-sm text-off-white/65">{section}</p>
          </div>
          {showLogout ? (
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="rounded-md border border-off-white/20 px-4 py-2 text-sm text-off-white transition-colors hover:border-baby-blue hover:text-baby-blue"
              >
                Log out
              </button>
            </form>
          ) : null}
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</div>
    </div>
  );
}
