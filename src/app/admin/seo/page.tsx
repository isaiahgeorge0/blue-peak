import type { Metadata } from "next";
import { AdminFeaturePreview } from "@/components/admin-feature-preview";
import { getAdminFeaturePreview } from "@/lib/admin-feature-previews";

const feature = getAdminFeaturePreview("seo");

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: feature.navLabel,
    robots: { index: false, follow: false },
  };
}

export default function AdminSeoPage() {
  return <AdminFeaturePreview feature={feature} />;
}
