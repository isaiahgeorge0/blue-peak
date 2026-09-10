export type RoadmapFeature = {
  slug: string;
  name: string;
  label: string;
  summary: string;
  detail: string[];
};

export const roadmapFeatures: RoadmapFeature[] = [
  {
    slug: "subcontractor-crm",
    name: "Subcontractor CRM",
    label: "Coming soon",
    summary:
      "A private place to see who is free, who you trust, and who you have worked with before.",
    detail: [
      "When a job needs an electrician, plasterer, or tiler, you should not have to dig through old text threads to find out who is free this week.",
      "This dashboard keeps availability, ratings, and past job history in one place so the right person gets the call first time.",
    ],
  },
  {
    slug: "quote-invoice",
    name: "Quote & Invoice Generator + Tracker",
    label: "Coming soon",
    summary:
      "Turn a site visit into a branded quote in minutes, then stay on top of opens, accepts, and payment.",
    detail: [
      "Faster written quotes win more work. After a visit, you send a clear, branded price without rebuilding the same document from scratch every time.",
      "You can see whether a quote was opened or accepted, and unpaid invoices get chased automatically so payment does not slip through the cracks.",
    ],
  },
  {
    slug: "referrals",
    name: "Automated Referral System",
    label: "Coming soon",
    summary:
      "Ask happy clients for a referral, with a reward, without having to remember to do it yourself.",
    detail: [
      "Most of the best jobs already come from people who liked the last one. The hard part is asking at the right moment.",
      "This system follows up after a job lands well, offers a simple reward for a warm introduction, and turns word of mouth into something you can rely on.",
    ],
  },
];
