import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { CalendarEventRow } from "@/app/admin/calendar/actions";
import { AdminCalendar } from "@/components/admin-calendar";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Calendar",
    description: "Admin planning calendar for Blue Peak Solutions.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

type SearchParams = Promise<{
  year?: string;
  month?: string;
}>;

function parseYearMonth(
  yearParam: string | undefined,
  monthParam: string | undefined,
) {
  const now = new Date();
  const year = Number(yearParam);
  const month = Number(monthParam);

  const safeYear =
    Number.isInteger(year) && year >= 2000 && year <= 2100
      ? year
      : now.getFullYear();
  const safeMonth =
    Number.isInteger(month) && month >= 1 && month <= 12
      ? month
      : now.getMonth() + 1;

  return { year: safeYear, month: safeMonth };
}

function toDateKey(year: number, month: number, day: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function visibleRange(year: number, month: number) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const prevMonthDate = new Date(year, month - 2, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth() + 1;
  const daysInPrev = new Date(prevYear, prevMonth, 0).getDate();

  const rangeStartDay = firstWeekday === 0 ? 1 : daysInPrev - firstWeekday + 1;
  const rangeStart =
    firstWeekday === 0
      ? toDateKey(year, month, 1)
      : toDateKey(prevYear, prevMonth, rangeStartDay);

  const totalCells = firstWeekday + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  const nextMonthDate = new Date(year, month, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth() + 1;
  const rangeEnd =
    trailing === 0
      ? toDateKey(year, month, daysInMonth)
      : toDateKey(nextYear, nextMonth, trailing);

  return { rangeStart, rangeEnd };
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const { year, month } = parseYearMonth(params.year, params.month);
  const { rangeStart, rangeEnd } = visibleRange(year, month);

  const { data: events, error } = await supabase
    .from("calendar_events")
    .select(
      "id, title, notes, start_date, start_time, end_time, recurrence, created_at",
    )
    .eq("recurrence", "none")
    .gte("start_date", rangeStart)
    .lte("start_date", rangeEnd)
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("admin calendar: failed to load", error.message);
  }

  const rows = (events ?? []) as CalendarEventRow[];

  return (
    <div>
      {error ? (
        <p className="mb-6 rounded-md border border-baby-blue/40 bg-black px-4 py-3 text-sm text-off-white">
          Unable to load calendar events right now. If you just created the
          table, apply the migration and refresh.
        </p>
      ) : null}
      <AdminCalendar year={year} month={month} events={rows} />
    </div>
  );
}
