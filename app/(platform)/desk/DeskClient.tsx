"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Boxes, CheckCircle2, Clock, FileSearch,
  Loader2, MessageSquare, Sparkles,
} from "lucide-react";

interface Row {
  kind: string;
  id: string;
  title: string;
  detail: string;
  href: string;
  date: string | null;
  urgency: "OVERDUE" | "TODAY" | "SOON" | "NONE";
  action: string;
}

interface Desk {
  generatedAt: string;
  yoursNow: Row[];
  waitingOnOthers: Row[];
  scheduled: Row[];
}

const URGENCY: Record<string, { border: string; text: string; label: string }> = {
  OVERDUE: { border: "#FCA5A5", text: "#DC2626", label: "Late" },
  TODAY: { border: "#FDE68A", text: "#B45309", label: "Today" },
  SOON: { border: "#e5eaf0", text: "#64748B", label: "Soon" },
  NONE: { border: "#e5eaf0", text: "#94A3B8", label: "" },
};

function when(iso: string | null): string {
  if (!iso) return "no date";
  const d = new Date(iso);
  const days = Math.floor((d.getTime() - Date.now()) / 86400000);
  if (days < -1) return `${Math.abs(days)} days late`;
  if (days === -1 || days === 0) {
    const today = new Date().toDateString() === d.toDateString();
    return today ? "today" : "yesterday";
  }
  if (days === 1) return "tomorrow";
  if (days <= 6) return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function DeskClient({ firstName }: { firstName: string }) {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return fetch("/api/desk")
      .then((r) => r.json())
      .then((d) => setDesk(d.yoursNow ? d : null))
      .catch(() => setDesk(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 gap-2">
        <Loader2 size={16} className="animate-spin" /> Loading
      </div>
    );
  }
  if (!desk) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Could not load your desk.</div>;
  }

  const nothingAtAll =
    desk.yoursNow.length === 0 && desk.waitingOnOthers.length === 0 && desk.scheduled.length === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-8">
        {nothingAtAll ? (
          <div className="rounded-xl border bg-white p-8 text-center" style={{ borderColor: "#e5eaf0" }}>
            <CheckCircle2 size={26} className="mx-auto mb-3" style={{ color: "#10B981" }} />
            <p className="text-sm font-medium text-gray-900">Nothing is waiting on you{firstName ? `, ${firstName}` : ""}.</p>
            <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "#64748B" }}>
              This page fills itself from your tasks, the promises you are chasing and your diary.
              When work comes to you it appears at the top, with a brief explaining why it matters.
            </p>
          </div>
        ) : (
          <>
            <Bucket
              title="Yours now"
              blurb="Nobody else can move these. Start at the top."
              rows={desk.yoursNow}
              emptyLine="Nothing is sitting on you. That is the goal, not a mistake."
            />
            <Bucket
              title="Waiting on other people"
              blurb="Not your work, but your job to make sure it lands."
              rows={desk.waitingOnOthers}
              emptyLine="Nobody owes you anything you have written down yet."
            />
            <Bucket
              title="Coming up"
              blurb="Waiting on a date rather than a person."
              rows={desk.scheduled}
              emptyLine="Nothing in the next seven days."
            />
          </>
        )}

        {/* Reference: waiting on nobody. Deliberately last, and not a queue. */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>
            Reference
          </p>
          <p className="text-xs mb-3" style={{ color: "#94A3B8" }}>
            Things to look up rather than act on.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <RefLink href="/knowledge" icon={BookOpen} label="Knowledge" />
            <RefLink href="/knowledge/library" icon={FileSearch} label="Asset Library" />
            <RefLink href="/inventory" icon={Boxes} label="Inventory" />
            <RefLink href="/communications" icon={MessageSquare} label="Past comms" />
            <RefLink href="/rhythm" icon={Clock} label="The rhythm" />
            <RefLink href="/ai" icon={Sparkles} label="Nuru" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Bucket({
  title, blurb, rows, emptyLine,
}: { title: string; blurb: string; rows: Row[]; emptyLine: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <span className="text-xs" style={{ color: "#94A3B8" }}>{rows.length}</span>
      </div>
      <p className="text-xs mb-3" style={{ color: "#94A3B8" }}>{blurb}</p>

      {rows.length === 0 ? (
        <p className="text-sm rounded-xl border bg-white px-4 py-5" style={{ borderColor: "#e5eaf0", color: "#94A3B8" }}>
          {emptyLine}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const u = URGENCY[r.urgency];
            return (
              <Link
                key={`${r.kind}-${r.id}`}
                href={r.href}
                className="flex items-center gap-3 rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow"
                style={{ borderColor: u.border }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "#94A3B8" }}>{r.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold" style={{ color: u.text }}>{when(r.date)}</p>
                  <p className="text-[11px] flex items-center gap-1 justify-end" style={{ color: "#94A3B8" }}>
                    {r.action} <ArrowRight size={11} />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RefLink({ href, icon: Icon, label }: { href: string; icon: typeof BookOpen; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm hover:shadow-sm transition-shadow"
      style={{ borderColor: "#e5eaf0", color: "#475569" }}
    >
      <Icon size={14} style={{ color: "#94A3B8" }} />
      {label}
    </Link>
  );
}
