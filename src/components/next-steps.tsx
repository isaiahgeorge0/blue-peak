import { howWeWorkSteps } from "@/lib/site";

/** The first three stages of a job as a short timeline: numbered dots on a line. */
export function NextSteps({ className = "" }: { className?: string }) {
  const steps = howWeWorkSteps.slice(0, 3);
  return (
    <div className={className}>
      <h2 className="font-sans text-xs font-bold tracking-[0.2em] text-accent uppercase">
        What happens next
      </h2>
      <ol className="mt-6">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 pb-7 last:pb-0"
          >
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-9 bottom-1 left-4 w-px -translate-x-1/2 bg-ink/20"
              />
            ) : null}
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent tabular-nums"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="text-lg leading-8 font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-1 text-base leading-relaxed text-ink/70">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
