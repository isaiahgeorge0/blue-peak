import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
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
          <h2 className="text-sm font-medium tracking-wide text-accent uppercase">
            Contact
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            <li>
              <Link
                href="/contact#quote-form"
                className="transition-colors hover:text-accent"
              >
                Send us a message
              </Link>
            </li>
            <li>
              <a href={`tel:${sitePhoneTel}`}>{sitePhoneDisplay}</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-medium tracking-wide text-accent uppercase">
            Service area
          </h2>
          <p className="mt-3 text-sm text-ink/80">
            Ipswich and the surrounding Suffolk area.
          </p>
          <p className="mt-6 text-sm text-ink/80">
            <Link
              href="/roadmap"
              className="transition-colors hover:text-accent"
            >
              Roadmap
            </Link>
            <span className="text-ink/40"> · </span>
            <span className="text-ink/70">What we&apos;re building next</span>
          </p>
          <p className="mt-6 text-sm text-ink/70">
            © 2026 Blue Peak Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
