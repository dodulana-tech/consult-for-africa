"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, X, FileCheck, Clock, CreditCard, AlertTriangle, RefreshCw, Dot } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type Update = {
  id: string;
  content: string;
  type: string;
  projectId: string;
  projectName: string;
  createdByName: string;
  createdAt: string;
};

type Badges = {
  pendingTimesheets: number;
  pendingReviews: number;
  awaitingPayment: number;
  needsResubmission: number;
};

const TYPE_ICON: Record<string, React.ElementType> = {
  MILESTONE_COMPLETED: FileCheck,
  ISSUE: AlertTriangle,
  CLIENT_FEEDBACK: Dot,
  TEAM_CHANGE: RefreshCw,
};

const LAST_SEEN_KEY = "cfa_notifications_last_seen";

export default function NotificationsDrawer() {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [badges, setBadges] = useState<Badges | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>("");
  const drawerRef = useRef<HTMLDivElement>(null);

  // Load lastSeen from localStorage
  useEffect(() => {
    setLastSeen(localStorage.getItem(LAST_SEEN_KEY) ?? "");
  }, []);

  // Fetch notifications
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setUpdates(data.updates);
        setBadges(data.badges);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // Refresh every 60s
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function markSeen() {
    const now = new Date().toISOString();
    setLastSeen(now);
    localStorage.setItem(LAST_SEEN_KEY, now);
  }

  function handleOpen() {
    setOpen((o) => {
      if (!o) markSeen();
      return !o;
    });
  }

  const unreadCount = updates.filter((u) => !lastSeen || u.createdAt > lastSeen).length;
  const totalBadge = (badges?.pendingReviews ?? 0) + (badges?.pendingTimesheets ?? 0) +
    (badges?.needsResubmission ?? 0);
  const showDot = unreadCount > 0 || totalBadge > 0;

  return (
    <div className="relative" ref={drawerRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-gray-500" />
        {showDot && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#EF4444" }}
          />
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-80 max-h-[calc(100vh-5rem)] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
          style={{ border: "1px solid #e5eaf0" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "#e5eaf0" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: "#EF4444" }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          </div>

          {/* Action badges */}
          {badges && (badges.pendingReviews > 0 || badges.pendingTimesheets > 0 || badges.awaitingPayment > 0 || badges.needsResubmission > 0) && (
            <div className="px-4 py-3 space-y-1.5 border-b" style={{ borderColor: "#e5eaf0", background: "#FFFBEB" }}>
              {badges.pendingReviews > 0 && (
                <Link href="/deliverables" onClick={() => setOpen(false)} className="flex items-center justify-between text-xs hover:opacity-80">
                  <span className="flex items-center gap-2 text-amber-700">
                    <FileCheck size={12} />
                    {badges.pendingReviews} deliverable{badges.pendingReviews !== 1 ? "s" : ""} pending review
                  </span>
                  <span className="text-amber-500">→</span>
                </Link>
              )}
              {badges.pendingTimesheets > 0 && (
                <Link href="/timesheets" onClick={() => setOpen(false)} className="flex items-center justify-between text-xs hover:opacity-80">
                  <span className="flex items-center gap-2 text-amber-700">
                    <Clock size={12} />
                    {badges.pendingTimesheets} timesheet{badges.pendingTimesheets !== 1 ? "s" : ""} to approve
                  </span>
                  <span className="text-amber-500">→</span>
                </Link>
              )}
              {badges.awaitingPayment > 0 && (
                <Link href="/timesheets/payment-queue" onClick={() => setOpen(false)} className="flex items-center justify-between text-xs hover:opacity-80">
                  <span className="flex items-center gap-2 text-amber-700">
                    <CreditCard size={12} />
                    {badges.awaitingPayment} entr{badges.awaitingPayment !== 1 ? "ies" : "y"} awaiting payment
                  </span>
                  <span className="text-amber-500">→</span>
                </Link>
              )}
              {badges.needsResubmission > 0 && (
                <Link href="/deliverables" onClick={() => setOpen(false)} className="flex items-center justify-between text-xs hover:opacity-80">
                  <span className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle size={12} />
                    {badges.needsResubmission} deliverable{badges.needsResubmission !== 1 ? "s" : ""} need resubmission
                  </span>
                  <span className="text-amber-500">→</span>
                </Link>
              )}
            </div>
          )}

          {/* Activity feed */}
          <div className="overflow-y-auto flex-1">
            {loading && updates.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading...</div>
            ) : updates.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No recent activity</div>
            ) : (
              updates.map((u) => {
                const Icon = TYPE_ICON[u.type] ?? Dot;
                const isUnread = !lastSeen || u.createdAt > lastSeen;
                return (
                  <Link
                    key={u.id}
                    href={`/projects/${u.projectId}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                    style={{ borderColor: "#f3f4f6" }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: isUnread ? "#FEF3C7" : "#F3F4F6" }}
                    >
                      <Icon size={13} style={{ color: isUnread ? "#D97706" : "#9CA3AF" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug line-clamp-2">{u.content}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-gray-400">{u.projectName}</span>
                        <span className="text-gray-200 text-[10px]">·</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(new Date(u.createdAt))}</span>
                      </div>
                    </div>
                    {isUnread && (
                      <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#F59E0B" }} />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
