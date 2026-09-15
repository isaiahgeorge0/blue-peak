import Link from "next/link";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-off-white/10 bg-black">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg text-off-white">Blue Peak Solutions</p>
          <p className="mt-3 text-sm text-off-white/70">
            Two-person building and renovation team. Clear quotes, tidy sites,
            work that holds up.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium tracking-wide text-baby-blue uppercase">
            Contact
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-off-white/80">
            <li>
              <a href="mailto:hello@bluepeaksolutions.com">
                hello@bluepeaksolutions.com
              </a>
            </li>
            <li>
              <a href={`tel:${sitePhoneTel}`}>{sitePhoneDisplay}</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-medium tracking-wide text-baby-blue uppercase">
            Service area
          </h2>
          <p className="mt-3 text-sm text-off-white/80">
            Ipswich and the surrounding Suffolk area.
          </p>
          <p className="mt-6 text-sm text-off-white/80">
            <Link
              href="/roadmap"
              className="transition-colors hover:text-baby-blue"
            >
              Roadmap
            </Link>
            <span className="text-off-white/40"> · </span>
            <span className="text-off-white/50">What we&apos;re building next</span>
          </p>
          <p className="mt-6 text-sm text-off-white/50">
            © 2026 Blue Peak Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
