"use client";

import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  Target,
  User,
  Menu,
} from "lucide-react";
import BottomTabBar from "@/components/shared/BottomTabBar";
import { useNavStore } from "@/lib/stores/navigation";

export default function MaarovaBottomTabs({
  hasManagerAccess,
  hasHRAccess,
}: {
  hasManagerAccess: boolean;
  hasHRAccess: boolean;
}) {
  const openDrawer = useNavStore((s) => s.openDrawer);

  // If user has extra nav items (manager/HR), show "More" as 5th tab
  const hasExtraNav = hasManagerAccess || hasHRAccess;

  const tabs = hasExtraNav
    ? [
        { label: "Home", href: "/maarova/portal/dashboard", icon: LayoutDashboard },
        { label: "Assess", href: "/maarova/portal/assessment", icon: ClipboardCheck },
        { label: "Results", href: "/maarova/portal/results", icon: BarChart3 },
        { label: "Develop", href: "/maarova/portal/development", icon: Target },
        { label: "More", href: "#", icon: Menu, action: openDrawer },
      ]
    : [
        { label: "Home", href: "/maarova/portal/dashboard", icon: LayoutDashboard },
        { label: "Assess", href: "/maarova/portal/assessment", icon: ClipboardCheck },
        { label: "Results", href: "/maarova/portal/results", icon: BarChart3 },
        { label: "Develop", href: "/maarova/portal/development", icon: Target },
        { label: "Profile", href: "/maarova/portal/profile", icon: User },
      ];

  return <BottomTabBar tabs={tabs} variant="dark" portalId="maarova" />;
}
