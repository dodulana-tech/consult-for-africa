"use client";

import { useSession } from "next-auth/react";
import { ChevronDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NotificationsDrawer from "./NotificationsDrawer";

interface TopBarProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}

export default function TopBar({ title, subtitle, backHref, action }: TopBarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <header
      className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 shrink-0"
      style={{ background: "#ffffff", borderBottom: "1px solid #e5eaf0" }}
    >
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} />
          </Link>
        )}
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {action}
        <NotificationsDrawer />

        {/* User */}
        <Link href="/settings" className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ background: "#0F2744" }}
          >
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name ?? "User"}</p>
            <p className="text-[10px] text-gray-400 leading-tight capitalize">
              {user?.role?.replace(/_/g, " ").toLowerCase() ?? ""}
            </p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </Link>
      </div>
    </header>
  );
}
