import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-logo";
import { FooterWordmark } from "@/components/footer-wordmark";
import { ScrollDistance } from "@/components/scroll-distance";
import { serviceAreas, services } from "@/lib/content";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

const pageLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/quote", label: "Estimate" },
  { href: "/contact", label: "Contact" },
];

const columns = [
  { title: "Pages", links: pageLinks },
  {
    title: "Services",
    links: services.map(({ slug, name }) => ({ href: `/services/${slug}`, label: name })),
  },
  {
    title: "Areas",
    links: serviceAreas.map(({ slug, name }) => ({ href: `/areas/${slug}`, label: name })),
  },
];

const headingClassName = "font-sans text-xs font-bold tracking-[0.2em] text-accent uppercase";

const listClassName = "mt-5 space-y-3 pointer-coarse:space-y-5";

const linkClassName =
  "link-draw tap-target rounded-sm text-base text-ink/80 transition-colors duration-200 hover:text-ink focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

/**
 * The foot of every public page: the closing line, the site's pages,
 * services, areas and contact details, the copyright line, the name set
 * large, and the tape measure, which keeps the very bottom.
 */
export function SiteFooter() {
  return (
    <footer data-menu-inert className="theme-brand bg-page">
      <div className="mx-auto max-w-6xl px-6 pt-20 lg:pt-28">
        <p className="font-serif text-[clamp(2.5rem,1.757rem+3.048vw,4.5rem)] leading-[1.02] tracking-display text-ink">
          Everything under <em>one roof.</em>
        </p>

        <nav
          aria-label="Footer"
          className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 border-t border-ink/15 pt-12 min-[22.5rem]:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:pt-14"
        >
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className={headingClassName}>{column.title}</h2>
              <ul className={listClassName}>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClassName}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className={headingClassName}>Contact</h2>
            <ul className={listClassName}>
              <li>
                <a href={`tel:${sitePhoneTel}`} className={linkClassName}>
                  <span className="sr-only">Call </span>
                  {sitePhoneDisplay}
                </a>
              </li>
              <li>
                <Link href="/contact#quote-form" className={linkClassName}>
                  Send us a message
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="mt-16 lg:mt-24">
          <FooterWordmark />
        </div>

        <div className="mt-8 flex items-center justify-between gap-6 border-t border-ink/15 pt-6 lg:mt-10">
          {/* At launch, add the registered company name and number here. */}
          <p className="text-sm text-ink/70">© 2026 Blue Peak</p>
          <BrandMark title="" className="h-7 w-auto text-ink/70" />
        </div>
      </div>
      <div className="mx-auto mt-8 box-content h-[7rem] max-w-[calc(var(--container-6xl)-3rem)] px-6 pb-10 min-[22.5rem]:h-[5.75rem] sm:h-[4.5rem] lg:h-[3.25rem] [@media(scripting:none)]:hidden">
        <ScrollDistance />
      </div>
    </footer>
  );
}
