"use client";

import { LayoutDashboard, FileText, Plus } from "lucide-react";
import BottomTabBar from "@/components/shared/BottomTabBar";

export default function PartnerBottomTabs() {
  return (
    <BottomTabBar
      portalId="partner"
      tabs={[
        { label: "Home", href: "/partner/dashboard", icon: LayoutDashboard },
        { label: "Requests", href: "/partner/requests", icon: FileText },
        { label: "New", href: "/partner/requests/new", icon: Plus },
      ]}
    />
  );
}
