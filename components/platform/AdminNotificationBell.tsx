"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, X, ArrowRight } from "lucide-react";

interface AdminNotification {
  id: string;
  type: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; color: string }> = {
  INFO: { bg: "#EFF6FF", color: "#1E40AF" },
  SUCCESS: { bg: "#D1FAE5", color: "#065F46" },
  WARNING: { bg: "#FEF3C7", color: "#92400E" },
  CRITICAL: { bg: "#FEE2E2", color: "#991B1B" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + poll every 60s for unread count
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  async function markAllRead() {
    setMarking(true);
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      await fetchNotifs();
    } finally {
      setMarking(false);
    }
  }

  async function markOneRead(id: string) {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    await fetchNotifs();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Admin notifications"
      >
        <Bell size={16} className="text-gray-600" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: "#DC2626", color: "#fff" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-10 w-96 max-h-[600px] overflow-hidden flex flex-col rounded-xl bg-white shadow-xl z-50"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#F3F4F6" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-[10px] text-gray-400">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={marking}
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    style={{ color: "#0F2744" }}
                  >
                    {marking ? <Loader2 size={9} className="animate-spin" /> : <CheckCheck size={10} />}
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={12} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && items.length === 0 ? (
                <div className="py-8 text-center">
                  <Loader2 size={14} className="animate-spin mx-auto text-gray-300" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <Bell size={20} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No notifications yet.</p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    You'll see signal here when members submit salary reports, write reviews, claim accounts, or pilots advance.
                  </p>
                </div>
              ) : (
                items.map((n) => {
                  const style = SEVERITY_STYLES[n.severity] ?? SEVERITY_STYLES.INFO;
                  const Inner = (
                    <div
                      className={`px-4 py-3 transition-colors hover:bg-gray-50 ${n.isRead ? "" : "bg-blue-50/30"}`}
                      style={{ borderBottom: "1px solid #F3F4F6" }}
                    >
                      <div className="flex items-start gap-3">
                        {!n.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#3B82F6" }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                              style={{ background: style.bg, color: style.color }}
                            >
                              {n.severity}
                            </span>
                            <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                          </div>
                          <p className="text-sm font-semibold mt-1" style={{ color: "#0F2744" }}>{n.title}</p>
                          {n.body && (
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                          )}
                        </div>
                        {n.href && <ArrowRight size={11} className="text-gray-300 shrink-0 mt-2" />}
                      </div>
                    </div>
                  );
                  return n.href ? (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => { setOpen(false); if (!n.isRead) markOneRead(n.id); }}
                      className="block"
                    >
                      {Inner}
                    </Link>
                  ) : (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.isRead) markOneRead(n.id); }}
                      className="cursor-pointer"
                    >
                      {Inner}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
