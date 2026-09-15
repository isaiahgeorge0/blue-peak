import Link from "next/link";
import { headerCtaClassName } from "@/components/cta-styles";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-off-white/10 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="font-serif text-lg tracking-tight text-off-white transition-colors hover:text-baby-blue"
        >
          Blue Peak Solutions
        </Link>
        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-6"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-off-white/80 transition-colors hover:text-baby-blue"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:${sitePhoneTel}`}
            className="text-sm text-off-white/80 transition-colors hover:text-baby-blue"
          >
            {sitePhoneDisplay}
          </a>
          <Link href="/contact" className={headerCtaClassName}>
            Get a quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
