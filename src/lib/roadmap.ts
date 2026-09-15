export type RoadmapFeature = {
  slug: string;
  name: string;
  label: string;
  summary: string;
  whyItMatters: string[];
};

export const roadmapFeatures: RoadmapFeature[] = [
  {
    slug: "subcontractor-crm",
    name: "Subcontractor CRM",
    label: "Coming soon",
    summary:
      "A private place to see who is free, who you trust, and who you have worked with before.",
    whyItMatters: [
      "Without a clear picture of availability, it is easy to call the same person twice, miss the one who is free this week, or double-book someone who is already on another site.",
      "That costs time on the phone, delays start dates, and leaves homeowners waiting while you dig through old text threads.",
      "A proper subcontractor record means ratings, past jobs, and who is free are in one place, so the right person gets the call first time.",
    ],
  },
  {
    slug: "quote-invoice",
    name: "Quote & Invoice Generator + Tracker",
    label: "Coming soon",
    summary:
      "Turn a site visit into a branded quote in minutes, then stay on top of opens, accepts, and payment.",
    whyItMatters: [
      "Slow quotes lose jobs. Homeowners often compare two or three prices, and the firm that sends a clear written quote first is the one they take seriously.",
      "Rebuilding the same document by hand after every visit wastes hours, and unpaid invoices that sit in an inbox quietly hurt cash flow.",
      "Faster branded quotes win more work, and automatic chasing means accepted jobs and outstanding payments do not fall through the cracks.",
    ],
  },
  {
    slug: "referrals",
    name: "Automated Referral System",
    label: "Coming soon",
    summary:
      "Ask happy clients for a referral, with a reward, without having to remember to do it yourself.",
    whyItMatters: [
      "Most of the best jobs already come from people who liked the last one, but relying on word of mouth alone is inconsistent. Busy weeks mean the ask never happens.",
      "When nobody follows up at the right moment, warm introductions dry up and you fall back on colder leads that take longer to close.",
      "An automated nudge after a job lands well, with a simple reward for a warm introduction, turns referrals into something systematic rather than something you hope for.",
    ],
  },
  {
    slug: "local-seo",
    name: "Local SEO & Search Growth",
    label: "Ongoing",
    summary:
      "Ongoing management of Google Business Profile, reviews, citations, and local search visibility so Blue Peak ranks for the services and areas we actually cover.",
    whyItMatters: [
      "Local search ranking is driven mostly by an active, complete Google Business Profile and a steady flow of recent reviews, not just having a website.",
      "Most local competitors neglect this. Categories drift, photos go stale, and review requests stop the moment a job is finished.",
      "Keeping this current is ongoing work, not a one-time setup. Done properly, it is a genuine advantage for anyone searching Ipswich and Suffolk for kitchens, bathrooms, extensions, and refurbs.",
    ],
  },
];
