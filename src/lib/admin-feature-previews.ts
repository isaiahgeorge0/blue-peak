import { roadmapFeatures } from "@/lib/roadmap";

export const developerContactHref =
  "mailto:isaiah120303@gmail.com?subject=Blue%20Peak%20Admin%20-%20unlock%20feature";

function roadmapWhy(slug: string) {
  const feature = roadmapFeatures.find((item) => item.slug === slug);
  if (!feature) {
    return "";
  }
  return feature.whyItMatters.join(" ");
}

export type AdminFeaturePreviewId =
  | "subcontractors"
  | "quotes"
  | "referrals"
  | "seo";

export type AdminFeaturePreviewConfig = {
  id: AdminFeaturePreviewId;
  href: string;
  navLabel: string;
  title: string;
  eyebrow: string;
  whyItMatters: string;
};

export const adminFeaturePreviews: AdminFeaturePreviewConfig[] = [
  {
    id: "subcontractors",
    href: "/admin/subcontractors",
    navLabel: "Subcontractors",
    title: "Subcontractor CRM",
    eyebrow: "Locked preview",
    whyItMatters: roadmapWhy("subcontractor-crm"),
  },
  {
    id: "quotes",
    href: "/admin/quotes",
    navLabel: "Quotes & Invoices",
    title: "Quote & Invoice Generator + Tracker",
    eyebrow: "Locked preview",
    whyItMatters: roadmapWhy("quote-invoice"),
  },
  {
    id: "referrals",
    href: "/admin/referrals",
    navLabel: "Referrals",
    title: "Automated Referral System",
    eyebrow: "Locked preview",
    whyItMatters: roadmapWhy("referrals"),
  },
  {
    id: "seo",
    href: "/admin/seo",
    navLabel: "SEO & Visibility",
    title: "Local SEO & Search Growth",
    eyebrow: "Locked preview",
    whyItMatters: roadmapWhy("local-seo"),
  },
];

export function getAdminFeaturePreview(id: AdminFeaturePreviewId) {
  const feature = adminFeaturePreviews.find((item) => item.id === id);
  if (!feature) {
    throw new Error(`Unknown admin feature preview: ${id}`);
  }
  return feature;
}
