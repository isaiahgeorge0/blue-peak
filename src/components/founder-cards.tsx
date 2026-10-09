import { BrandMark } from "@/components/brand/brand-logo";
import { teamMembers } from "@/lib/site";

/** Kyle and Steven as Blue Solution panels, two up from sm. */
export function FounderCards({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid max-w-4xl gap-6 sm:grid-cols-2 sm:gap-8 lg:max-w-none ${className}`}>
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
  );
}
