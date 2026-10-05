import { BrandLogo } from "@/components/brand/brand-logo";

/**
 * Runs in <head> before first paint. Sets html[data-intro="play"] on the first
 * homepage load of a session (motion allowed), which switches on the intro
 * keyframes in globals.css, then flips to "done" when the hero card has risen in
 * so a later client-side visit to / does not replay it. Every other case gets no
 * attribute and therefore no intro and no scroll lock.
 */
const homeIntroScript = `(function(){try{var d=document.documentElement,k="bp-intro-seen";if(location.pathname!=="/"||matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1");d.setAttribute("data-intro","play");var done=function(){d.setAttribute("data-intro","done")};document.addEventListener("animationend",function h(e){if(e.target&&e.target.classList&&e.target.classList.contains("home-hero-card")){document.removeEventListener("animationend",h);done()}});setTimeout(done,4000)}catch(e){}})();`;

export function HomeIntroScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: homeIntroScript }}
    />
  );
}

/** Logo layer for the first-visit intro. Hidden unless html[data-intro="play"]. */
export function HomeIntro() {
  return (
    <div
      className="home-intro pointer-events-none fixed inset-0 z-[60] place-items-center"
      aria-hidden
    >
      <BrandLogo title="" className="h-auto w-[120px] text-brand lg:w-[160px]" />
    </div>
  );
}
