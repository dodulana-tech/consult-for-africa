"use client";

import { LayoutDashboard, Briefcase, FileText, BookOpen } from "lucide-react";
import BottomTabBar from "@/components/shared/BottomTabBar";

export default function ClientBottomTabs() {
  return (
    <BottomTabBar
      portalId="client"
      tabs={[
        { label: "Home", href: "/client/dashboard", icon: LayoutDashboard },
        { label: "Projects", href: "/client/projects", icon: Briefcase },
        { label: "Invoices", href: "/client/invoices", icon: FileText },
        { label: "Knowledge", href: "/client/knowledge", icon: BookOpen },
      ]}
    />
  );
}
