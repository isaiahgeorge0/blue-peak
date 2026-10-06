import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-logo";
import { ClosingBand } from "@/components/closing-band";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import {
  ArrowIcon,
  SectionHeading,
  sectionTitleClassName,
} from "@/components/section-heading";
import { serviceAreas } from "@/lib/content";
import { teamMembers } from "@/lib/site";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "About",
    description:
      "Meet the Ipswich building and renovation team behind Blue Peak. Every trade under one roof, a written quote before we start, and a founder running every job.",
    path: "/about",
  });
}

const differences = [
  {
    title: "Fixed written quotes",
    body: "We visit, measure up, and send a clear price before any work is booked. No vague estimates once we are on site.",
  },
  {
    title: "A founder on every job",
    body: "Kyle or Steven runs your job from first visit to final tidy, so you always know who is in charge and who to call.",
  },
  {
    title: "Based in Ipswich",
    body: "Based in Ipswich and covering Felixstowe, Woodbridge, Colchester, and nearby towns. Short travel means we can stay on the job.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="One brand. Every skill. One place."
        lede="Blue Peak is a building and renovation team covering Ipswich and the surrounding Suffolk area. Every trade under one roof, with a written quote before we start, and Kyle or Steven running every job."
      />

      <section className="bg-page">
        <Reveal className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-16 lg:py-28">
          <div>
            <h2 className={sectionTitleClassName}>Who we are</h2>
            <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink/80 lg:text-xl lg:leading-relaxed">
              We care about tidy sites, honest timescales, and finishes that
              hold up. Most of our work is for homeowners across Suffolk who
              want a clear written price before anything starts, and a team
              that does not disappear halfway through.
            </p>
          </div>
          <div className="@container w-full">
            <div className="pitch-top relative aspect-[4/3] w-full overflow-hidden bg-ink/10 max-lg:[--pitch-run:50cqw] lg:aspect-[3/4]">
              <Image
                src="/about/who-we-are.jpg"
                alt="A front room mid-job: brown protection paper taped over the floorboards, the armchair and sideboard under dust sheets, and folded dust sheets, a tool bag and a spirit level set down side by side"
                fill
                sizes="(max-width: 1023px) calc(100vw - 3rem), 420px"
                className="object-cover object-bottom"
              />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="theme-brand bg-page">
        <Reveal className="mx-auto max-w-6xl px-6 py-24 text-center lg:py-36">
          <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
            What we stand for
          </p>
          <h2 className="mt-6 text-5xl leading-tight tracking-tight text-ink md:text-6xl lg:text-7xl">
            <span className="block sm:inline">Simple.</span>{" "}
            <em className="block sm:inline">Trusted.</em>{" "}
            <span className="block sm:inline">Different.</span>
          </h2>
        </Reveal>
      </section>

      <section className="bg-page">
        <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <h2 className={sectionTitleClassName}>How we&apos;re different</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:mt-16 lg:gap-12">
            {differences.map((point, index) => (
              <li key={point.title} className="border-t border-ink/15 pt-6">
                <p className="text-sm font-medium tracking-[0.2em] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-2xl leading-tight text-ink">
                  {point.title}
                </h3>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-ink/70">
                  {point.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className="bg-panel">
        <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <SectionHeading eyebrow="Who you'll deal with">
            Led by Kyle and Steven.
          </SectionHeading>
          <ul className="mt-12 grid max-w-4xl gap-12 sm:grid-cols-2 sm:gap-8 lg:mt-16 lg:gap-12">
            {teamMembers.map((member) => (
              <li key={member.name}>
                {/* Placeholder until real headshots are supplied. */}
                <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-page">
                  <BrandMark title="" className="h-14 w-auto text-brand/15" />
                </div>
                <h3 className="mt-5 text-2xl text-ink">{member.name}</h3>
                <p className="mt-1 text-sm tracking-wide text-accent">
                  {member.role}
                </p>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-ink/70">
                  {member.blurb}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section id="areas" className="bg-page">
        <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <SectionHeading eyebrow="Areas">
            Ipswich and the towns around it.
          </SectionHeading>
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:mt-16 lg:grid-cols-4 lg:gap-8">
            {serviceAreas.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/areas/${area.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-ink/10 p-5 transition-colors duration-200 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:p-6"
                >
                  <h3 className="text-2xl leading-tight text-ink transition-colors duration-200 group-hover:text-accent">
                    {area.name}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-ink/70">
                    {area.shortDescription}
                  </p>
                  <span className="mt-auto pt-6 text-accent">
                    <ArrowIcon />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <ClosingBand />
    </>
  );
}
