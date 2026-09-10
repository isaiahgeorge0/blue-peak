import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";

export default function AdminLeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="mb-10 border-b border-off-white/10 bg-black">
        <div className="-mx-6 flex items-center justify-between gap-4 border-b border-off-white/10 px-6 py-4 sm:mx-0 sm:rounded-lg sm:border">
          <div className="flex items-center gap-6">
            <Link
              href="/admin/leads"
              className="font-serif text-lg tracking-tight text-off-white"
            >
              Blue Peak Admin
            </Link>
            <Link
              href="/admin/leads"
              className="text-sm text-off-white/70 transition-colors hover:text-baby-blue"
            >
              Leads
            </Link>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-full border border-off-white/20 px-4 py-2 text-sm text-off-white transition-colors hover:border-baby-blue hover:text-baby-blue"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
