"use client";

import { LayoutDashboard, Users, User } from "lucide-react";
import BottomTabBar from "@/components/shared/BottomTabBar";

export default function CoachBottomTabs() {
  return (
    <BottomTabBar
      portalId="coach"
      variant="dark"
      tabs={[
        { label: "Home", href: "/maarova/coach/dashboard", icon: LayoutDashboard },
        { label: "Clients", href: "/maarova/coach/clients", icon: Users },
        { label: "Profile", href: "/maarova/coach/profile", icon: User },
      ]}
    />
  );
}
