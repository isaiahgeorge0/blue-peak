import Link from "next/link";

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
          className="font-serif text-lg tracking-tight text-off-white"
        >
          Blue Peak Solutions
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-off-white/80 transition-colors hover:text-baby-blue"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="rounded-full bg-baby-blue px-5 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Get a quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
