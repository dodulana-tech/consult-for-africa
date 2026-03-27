"use client";

import {
  LayoutDashboard,
  Briefcase,
  FileCheck,
  Clock,
  Menu,
} from "lucide-react";
import BottomTabBar from "@/components/shared/BottomTabBar";
import { useNavStore } from "@/lib/stores/navigation";

export default function PlatformBottomTabs() {
  const openDrawer = useNavStore((s) => s.openDrawer);

  return (
    <BottomTabBar
      portalId="platform"
      tabs={[
        { label: "Home", href: "/dashboard", icon: LayoutDashboard },
        { label: "Projects", href: "/projects", icon: Briefcase },
        { label: "Tasks", href: "/deliverables", icon: FileCheck },
        { label: "Time", href: "/timesheets", icon: Clock },
        { label: "More", href: "#", icon: Menu, action: openDrawer },
      ]}
    />
  );
}
