import {
  developerContactHref,
  type AdminFeaturePreviewConfig,
} from "@/lib/admin-feature-previews";
import { AdminFeatureMock } from "@/components/admin-feature-mocks";

type AdminFeaturePreviewProps = {
  feature: AdminFeaturePreviewConfig;
};

export function AdminFeaturePreview({ feature }: AdminFeaturePreviewProps) {
  return (
    <div className="relative min-h-[36rem] overflow-hidden rounded-lg border border-ink/10 bg-page sm:min-h-[42rem]">
      {/* Decorative locked UI only. Figures are sample data, not live. */}
      <div
        className="pointer-events-none select-none px-4 py-6 opacity-55 blur-[2.5px] sm:px-6 sm:py-8 sm:opacity-60 sm:blur-[3px]"
        aria-hidden="true"
      >
        <div className="mb-6">
          <p className="text-sm tracking-wide text-accent uppercase">
            {feature.navLabel}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-ink">
            {feature.title}
          </h2>
        </div>
        <AdminFeatureMock id={feature.id} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-panel/55 p-4 backdrop-blur-[1.5px] sm:p-8">
        <div className="w-full max-w-md rounded-lg border border-ink/15 bg-panel/90 px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:px-8 sm:py-8">
          <p className="text-xs font-medium tracking-wide text-accent uppercase">
            {feature.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-2xl tracking-tight text-ink sm:text-3xl">
            {feature.title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/70">
            {feature.whyItMatters}
          </p>
          <a
            href={developerContactHref}
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-center text-sm font-medium text-on-accent transition-[transform,opacity] duration-200 hover:scale-[1.02] hover:opacity-90 sm:w-auto"
          >
            Contact developer to get started
          </a>
        </div>
      </div>
    </div>
  );
}
