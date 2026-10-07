import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Skip link, site header, main landmark, footer and page transitions around a
 * public page. data-menu-inert marks what the open menu makes inert.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        data-menu-inert
        className="sr-only rounded-full bg-accent text-sm font-bold text-on-accent focus:not-sr-only focus:fixed focus:px-5 focus:py-3 focus:top-3 focus:left-3 focus:z-[60] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        data-menu-inert
        className="w-full flex-1 outline-none"
      >
        {children}
      </main>
      <SiteFooter />
      <PageTransition />
    </>
  );
}
