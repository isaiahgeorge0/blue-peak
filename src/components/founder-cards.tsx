import { BrandMark } from "@/components/brand/brand-logo";
import { teamMembers } from "@/lib/site";

/** Kyle as a Cortex Blue panel: one wide card, text left and mark right from lg. */
export function FounderCards({ className = "" }: { className?: string }) {
  const member = teamMembers[0];
  if (!member) return null;

  return (
    <div className={`max-w-4xl lg:max-w-none ${className}`}>
      <div className="founder-card theme-brand group relative isolate grid grid-cols-1 overflow-hidden rounded-xl bg-page transition-transform duration-300 ease-out before:col-start-1 before:row-start-1 before:aspect-[4/3] hover:-translate-y-1 lg:before:col-span-2 lg:grid-cols-2 lg:before:aspect-auto lg:before:min-h-[22rem] motion-reduce:transition-none">
        {/* Headshot goes here, under the text: a fill Image with
            className "-z-10 object-cover", then a navy gradient from
            the bottom so the white type keeps its contrast.
            The before: spacer sets the card's shape and the text shares
            its grid cell, so a card only grows past it when the text
            needs the room. When Kyle's portrait arrives, restore the
            phone portrait by changing before:aspect-[4/3] to
            before:aspect-[4/5], and keep the wide lg layout. */}
        <BrandMark
          tone="current"
          title=""
          className="founder-mark pointer-events-none absolute top-6 right-6 -z-10 h-32 w-auto text-white/10 transition-transform duration-500 ease-out group-hover:translate-x-2 group-hover:-translate-y-2 sm:top-8 sm:right-8 sm:h-40 lg:top-1/2 lg:right-[8%] lg:h-56 lg:-translate-y-1/2 lg:group-hover:translate-x-3 lg:group-hover:-translate-y-[calc(50%-0.5rem)] motion-reduce:transition-none"
        />
        <div className="col-start-1 row-start-1 flex min-w-0 flex-col justify-end p-6 sm:p-8 lg:col-span-1 lg:justify-center lg:p-10 lg:pr-6">
          <h3 className="font-serif text-[2.5rem] leading-none tracking-display text-ink">
            {member.name}
          </h3>
          <p className="mt-3 text-xs font-bold tracking-[0.2em] text-ink uppercase">
            {member.role}
          </p>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-ink">
            {member.blurb}
          </p>
        </div>
      </div>
    </div>
  );
}
