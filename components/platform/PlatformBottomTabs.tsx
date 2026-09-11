"use client";

import {
  LayoutDashboard,
  Briefcase,
  FileCheck,
  Clock,
  ListChecks,
  Video,
  Handshake,
  Menu,
} from "lucide-react";
import { useSession } from "next-auth/react";
import BottomTabBar from "@/components/shared/BottomTabBar";
import { useNavStore } from "@/lib/stores/navigation";
import { isOfficeRole } from "@/lib/constants";

export default function PlatformBottomTabs() {
  const openDrawer = useNavStore((s) => s.openDrawer);
  const { data: session } = useSession();

  // The Office of the Founding Partner has no dashboard, projects, deliverables
  // or timesheets, so the default tabs would be four dead ends on mobile.
  const tabs = isOfficeRole(session?.user?.role)
    ? [
        { label: "Desk", href: "/desk", icon: ListChecks },
        { label: "Chasing", href: "/commitments", icon: Handshake },
        { label: "Diary", href: "/meetings", icon: Video },
        { label: "More", href: "#", icon: Menu, action: openDrawer },
      ]
    : [
        { label: "Home", href: "/dashboard", icon: LayoutDashboard },
        { label: "Projects", href: "/projects", icon: Briefcase },
        { label: "Tasks", href: "/deliverables", icon: FileCheck },
        { label: "Time", href: "/timesheets", icon: Clock },
        { label: "More", href: "#", icon: Menu, action: openDrawer },
      ];

  return <BottomTabBar portalId="platform" tabs={tabs} />;
}
