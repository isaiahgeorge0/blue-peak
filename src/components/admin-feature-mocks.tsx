"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminFeaturePreviewId } from "@/lib/admin-feature-previews";

const chartTooltipStyle = {
  background: "#0a0a0a",
  border: "1px solid rgba(244,241,234,0.15)",
  borderRadius: 8,
  color: "#f4f1ea",
  fontSize: 12,
} as const;

function MiniLineChart({
  data,
  dataKey,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
}) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(244,241,234,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(244,241,234,0.45)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "rgba(244,241,234,0.45)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#89cff0"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniBarChart({
  data,
  dataKey,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
}) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(244,241,234,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(244,241,234,0.45)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "rgba(244,241,234,0.45)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey={dataKey} fill="#89cff0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-off-white/10 bg-black px-4 py-3">
      <p className="text-[11px] tracking-wide text-off-white/45 uppercase">{label}</p>
      <p className="mt-2 font-serif text-2xl text-off-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-off-white/45">{hint}</p> : null}
    </div>
  );
}

function MockTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-off-white/10 bg-black">
      <table className="min-w-full text-left text-sm text-off-white/80">
        <thead className="border-b border-off-white/10 text-[11px] tracking-wide text-baby-blue uppercase">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")} className="border-b border-off-white/5 last:border-b-0">
              {row.map((cell) => (
                <td key={cell} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** All figures below are fake sample data for locked previews only. */
function SubcontractorsMock() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Active trades" value="18" hint="On the books" />
        <StatCard label="Available this week" value="7" hint="Marked free" />
        <StatCard label="Avg rating" value="4.7" hint="Internal score" />
      </div>
      <div className="rounded-lg border border-off-white/10 bg-black px-4 py-4">
        <p className="text-sm text-off-white/70">Jobs assigned · last 8 weeks</p>
        <div className="mt-3">
          <MiniBarChart
            dataKey="jobs"
            data={[
              { label: "W1", jobs: 4 },
              { label: "W2", jobs: 6 },
              { label: "W3", jobs: 5 },
              { label: "W4", jobs: 8 },
              { label: "W5", jobs: 7 },
              { label: "W6", jobs: 9 },
              { label: "W7", jobs: 6 },
              { label: "W8", jobs: 10 },
            ]}
          />
        </div>
      </div>
      <MockTable
        columns={["Name", "Trade", "Status", "Last job"]}
        rows={[
          ["Mark Ellison", "Electrician", "Available", "Ipswich kitchen"],
          ["Sara Quinn", "Plasterer", "On site", "Felixstowe extension"],
          ["Dan Whitely", "Tiler", "Available", "Woodbridge bathroom"],
        ]}
      />
    </div>
  );
}

function QuotesMock() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Quotes sent" value="24" hint="This quarter" />
        <StatCard label="Open value" value="£86k" hint="Awaiting reply" />
        <StatCard label="Unpaid invoices" value="£12.4k" hint="3 overdue" />
      </div>
      <div className="rounded-lg border border-off-white/10 bg-black px-4 py-4">
        <p className="text-sm text-off-white/70">Quotes accepted · last 8 weeks</p>
        <div className="mt-3">
          <MiniLineChart
            dataKey="accepted"
            data={[
              { label: "W1", accepted: 2 },
              { label: "W2", accepted: 3 },
              { label: "W3", accepted: 2 },
              { label: "W4", accepted: 4 },
              { label: "W5", accepted: 5 },
              { label: "W6", accepted: 3 },
              { label: "W7", accepted: 4 },
              { label: "W8", accepted: 6 },
            ]}
          />
        </div>
      </div>
      <MockTable
        columns={["Client", "Type", "Amount", "Status"]}
        rows={[
          ["H. Patel", "Quote", "£14,800", "Opened"],
          ["R. Shaw", "Invoice", "£6,250", "Overdue"],
          ["L. Brooks", "Quote", "£22,400", "Accepted"],
        ]}
      />
    </div>
  );
}

function ReferralsMock() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Asks sent" value="31" hint="After job completion" />
        <StatCard label="Warm intros" value="9" hint="This quarter" />
        <StatCard label="Reward cost" value="£450" hint="Paid out" />
      </div>
      <div className="rounded-lg border border-off-white/10 bg-black px-4 py-4">
        <p className="text-sm text-off-white/70">Referrals received · last 8 weeks</p>
        <div className="mt-3">
          <MiniLineChart
            dataKey="referrals"
            data={[
              { label: "W1", referrals: 1 },
              { label: "W2", referrals: 0 },
              { label: "W3", referrals: 2 },
              { label: "W4", referrals: 1 },
              { label: "W5", referrals: 3 },
              { label: "W6", referrals: 2 },
              { label: "W7", referrals: 1 },
              { label: "W8", referrals: 2 },
            ]}
          />
        </div>
      </div>
      <MockTable
        columns={["From", "Introduced", "Reward", "Stage"]}
        rows={[
          ["N. Carter", "Kitchen lead", "£50", "Quoted"],
          ["P. Hughes", "Bathroom lead", "Pending", "Site visit"],
          ["A. Green", "Extension lead", "£50", "Won"],
        ]}
      />
    </div>
  );
}

function SeoMock() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="GBP score" value="84/100" hint="Profile completeness" />
        <StatCard label="Reviews (90d)" value="11" hint="New Google reviews" />
        <StatCard label="Top keywords" value="6" hint="In local pack" />
      </div>
      <div className="rounded-lg border border-off-white/10 bg-black px-4 py-4">
        <p className="text-sm text-off-white/70">Profile views · last 8 weeks</p>
        <div className="mt-3">
          <MiniBarChart
            dataKey="views"
            data={[
              { label: "W1", views: 120 },
              { label: "W2", views: 140 },
              { label: "W3", views: 132 },
              { label: "W4", views: 168 },
              { label: "W5", views: 190 },
              { label: "W6", views: 176 },
              { label: "W7", views: 210 },
              { label: "W8", views: 228 },
            ]}
          />
        </div>
      </div>
      <MockTable
        columns={["Signal", "Status", "Last updated", "Action"]}
        rows={[
          ["Google Business Profile", "Healthy", "2 days ago", "Add photos"],
          ["Citation: Yell", "Needs check", "3 weeks ago", "Confirm NAP"],
          ["Review requests", "On track", "Yesterday", "Follow up 2"],
        ]}
      />
    </div>
  );
}

export function AdminFeatureMock({ id }: { id: AdminFeaturePreviewId }) {
  switch (id) {
    case "subcontractors":
      return <SubcontractorsMock />;
    case "quotes":
      return <QuotesMock />;
    case "referrals":
      return <ReferralsMock />;
    case "seo":
      return <SeoMock />;
    default:
      return null;
  }
}
