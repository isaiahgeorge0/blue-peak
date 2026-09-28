import Link from "next/link";
import { headerCtaClassName } from "@/components/cta-styles";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/quote", label: "Estimate" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 h-[var(--site-header-height)] border-b border-off-white/10 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 font-serif text-base tracking-tight text-off-white transition-colors hover:text-baby-blue sm:text-lg"
        >
          Blue Peak Solutions
        </Link>
        <nav
          aria-label="Primary"
          className="flex min-w-0 items-center gap-x-3 overflow-x-auto whitespace-nowrap sm:gap-5"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 text-sm text-off-white/80 transition-colors hover:text-baby-blue"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:${sitePhoneTel}`}
            className="hidden shrink-0 text-sm text-off-white/80 transition-colors hover:text-baby-blue md:inline"
          >
            {sitePhoneDisplay}
          </a>
          <Link href="/contact" className={`${headerCtaClassName} shrink-0`}>
            Get a quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
