// DRAFT - NOT FOR LAUNCH. Contains placeholder legal details ([TBC ...]) pending
// Zay's sign-off. Kept noindex and unlinked from the nav until every gap is
// filled; do not add it to the sitemap, header or footer before then.
import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Privacy policy",
    description:
      "How Blue Peak collects, uses and protects personal data from website visitors and enquirers.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

/** Unfilled legal detail. Styled to stand out so it can't ship unnoticed. */
function Tbc({ children }: { children: string }) {
  return (
    <strong className="rounded bg-accent/15 px-1.5 py-0.5 font-medium text-accent ring-1 ring-accent/40">
      {children}
    </strong>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-ink/10 pt-10 first:border-t-0 first:pt-0">
      <h2 className="text-2xl tracking-heading text-ink sm:text-3xl">
        {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-3xl text-lg leading-relaxed text-ink/80">
      {children}
    </p>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="max-w-3xl list-disc space-y-2 pl-5 text-base leading-relaxed text-ink/80 marker:text-accent">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

type TableProps = {
  /** Omit for a two-column label/value table. */
  head?: string[];
  rows: ReactNode[][];
};

function Table({ head, rows }: TableProps) {
  return (
    <div
      tabIndex={0}
      className="overflow-x-auto rounded-lg border border-ink/10 bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <table className="min-w-full text-left text-sm leading-relaxed text-ink/80">
        {head ? (
          <thead className="border-b border-ink/10 text-xs tracking-wide text-accent uppercase">
            <tr>
              {head.map((cell) => (
                <th key={cell} scope="col" className="px-4 py-3 font-medium">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-ink/5 align-top last:border-b-0"
            >
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th
                    key={cellIndex}
                    scope="row"
                    className="px-4 py-3 font-medium whitespace-nowrap text-ink"
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex} className="min-w-48 px-4 py-3">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const planned = <em className="text-ink/70">(planned)</em>;

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="bg-panel">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
          <p className="text-sm font-bold tracking-wide text-accent uppercase">
            Blue Peak
          </p>
          <h1 className="mt-3 text-4xl leading-display tracking-heading text-ink sm:text-5xl sm:tracking-display">
            Privacy policy
          </h1>
          <p className="mt-4 text-sm text-ink/70">
            <em>Last updated: 1 October 2026</em>
          </p>
          <div className="mt-8 space-y-4">
            <P>
              This policy explains how{" "}
              <Tbc>
                [Blue Peak Ltd — registered company name and number TBC]
              </Tbc>{" "}
              (&quot;Blue Peak&quot;, &quot;we&quot;, &quot;us&quot;) collects,
              uses and protects personal data when you visit our website, submit
              an
              enquiry through our contact form or quote estimator, or (once
              launched) use our website FAQ assistant. It applies to all
              visitors and enquirers, and is written to meet the UK General Data
              Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </P>
            <P>
              This policy does not cover information we hold about our own
              employees or subcontractors, which is handled separately.
            </P>
          </div>
        </div>
      </section>

      <section className="bg-page">
        <div className="mx-auto max-w-4xl space-y-12 px-6 py-16 lg:py-20">
          <Section title="Who we are">
            <P>
              Blue Peak is the data controller for the personal data described
              in this policy.
            </P>
            <Table
              rows={[
                [
                  "Registered name",
                  <Tbc key="name">[TBC — exact Companies House name]</Tbc>,
                ],
                ["Company number", <Tbc key="number">[TBC]</Tbc>],
                [
                  "Registered office",
                  <Tbc key="office">[TBC — registered address]</Tbc>,
                ],
                ["Trading as", "Blue Peak"],
                [
                  "Data protection contact",
                  <Tbc key="contact">
                    [TBC: named email address]
                  </Tbc>,
                ],
              ]}
            />
            <P>
              We have not appointed a Data Protection Officer, as we are not
              required to under UK GDPR; the contact above handles all data
              protection matters.
            </P>
          </Section>

          <Section title="What personal data we collect">
            <P>
              We collect personal data directly from you when you interact with
              our website. We do not buy or receive personal data about you from
              third parties.
            </P>
            <Table
              head={["Source", "What we collect"]}
              rows={[
                [
                  "Contact form",
                  "Name, phone number, email address (if provided), postcode, the message you enter, service requested",
                ],
                [
                  "Quote estimator",
                  "Name, phone number, project type, size and finish preferences, estimated cost range, estimated time on site",
                ],
                [
                  <>Website FAQ assistant {planned}</>,
                  "The questions you type into the assistant, and any personal details you choose to include in them",
                ],
                [
                  "Automatically, via our forms",
                  "A salted, one-way hashed version of your IP address, used only to apply rate limits against spam and abuse. We cannot reverse this back to your actual IP address.",
                ],
                [
                  "Automatically, via Vercel Analytics",
                  <>
                    <Tbc>
                      [TBC — confirm before launch: Vercel Analytics is planned
                      but not yet installed on the site. Install it before this
                      policy goes live, or remove this row if we decide not to
                      use it.]
                    </Tbc>{" "}
                    Once in use: aggregated, anonymised usage data (pages
                    viewed, approximate region, device type). This does not
                    identify you personally and is covered under Cookies and
                    analytics below
                  </>,
                ],
              ]}
            />
            <P>
              We do not knowingly collect any special category data (e.g.
              health, religion, ethnicity) through these forms, and ask that you
              do not include such information in free-text fields.
            </P>
          </Section>

          <Section title="How and why we use your data">
            <Table
              head={["Purpose", "What we do", "Lawful basis (UK GDPR Art. 6)"]}
              rows={[
                [
                  "Respond to your enquiry",
                  "Contact you by phone or email about your enquiry or quote",
                  "Legitimate interests: responding to enquiries you have initiated",
                ],
                [
                  "Prepare and send a quote",
                  "Use the details you provide to generate and discuss a cost estimate",
                  "Steps taken at your request, prior to entering a contract (Art. 6(1)(b))",
                ],
                [
                  "Deliver any contracted work",
                  "Process your data as needed to carry out agreed building/renovation work",
                  "Performance of a contract (Art. 6(1)(b))",
                ],
                [
                  "Internal lead management",
                  "Store and track your enquiry in our admin system so nothing is missed",
                  "Legitimate interests: running our business efficiently",
                ],
                [
                  "Fraud and abuse prevention",
                  "Rate-limit and screen form submissions (see How we protect your data, below)",
                  "Legitimate interests: protecting our systems and your data from bots and misuse",
                ],
                [
                  <>Website FAQ assistant {planned}</>,
                  "Answer general questions about our services",
                  "Legitimate interests: providing helpful information; we will not use this feature to collect or store personal data beyond what's needed to answer your question",
                ],
              ]}
            />
            <P>
              We never use your data for automated decision-making or profiling
              that produces legal or similarly significant effects on you.
            </P>
          </Section>

          <Section title="Who we share your data with">
            <P>
              We do not sell your personal data. We share it only with the
              service providers below, who process it on our behalf or as part
              of running our website:
            </P>
            <Table
              head={["Provider", "Role", "What they process"]}
              rows={[
                [
                  "Supabase",
                  "Database hosting (London, UK)",
                  "All lead and enquiry data, encrypted at rest; access restricted to authorised Blue Peak admins only",
                ],
                [
                  "Resend",
                  "Transactional email",
                  "Enquiry details, to send lead notification emails to our team",
                ],
                [
                  "Vercel",
                  "Website hosting",
                  "Hosts the site and processes form submissions server-side",
                ],
                [
                  "Cloudflare (Turnstile)",
                  "Bot/spam protection",
                  "Verifies form submissions are from real visitors, not automated scripts",
                ],
                ["ntfy.sh", "Push notifications", "See important note below"],
              ]}
            />
            <P>
              <strong className="text-ink">
                ntfy.sh, important note:
              </strong>{" "}
              we send a push notification to our team for every new enquiry,
              containing the enquirer&apos;s name, phone number and a summary of
              their enquiry, and may send follow-up reminder notifications
              (containing the same name and phone number) if an enquiry
              hasn&apos;t been actioned. This is delivered via ntfy.sh&apos;s
              public notification service over an unlisted, randomly-generated
              address. Unlike our other providers, this is a public third-party
              service without a signed data processing agreement, and the
              notification content is not end-to-end encrypted in transit on
              their platform. We limit what is sent to the minimum needed for
              our team to action the enquiry promptly, and we are reviewing this
              arrangement to ensure it meets an appropriate standard of
              protection.
            </P>
            <P>
              We may also disclose personal data where required by law, for
              example to comply with a court order or regulatory request.
            </P>
          </Section>

          <Section title="How long we keep your data">
            <Table
              head={["Data type", "Retention"]}
              rows={[
                [
                  "Enquiries that do not convert to a job",
                  "12 months from last contact, then deleted",
                ],
                ["Enquiries marked as spam", "Deleted within 30 days"],
                [
                  "Customers with completed or ongoing work",
                  "Retained for the duration of the relationship plus 6 years, to meet our accounting, warranty and insurance obligations",
                ],
                [
                  "Website analytics (Vercel)",
                  "Retained in aggregated, anonymised form per Vercel's standard retention. See Cookies and analytics",
                ],
              ]}
            />
            <P>
              Retention above reflects our policy; deletion is currently carried
              out by manual review rather than an automated process. You can ask
              us to delete your data sooner at any time. See Your rights, below.
            </P>
          </Section>

          <Section title="Cookies and analytics">
            <P>
              <Tbc>
                [TBC — confirm before launch: Vercel Analytics is planned but
                not yet installed on the site. Install it before this policy
                goes live, or remove this paragraph if we decide not to use it.]
              </Tbc>{" "}
              Once in use, Vercel Analytics will help us understand how visitors
              use our site: which pages are viewed, roughly where visitors are
              located, and what device they&apos;re using. This is
              privacy-friendly by design: it does not use cookies, does not
              track you across other websites, and cannot identify you
              individually.
            </P>
            <P>
              We also use a strictly necessary cookie-free mechanism (Cloudflare
              Turnstile) to check that form submissions come from real people,
              not bots. This runs invisibly when you open the contact or quote
              form and does not track your browsing.
            </P>
            <P>
              Because neither of these sets tracking cookies, we do not
              currently show a cookie consent banner. If we introduce tools that
              do use cookies (for example, marketing or advertising pixels) in
              future, we will update this policy and add a consent banner before
              doing so.
            </P>
          </Section>

          <Section title="How we protect your data">
            <P>
              We take appropriate technical and organisational measures to
              protect your data, including:
            </P>
            <List
              items={[
                "Access to enquiry and lead data restricted to authorised Blue Peak administrators only, enforced at both the application and database level",
                "Encryption of data at rest and in transit",
                "Automated protection against spam and bot submissions (rate limiting, invisible bot checks, and honeypot fields)",
                "Regular review of our systems for security gaps",
              ]}
            />
            <P>
              No system is completely secure, and we cannot guarantee absolute
              security of data transmitted over the internet. If we become aware
              of a data breach affecting your personal data, we will notify the
              Information Commissioner&apos;s Office (ICO) and, where required,
              affected individuals, in line with our legal obligations.
            </P>
          </Section>

          <Section title="Your rights">
            <P>Under UK GDPR, you have the right to:</P>
            <List
              items={[
                ["Access", "ask us what personal data we hold about you"],
                [
                  "Rectification",
                  "ask us to correct inaccurate or incomplete data",
                ],
                [
                  "Erasure",
                  'ask us to delete your data ("right to be forgotten"), subject to our legal retention obligations',
                ],
                [
                  "Restriction",
                  "ask us to limit how we use your data while a query is resolved",
                ],
                [
                  "Object",
                  "object to our use of your data where we rely on legitimate interests",
                ],
                [
                  "Portability",
                  "request a copy of your data in a portable format, where applicable",
                ],
                [
                  "Withdraw consent",
                  "where we rely on consent for any processing, withdraw it at any time",
                ],
              ].map(([right, detail]) => (
                <>
                  <strong className="text-ink">{right}:</strong> {detail}
                </>
              ))}
            />
            <P>
              To exercise any of these rights, contact us at{" "}
              <Tbc>[TBC — privacy email]</Tbc>. We will respond within one
              month, as required by law. If you&apos;re unhappy with how
              we&apos;ve handled your data, you also have the right to complain
              to the ICO at{" "}
              <a
                href="https://ico.org.uk"
                className="text-accent underline underline-offset-2 hover:text-ink"
              >
                ico.org.uk
              </a>{" "}
              or on 0303 123 1113.
            </P>
          </Section>

          <Section title="Other important information">
            <P>
              <strong className="text-ink">Children&apos;s data.</strong>{" "}
              Our services are aimed at adults seeking building and renovation
              work, and we do not knowingly collect personal data from children.
            </P>
            <P>
              <strong className="text-ink">
                International transfers.
              </strong>{" "}
              Our service providers (Supabase, Resend, Vercel, Cloudflare,
              ntfy.sh) may process data on servers outside the UK. Where this
              happens, we rely on their standard contractual clauses or
              equivalent safeguards recognised under UK GDPR, except where noted
              otherwise above (see ntfy.sh).
            </P>
            <P>
              <strong className="text-ink">
                Changes to this policy.
              </strong>{" "}
              We may update this policy from time to time, for example as our
              services change. We&apos;ll update the &quot;last updated&quot;
              date at the top of this page, and for significant changes
              we&apos;ll make this clear on our website.
            </P>
            <P>
              <strong className="text-ink">Contact us.</strong> For any
              question about this policy or how we handle your data:
            </P>
            <List
              items={[
                <>
                  Email: <Tbc>[TBC]</Tbc>
                </>,
                <>
                  Phone: <Tbc>[TBC]</Tbc>
                </>,
                <>
                  Post: <Tbc>[TBC — business address]</Tbc>
                </>,
              ]}
            />
          </Section>
        </div>
      </section>
    </>
  );
}
