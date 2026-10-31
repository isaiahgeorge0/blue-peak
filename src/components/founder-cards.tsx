import { BrandMark } from "@/components/brand/brand-logo";
import { teamMembers } from "@/lib/site";

/** Kyle as a Cortex Blue panel: stacked on phones; text left, mark right from lg. */
export function FounderCards({ className = "" }: { className?: string }) {
  const member = teamMembers[0];
  if (!member) return null;

  return (
    <div className={`max-w-4xl lg:max-w-none ${className}`}>
      <div className="founder-card theme-brand group relative isolate overflow-hidden rounded-xl bg-page transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none lg:grid lg:min-h-[18rem] lg:grid-cols-2 lg:items-stretch">
        {/* Phones keep the aspect spacer so the stacked card has height. */}
        <div aria-hidden className="aspect-[4/3] lg:hidden" />

        <div className="absolute inset-0 flex min-w-0 flex-col justify-end p-6 sm:p-8 lg:relative lg:col-start-1 lg:row-start-1 lg:inset-auto lg:justify-end lg:p-10 lg:pr-8">
          <h3 className="font-serif text-[2.5rem] leading-none tracking-display text-ink">
            {member.name}
          </h3>
          <p className="mt-3 text-xs font-bold tracking-[0.2em] text-ink uppercase">
            {member.role}
          </p>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-ink lg:max-w-lg">
            {member.blurb}
          </p>
        </div>

        {/*
          When Kyle's headshot arrives: replace the BrandMark below with a
          fill Image (object-cover) in this right column. No gradient needed —
          the text sits in the left column, not on the photo. On phones the
          mark stays a faint corner watermark behind the text as now.
        */}
        <div className="pointer-events-none absolute top-6 right-6 sm:top-8 sm:right-8 lg:relative lg:col-start-2 lg:row-start-1 lg:inset-auto lg:min-h-0">
          <BrandMark
            tone="current"
            title=""
            className="founder-mark h-32 w-auto text-white/10 transition-transform duration-500 ease-out group-hover:translate-x-2 group-hover:-translate-y-2 sm:h-40 lg:absolute lg:top-1/2 lg:left-1/2 lg:h-[70%] lg:w-auto lg:max-h-full lg:-translate-x-1/2 lg:-translate-y-1/2 lg:text-white/15 lg:group-hover:translate-x-[calc(-50%+0.5rem)] lg:group-hover:translate-y-[calc(-50%-0.5rem)] motion-reduce:transition-none"
          />
        </div>
      </div>
    </div>
  );
}
