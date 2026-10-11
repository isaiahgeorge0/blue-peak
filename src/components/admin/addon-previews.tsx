import type { ReactNode } from "react";
import type { AddonId } from "@/lib/admin-addons";

/*
  Static pictures of each add-on, drawn in the admin's own components so they
  read as the real thing to come. Every name and figure is invented.
*/

function Row({ children, last = false }: { children: ReactNode; last?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:flex-nowrap ${last ? "" : "border-b border-admin-line"}`}>
      {children}
    </div>
  );
}

function Tag({ children, tone = "fleet" }: { children: ReactNode; tone?: "fleet" | "cyan" | "frost" | "muted" }) {
  const tones = {
    fleet: "bg-peak-fleet/15 text-peak-fleet",
    cyan: "bg-ridge-cyan/15 text-ridge-cyan",
    frost: "bg-frost text-navy",
    muted: "text-ink/80 ring-1 ring-inset ring-ink/35",
  };
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-admin-raised px-4 py-3">
      <p className="text-xs font-semibold text-ink/80">{label}</p>
      <p className="mt-1 font-serif text-2xl text-ink">{value}</p>
    </div>
  );
}

function Subcontractors() {
  const trades = [
    ["Hughes Electrical", "Electrician · Ipswich", "Free this week", "cyan"],
    ["P. Walsh Plastering", "Plasterer · Felixstowe", "Booked to Fri", "muted"],
    ["Orwell Plumbing", "Plumber · Woodbridge", "Free from Mon", "fleet"],
    ["S. Grant Roofing", "Roofer · Colchester", "Free this week", "cyan"],
  ] as const;
  return (
    <div className="overflow-hidden rounded-lg border border-admin-line">
      {trades.map(([name, trade, when, tone], index) => (
        <Row key={name} last={index === trades.length - 1}>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">{name}</p>
            <p className="text-xs text-ink/80">{trade}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink/80" aria-hidden>{"★".repeat(index === 1 ? 4 : 5)}</span>
            <Tag tone={tone}>{when}</Tag>
          </div>
        </Row>
      ))}
    </div>
  );
}

function Quotes() {
  const rows = [
    ["Q-1042", "Kitchen refit, Felixstowe", "£18,400", "Sent", "fleet"],
    ["Q-1041", "Loft conversion, Ipswich", "£42,000", "Accepted", "cyan"],
    ["INV-311", "Bathroom, Woodbridge", "£9,850", "Paid", "frost"],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Figure label="Outstanding" value="£27,250" />
        <Figure label="Paid this month" value="£9,850" />
      </div>
      <div className="overflow-hidden rounded-lg border border-admin-line">
        {rows.map(([ref, job, amount, state, tone], index) => (
          <Row key={ref} last={index === rows.length - 1}>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{job}</p>
              <p className="text-xs text-ink/80">{ref}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink tabular-nums">{amount}</span>
              <Tag tone={tone}>{state}</Tag>
            </div>
          </Row>
        ))}
      </div>
    </div>
  );
}

function Referrals() {
  const steps = [
    ["Job finished", "Rear extension, Woodbridge"],
    ["Referral message sent", "To J. Patel, two days later"],
    ["New enquiry", "Sam R., referred by J. Patel"],
    ["Reward recorded", "Once Sam's job is won"],
  ];
  return (
    <ol className="space-y-0">
      {steps.map(([title, detail], index) => (
        <li key={title} className="relative flex gap-4 pb-5 last:pb-0">
          {index < steps.length - 1 ? <span className="absolute top-6 bottom-0 left-[0.6875rem] w-px bg-admin-line" aria-hidden /> : null}
          <span className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full ${index === 2 ? "bg-ridge-cyan text-navy" : "bg-admin-raised text-peak-fleet ring-1 ring-inset ring-admin-line"}`} aria-hidden>
            <span className="size-1.5 rounded-full bg-current" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">{title}</p>
            <p className="text-xs text-ink/80">{detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Seo() {
  const pages = [
    ["Kitchen renovations in Ipswich", "Service page", 9],
    ["Extensions in Felixstowe", "Service page", 6],
    ["Loft conversions, Colchester", "Ad landing page", 4],
    ["Bathrooms in Woodbridge", "Service page", 3],
  ] as const;
  return (
    <div className="overflow-hidden rounded-lg border border-admin-line">
      {pages.map(([title, kind, enquiries], index) => (
        <Row key={title} last={index === pages.length - 1}>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">{title}</p>
            <p className="text-xs text-ink/80">{kind}</p>
          </div>
          <div className="flex w-36 items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-admin-raised" aria-hidden>
              <span className="block h-full origin-left rounded-full bg-peak-fleet" style={{ transform: `scaleX(${enquiries / 10})` }} />
            </span>
            <span className="w-16 text-right text-xs text-ink/80 tabular-nums">{enquiries} enquiries</span>
          </div>
        </Row>
      ))}
    </div>
  );
}

const previews: Record<AddonId, () => ReactNode> = {
  subcontractors: Subcontractors,
  quotes: Quotes,
  referrals: Referrals,
  seo: Seo,
};

export function AddonPreview({ id }: { id: AddonId }) {
  const Preview = previews[id];
  return <Preview />;
}
