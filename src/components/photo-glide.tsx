import Image from "next/image";

/**
 * Full-width mid-build photo with a short caption over it. Static: the work
 * panels above it are the page's one scroll effect.
 */
export function PhotoGlide() {
  return (
    <section aria-labelledby="on-site-heading" className="bg-panel">
      <div className="relative h-[80svh] min-h-[32rem] overflow-hidden">
        <Image
          src="/work/mid-build.jpg"
          alt="Room part-way through renovation, with fresh plaster and a half-boarded stud wall"
          fill
          sizes="(max-aspect-ratio: 16/9) calc(80vh * 16 / 9), 100vw"
          className="object-cover"
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/85 via-black/45 to-transparent"
          aria-hidden
        />

        <div className="theme-photo absolute bottom-0 left-0 max-w-lg px-6 pt-16 pb-8 sm:px-10 sm:pb-12 lg:px-14 lg:pb-14">
          <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
            While we&apos;re on site
          </p>
          <h2
            id="on-site-heading"
            className="mt-3 text-3xl leading-display tracking-heading text-ink sm:text-4xl lg:text-5xl lg:tracking-display"
          >
            Stripped back, <em className="text-accent italic">built</em>{" "}
            properly.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink/80 sm:text-lg">
            You get photos, not surprises.
          </p>
        </div>
      </div>
    </section>
  );
}
