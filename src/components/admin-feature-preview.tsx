import { AddonPreview } from "@/components/admin/addon-previews";
import { addonNavIcons } from "@/components/admin/nav-items";
import { MailIcon } from "@/components/admin/icons";
import { Card, PageHeader, primaryButton } from "@/components/admin/ui";
import { addonContactHref, type Addon } from "@/lib/admin-addons";

/** An add-on's page: what it does, three benefits, a labelled preview and a way to ask about it. */
export function AdminFeaturePreview({ addon }: { addon: Addon }) {
  const contactHref = addonContactHref(addon);
  const Icon = addonNavIcons[addon.id];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
      <div>
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <Icon className="size-4" />
              Add-on
            </span>
          }
          title={addon.name}
        />
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/90">{addon.summary}</p>
        <ul className="mt-6 space-y-3">
          {addon.benefits.map((benefit) => (
            <li key={benefit} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink/90">
              <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-ridge-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m4.5 10.5 3.5 3.5 7.5-8" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
        {contactHref ? (
          <a href={contactHref} className={`${primaryButton} mt-8`}>
            <MailIcon className="size-4" />
            Ask about adding this
          </a>
        ) : null}
      </div>

      <Card className="relative self-start p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="admin-label">{addon.name}</p>
          <span className="rounded-full bg-frost px-2.5 py-1 text-xs font-bold text-navy">Preview</span>
        </div>
        <div aria-label={`Illustrative preview of ${addon.name}, with sample data`} role="img">
          <AddonPreview id={addon.id} />
        </div>
        <p className="mt-4 text-xs text-ink/80">Sample names and figures, for illustration.</p>
      </Card>
    </div>
  );
}
