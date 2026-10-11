import type { ComponentType } from "react";
import {
  CalendarIcon,
  DashboardIcon,
  LeadsIcon,
  QuotesIcon,
  ReferralsIcon,
  SeoIcon,
  SubcontractorsIcon,
} from "@/components/admin/icons";
import { addons, type AddonId } from "@/lib/admin-addons";

type IconComponent = ComponentType<{ className?: string }>;

export type NavItem = {
  href: string;
  label: string;
  Icon: IconComponent;
  match: (path: string) => boolean;
};

export const primaryNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: DashboardIcon, match: (path) => path === "/admin" },
  { href: "/admin/leads", label: "Leads", Icon: LeadsIcon, match: (path) => path.startsWith("/admin/leads") },
  { href: "/admin/calendar", label: "Calendar", Icon: CalendarIcon, match: (path) => path.startsWith("/admin/calendar") },
];

export const addonNavIcons: Record<AddonId, IconComponent> = {
  subcontractors: SubcontractorsIcon,
  quotes: QuotesIcon,
  referrals: ReferralsIcon,
  seo: SeoIcon,
};

export const addonNav: NavItem[] = addons.map((addon) => ({
  href: addon.href,
  label: addon.name,
  Icon: addonNavIcons[addon.id],
  match: (path) => path.startsWith(addon.href),
}));

/** The title shown in the phone top bar. */
export function pageTitleFor(path: string) {
  if (/^\/admin\/leads\/[^/]+/.test(path)) return "Lead";
  return [...primaryNav, ...addonNav].find((item) => item.match(path))?.label ?? "Admin";
}
