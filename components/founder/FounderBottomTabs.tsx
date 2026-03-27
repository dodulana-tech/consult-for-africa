"use client";

import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Sparkles,
  Menu,
} from "lucide-react";
import BottomTabBar from "@/components/shared/BottomTabBar";
import { useNavStore } from "@/lib/stores/navigation";

export default function FounderBottomTabs() {
  const openDrawer = useNavStore((s) => s.openDrawer);

  return (
    <BottomTabBar
      portalId="founder"
      variant="dark"
      tabs={[
        { label: "Home", href: "/founder/dashboard", icon: LayoutDashboard },
        { label: "Execution", href: "/founder/tasks", icon: CheckSquare },
        { label: "Metrics", href: "/founder/metrics", icon: BarChart3 },
        { label: "Nuru", href: "/founder/ai-coach", icon: Sparkles },
        { label: "More", href: "#", icon: Menu, action: openDrawer },
      ]}
    />
  );
}
