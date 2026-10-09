import type { Metadata } from "next";
import { AreaMap } from "@/components/area-map";
import { BrandMark } from "@/components/brand/brand-logo";
import { ClosingBand } from "@/components/closing-band";
import { Reveal } from "@/components/reveal";
import { ScrollFillText } from "@/components/scroll-fill-text";
import {
  SectionHeading,
  sectionTitleClassName,
} from "@/components/section-heading";
import { SplitOpener } from "@/components/split-opener";
import { StatementBand } from "@/components/statement-band";
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
      <SplitOpener
        eyebrow="About"
        title="One brand. Every skill. One place."
        lede="Blue Peak is a building and renovation team covering Ipswich and the surrounding Suffolk area. Every trade under one roof, with a written quote before we start, and Kyle or Steven running every job."
        image={{
          src: "/about/who-we-are.jpg",
          alt: "A front room mid-job: brown protection paper taped over the floorboards, the armchair and sideboard under dust sheets, and folded dust sheets, a tool bag and a spirit level set down side by side",
          frameClassName: "pitch-top max-lg:[--pitch-run:50cqw] lg:[--pitch-run:40cqw]",
        }}
      />

      <section className="bg-page">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-36">
          <h2 className={sectionTitleClassName}>Who we are</h2>
          <ScrollFillText
            className="mt-8 max-w-[22em] font-serif text-[clamp(1.625rem,1.3rem+1.333vw,2.5rem)] leading-[1.25] tracking-heading lg:mt-12"
            text="We care about tidy sites, honest timescales, and finishes that hold up. Most of our work is for homeowners across Suffolk who want a clear written price before anything starts, and a team that does not disappear halfway through."
          />
        </div>
      </section>

      <StatementBand />

      <section className="bg-page">
        <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <h2 className={sectionTitleClassName}>How we&apos;re different</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:mt-16 lg:gap-12">
            {differences.map((point, index) => (
              <li key={point.title} className="border-t border-ink/15 pt-6">
                <p className="text-sm font-bold tracking-[0.2em] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-2xl leading-tight font-semibold text-ink">
                  {point.title}
                </h3>
                <p className="mt-3 max-w-sm text-lg leading-relaxed text-ink/70">
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
          <ul className="mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 sm:gap-8 lg:mt-16 lg:max-w-none">
            {teamMembers.map((member) => (
              <li
                key={member.name}
                className="founder-card theme-brand group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl bg-page p-6 transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none sm:p-8"
              >
                {/* Headshot goes here, under the text: a fill Image with
                    className "-z-10 object-cover", then a navy gradient from
                    the bottom so the white type keeps its contrast. */}
                <BrandMark
                  title=""
                  className="founder-mark pointer-events-none absolute top-6 right-6 -z-10 h-32 w-auto sm:top-8 sm:right-8 sm:h-40 text-white/10 transition-transform duration-500 ease-out group-hover:translate-x-2 group-hover:-translate-y-2 motion-reduce:transition-none"
                />
                <h3 className="font-serif text-[2.5rem] leading-none tracking-display text-ink">
                  {member.name}
                </h3>
                <p className="mt-3 text-xs font-bold tracking-[0.2em] text-ink/80 uppercase">
                  {member.role}
                </p>
                <p className="mt-4 max-w-sm text-lg leading-relaxed text-ink/85">
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
          <AreaMap
            areas={serviceAreas.map(({ slug, name, shortDescription }) => ({
              slug,
              name,
              shortDescription,
            }))}
          />
        </Reveal>
      </section>

      <ClosingBand />
    </>
  );
}
