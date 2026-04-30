"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail, Phone, Video, Users, MessageCircle, MessageSquare,
  Linkedin, FileText, MoreHorizontal, ArrowRight, ArrowLeft,
  Clock, Search, Send, FileStack,
} from "lucide-react";

type CommunicationType =
  | "EMAIL" | "PHONE_CALL" | "VIDEO_CALL" | "IN_PERSON_MEETING"
  | "WHATSAPP" | "SMS" | "LINKEDIN_MESSAGE" | "NOTE" | "OTHER";

interface Item {
  id: string;
  type: CommunicationType;
  direction: "OUTBOUND" | "INBOUND" | "INTERNAL";
  status: string;
  subject: string | null;
  body: string | null;
  occurredAt: string;
  nextAction: string | null;
  nextActionDate: string | null;
  outcome: string | null;
  loggedBy: { id: string; name: string };
  nextActionAssignedTo: { id: string; name: string } | null;
  subjectName: string;
  subjectLink: string | null;
  subjectType: string;
}

const TYPE_META: Record<CommunicationType, { icon: typeof Mail; label: string; color: string }> = {
  EMAIL: { icon: Mail, label: "Email", color: "#0F2744" },
  PHONE_CALL: { icon: Phone, label: "Call", color: "#059669" },
  VIDEO_CALL: { icon: Video, label: "Video", color: "#7C3AED" },
  IN_PERSON_MEETING: { icon: Users, label: "Meeting", color: "#D97706" },
  WHATSAPP: { icon: MessageCircle, label: "WhatsApp", color: "#25D366" },
  SMS: { icon: MessageSquare, label: "SMS", color: "#3B82F6" },
  LINKEDIN_MESSAGE: { icon: Linkedin, label: "LinkedIn", color: "#0A66C2" },
  NOTE: { icon: FileText, label: "Note", color: "#6B7280" },
  OTHER: { icon: MoreHorizontal, label: "Other", color: "#6B7280" },
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export default function CommunicationsInbox({
  items,
  tab,
  counts,
  activeType,
  activeSearch,
}: {
  items: Item[];
  tab: string;
  counts: { all: number; followUps: number; mine: number; inbound: number };
  activeType?: string;
  activeSearch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function buildHref(updates: Record<string, string | undefined>): string {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    const qs = params.toString();
    return qs ? `/communications?${qs}` : "/communications";
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string)?.trim();
    router.push(buildHref({ q: q || undefined }));
  }

  const TABS = [
    { key: "all", label: `All (${counts.all})` },
    { key: "follow-ups", label: `Follow-ups (${counts.followUps})` },
    { key: "inbound", label: `Inbound (${counts.inbound})` },
    { key: "mine", label: `Mine (${counts.mine})` },
  ];

  return (
    <div className="max-w-5xl space-y-4">
      {/* Tabs + Compose */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={buildHref({ tab: t.key === "all" ? undefined : t.key })}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: tab === t.key ? "#0F2744" : "#fff",
                color: tab === t.key ? "#fff" : "#6B7280",
                border: tab === t.key ? "1px solid #0F2744" : "1px solid #e5eaf0",
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={activeSearch ?? ""}
                placeholder="Search subject or body..."
                className="rounded-lg border pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                style={{ borderColor: "#e5eaf0", width: "200px" }}
              />
            </div>
          </form>
          <Link
            href="/communications/templates"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ border: "1px solid #e5eaf0", color: "#0F2744" }}
          >
            <FileStack size={11} /> Templates
          </Link>
          <Link
            href="/communications/compose"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: "#0F2744" }}
          >
            <Send size={11} /> Compose
          </Link>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-1.5 overflow-x-auto">
        {[
          { key: "", label: "All Types" },
          ...Object.entries(TYPE_META).map(([key, m]) => ({ key, label: m.label })),
        ].map((t) => (
          <Link
            key={t.key}
            href={buildHref({ type: t.key || undefined })}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              background: (activeType ?? "") === t.key ? "#0F2744" : "#F9FAFB",
              color: (activeType ?? "") === t.key ? "#fff" : "#6B7280",
              border: "1px solid",
              borderColor: (activeType ?? "") === t.key ? "#0F2744" : "#E5E7EB",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* List */}
      <div className="rounded-xl bg-white" style={{ border: "1px solid #e5eaf0" }}>
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No communications match these filters.
          </div>
        ) : (
          items.map((c, idx) => {
            const meta = TYPE_META[c.type] ?? TYPE_META.OTHER;
            const Icon = meta.icon;
            const overdue = c.nextActionDate && new Date(c.nextActionDate) < new Date();
            return (
              <div
                key={c.id}
                className="px-5 py-4 hover:bg-gray-50 transition-colors"
                style={{ borderBottom: idx === items.length - 1 ? "none" : "1px solid #F3F4F6" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${meta.color}15`, color: meta.color }}
                  >
                    <Icon size={14} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {c.direction === "OUTBOUND" && <ArrowRight size={11} className="text-gray-400" />}
                      {c.direction === "INBOUND" && <ArrowLeft size={11} className="text-emerald-500" />}
                      <span className="font-semibold" style={{ color: "#0F2744" }}>{meta.label}</span>
                      <span className="text-gray-400">·</span>
                      {c.subjectLink ? (
                        <Link href={c.subjectLink} className="text-xs font-medium hover:underline" style={{ color: "#0F2744" }}>
                          {c.subjectName}
                        </Link>
                      ) : (
                        <span className="text-xs font-medium" style={{ color: "#0F2744" }}>{c.subjectName}</span>
                      )}
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">{c.loggedBy.name}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-400">{timeAgo(c.occurredAt)}</span>
                    </div>

                    {c.subject && (
                      <p className="text-sm font-medium mt-0.5 truncate" style={{ color: "#0F2744" }}>{c.subject}</p>
                    )}
                    {c.body && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{c.body}</p>
                    )}

                    {c.nextAction && (
                      <div
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded"
                        style={{ background: overdue ? "#FEE2E2" : "#FEF3C7", color: overdue ? "#991B1B" : "#92400E" }}
                      >
                        <Clock size={10} />
                        <span className="font-medium">{c.nextAction}</span>
                        {c.nextActionDate && (
                          <span>· {new Date(c.nextActionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                        )}
                        {c.nextActionAssignedTo && <span>· {c.nextActionAssignedTo.name}</span>}
                        {overdue && <span className="font-semibold">· OVERDUE</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
