export type AddonId = "subcontractors" | "quotes" | "referrals" | "seo";

export type Addon = {
  id: AddonId;
  href: string;
  name: string;
  /** One paragraph: what it does. */
  summary: string;
  benefits: [string, string, string];
};

/** Agreed future features, shown in the admin so they are not forgotten. */
export const addons: Addon[] = [
  {
    id: "subcontractors",
    href: "/admin/subcontractors",
    name: "Subcontractors",
    summary:
      "A private record of the trades you work with: what they do, where they cover, how past jobs went and when they're next free. When a job needs an electrician or a plasterer, you can see who to call.",
    benefits: [
      "Contact details, trades and areas in one place.",
      "Notes and ratings from past jobs.",
      "See who's already booked before you pick up the phone.",
    ],
  },
  {
    id: "quotes",
    href: "/admin/quotes",
    name: "Quotes & Invoices",
    summary:
      "Build a quote from a lead's details and your own price lines, send it in a consistent Blue Peak format, and turn it into an invoice once it's accepted. Each one shows whether it's been sent, accepted or paid.",
    benefits: [
      "Quotes that look the same every time.",
      "Accepted quotes become invoices without retyping.",
      "One list of what's outstanding and what's paid.",
    ],
  },
  {
    id: "referrals",
    href: "/admin/referrals",
    name: "Referrals",
    summary:
      "When a job is finished, the customer gets a friendly message asking whether they know anyone planning work, with a simple reward if a referral becomes a job. Referred enquiries arrive in Leads, labelled with who sent them.",
    benefits: [
      "The ask goes out at the right moment, without anyone remembering to send it.",
      "Every referral is traced back to the customer who made it.",
      "Rewards are recorded, so nobody is missed.",
    ],
  },
  {
    id: "seo",
    href: "/admin/seo",
    name: "SEO & Visibility",
    summary:
      "Pages for each service in each town you cover, such as kitchen renovations in Ipswich, plus focused landing pages for paid ads. Each one leads to the estimator or the contact form.",
    benefits: [
      "More pages that match what local people search for.",
      "Ad pages built around one service in one area.",
      "See which pages bring in enquiries.",
    ],
  },
];

export function getAddon(id: AddonId) {
  const addon = addons.find((item) => item.id === id);
  if (!addon) throw new Error(`Unknown add-on: ${id}`);
  return addon;
}

/** mailto: for "Ask about adding this", or null when ADDON_CONTACT_EMAIL is unset (the button is then hidden). */
export function addonContactHref(addon: Addon) {
  const email = process.env.ADDON_CONTACT_EMAIL?.trim();
  if (!email) return null;
  const subject = encodeURIComponent(`Blue Peak admin: adding ${addon.name}`);
  return `mailto:${email}?subject=${subject}`;
}
