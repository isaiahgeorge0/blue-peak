import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ScrollDistance } from "@/components/scroll-distance";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="theme-brand bg-page">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-[auto_1fr_1fr_1fr] sm:gap-12">
        <BrandLogo className="h-28 w-auto text-white" />
        <div>
          <p className="font-serif text-xl text-ink italic">
            Everything under one roof.
          </p>
          <p className="mt-3 text-sm text-ink/75">
            Building and renovation team covering Ipswich and Suffolk, with a
            written quote before we start.
          </p>
        </div>
        <div>
          <h2 className="font-sans text-sm font-bold tracking-wide text-accent uppercase">
            Contact
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/80 pointer-coarse:space-y-6">
            <li>
              <Link
                href="/contact#quote-form"
                className="link-draw tap-target transition-colors hover:text-accent"
              >
                Send us a message
              </Link>
            </li>
            <li>
              <a
                href={`tel:${sitePhoneTel}`}
                className="link-draw tap-target transition-colors hover:text-accent"
              >
                {sitePhoneDisplay}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-sm font-bold tracking-wide text-accent uppercase">
            Service area
          </h2>
          <p className="mt-3 text-sm text-ink/80">
            Ipswich and the surrounding Suffolk area.
          </p>
          {/* At launch, add the registered company name and number here. */}
          <p className="mt-6 text-sm text-ink/70">
            © 2026 Blue Peak. All rights reserved.
          </p>
        </div>
      </div>
      <div className="mx-auto -mt-4 box-content h-[5.75rem] max-w-6xl px-6 pb-10 sm:h-[4.5rem] lg:h-[3.25rem] [@media(scripting:none)]:hidden">
        <ScrollDistance />
      </div>
    </footer>
  );
}
