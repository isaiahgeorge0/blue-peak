import type { Metadata } from "next";
import { AdminFeaturePreview } from "@/components/admin-feature-preview";
import { requireAdminPage } from "@/lib/admin-auth";
import { getAddon } from "@/lib/admin-addons";

const addon = getAddon("subcontractors");

export const metadata: Metadata = {
  title: addon.name,
};

export default async function AdminSubcontractorsPage() {
  // Also keeps the page dynamic, so ADDON_CONTACT_EMAIL is read at request time.
  await requireAdminPage();
  return <AdminFeaturePreview addon={addon} />;
}
