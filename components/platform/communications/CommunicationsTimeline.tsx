"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mail, Phone, Video, Users, MessageCircle, MessageSquare,
  Linkedin, FileText, MoreHorizontal, ArrowRight, ArrowLeft,
  Pin, Archive, Trash2, Edit3, Plus, Calendar, AlertCircle, Loader2,
  CheckCircle, Clock, Send,
} from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import LogCommunicationForm from "./LogCommunicationForm";
import SendEmailModal from "./SendEmailModal";

type CommunicationType =
  | "EMAIL" | "PHONE_CALL" | "VIDEO_CALL" | "IN_PERSON_MEETING"
  | "WHATSAPP" | "SMS" | "LINKEDIN_MESSAGE" | "NOTE" | "OTHER";

type Direction = "OUTBOUND" | "INBOUND" | "INTERNAL";

type Status =
  | "DRAFT" | "SCHEDULED" | "LOGGED" | "SENT" | "DELIVERED"
  | "OPENED" | "CLICKED" | "REPLIED" | "BOUNCED" | "FAILED" | "CANCELLED";

interface Comm {
  id: string;
  type: CommunicationType;
  direction: Direction;
  status: Status;
  subject: string | null;
  body: string | null;
  occurredAt: string;
  durationMinutes: number | null;
  outcome: string | null;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  nextAction: string | null;
  nextActionDate: string | null;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  fromEmail: string | null;
  toEmails: string[];
  meetingLink: string | null;
  phoneNumber: string | null;
  loggedBy: { id: string; name: string };
  nextActionAssignedTo: { id: string; name: string } | null;
  _count: { replies: number; events: number };
}

interface Summary {
  total: number;
  last90Days: number;
  lastContactedAt: string | null;
  lastContactedBy: string | null;
  lastContactType: CommunicationType | null;
  lastContactDirection: Direction | null;
  responseRate: number | null;
  openNextActions: number;
}

export interface SubjectRef {
  subjectType:
    | "CONSULTANT" | "CLIENT" | "CLIENT_CONTACT" | "TALENT_APPLICATION"
    | "CADRE_PROFESSIONAL" | "PARTNER_FIRM" | "SALES_AGENT"
    | "DISCOVERY_CALL" | "MAAROVA_USER" | "PROSPECT";
  consultantId?: string;
  clientId?: string;
  clientContactId?: string;
  applicationId?: string;
  cadreProfessionalId?: string;
  partnerFirmId?: string;
  salesAgentId?: string;
  discoveryCallId?: string;
  maarovaUserId?: string;
  subjectName?: string; // for display: "Dr. Adenuga"
  subjectEmail?: string;
  subjectPhone?: string;
}

const TYPE_META: Record<CommunicationType, { icon: typeof Mail; label: string; color: string }> = {
  EMAIL: { icon: Mail, label: "Email", color: "#0F2744" },
  PHONE_CALL: { icon: Phone, label: "Call", color: "#059669" },
  VIDEO_CALL: { icon: Video, label: "Video Call", color: "#7C3AED" },
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
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function buildQueryString(subject: SubjectRef, extra: Record<string, string> = {}): string {
  const params: Record<string, string> = { ...extra };
  if (subject.subjectType) params.subjectType = subject.subjectType;
  if (subject.consultantId) params.consultantId = subject.consultantId;
  if (subject.clientId) params.clientId = subject.clientId;
  if (subject.clientContactId) params.clientContactId = subject.clientContactId;
  if (subject.applicationId) params.applicationId = subject.applicationId;
  if (subject.cadreProfessionalId) params.cadreProfessionalId = subject.cadreProfessionalId;
  if (subject.partnerFirmId) params.partnerFirmId = subject.partnerFirmId;
  if (subject.salesAgentId) params.salesAgentId = subject.salesAgentId;
  if (subject.discoveryCallId) params.discoveryCallId = subject.discoveryCallId;
  if (subject.maarovaUserId) params.maarovaUserId = subject.maarovaUserId;
  return new URLSearchParams(params).toString();
}

export default function CommunicationsTimeline({ subject }: { subject: SubjectRef }) {
  const [items, setItems] = useState<Comm[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogForm, setShowLogForm] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CommunicationType | "ALL">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const baseQs = buildQueryString(subject);
      const typeQs = typeFilter !== "ALL" ? `&type=${typeFilter}` : "";
      const [listRes, summaryRes] = await Promise.all([
        fetch(`/api/communications?${baseQs}${typeQs}&pageSize=100`),
        fetch(`/api/communications/summary?${baseQs}`),
      ]);
      if (!listRes.ok) {
        setError(await parseApiError(listRes));
        return;
      }
      const list = await listRes.json();
      const sum = summaryRes.ok ? await summaryRes.json() : null;
      setItems(list.items || []);
      setSummary(sum);
    } catch {
      setError("Network error loading communications.");
    } finally {
      setLoading(false);
    }
  }, [subject, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLogged() {
    setShowLogForm(false);
    await fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Archive this communication?")) return;
    const res = await fetch(`/api/communications/${id}`, { method: "DELETE" });
    if (res.ok) await fetchData();
  }

  const counts = {
    all: items.length,
    EMAIL: items.filter((i) => i.type === "EMAIL").length,
    PHONE_CALL: items.filter((i) => i.type === "PHONE_CALL").length,
    VIDEO_CALL: items.filter((i) => i.type === "VIDEO_CALL").length,
    IN_PERSON_MEETING: items.filter((i) => i.type === "IN_PERSON_MEETING").length,
    WHATSAPP: items.filter((i) => i.type === "WHATSAPP").length,
    NOTE: items.filter((i) => i.type === "NOTE").length,
  };

  const filtered = typeFilter === "ALL" ? items : items.filter((i) => i.type === typeFilter);

  return (
    <div className="rounded-xl bg-white" style={{ border: "1px solid #e5eaf0" }}>
      {/* Header with summary */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Communications</h3>
            {summary && summary.total > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {summary.total} total
                {summary.lastContactedAt && (
                  <> · last contacted {timeAgo(summary.lastContactedAt)}{summary.lastContactedBy && ` by ${summary.lastContactedBy}`}</>
                )}
                {summary.responseRate != null && (
                  <> · {summary.responseRate}% response rate</>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {subject.subjectEmail && (
              <button
                onClick={() => setShowSendForm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                style={{ background: "#0F2744" }}
              >
                <Send size={11} /> Send Email
              </button>
            )}
            <button
              onClick={() => setShowLogForm(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ border: "1px solid #e5eaf0", color: "#0F2744" }}
            >
              <Plus size={11} /> Log
            </button>
          </div>
        </div>

        {summary && summary.openNextActions > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
            <Clock size={11} />
            {summary.openNextActions} open follow-up{summary.openNextActions !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div className="px-5 py-3 border-b flex gap-1.5 overflow-x-auto" style={{ borderColor: "#F3F4F6" }}>
        {[
          { key: "ALL", label: `All (${counts.all})`, color: "#0F2744" },
          { key: "EMAIL", label: `Emails (${counts.EMAIL})`, color: TYPE_META.EMAIL.color },
          { key: "PHONE_CALL", label: `Calls (${counts.PHONE_CALL})`, color: TYPE_META.PHONE_CALL.color },
          { key: "VIDEO_CALL", label: `Video (${counts.VIDEO_CALL})`, color: TYPE_META.VIDEO_CALL.color },
          { key: "IN_PERSON_MEETING", label: `Meetings (${counts.IN_PERSON_MEETING})`, color: TYPE_META.IN_PERSON_MEETING.color },
          { key: "WHATSAPP", label: `WhatsApp (${counts.WHATSAPP})`, color: TYPE_META.WHATSAPP.color },
          { key: "NOTE", label: `Notes (${counts.NOTE})`, color: TYPE_META.NOTE.color },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key as CommunicationType | "ALL")}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              background: typeFilter === f.key ? f.color : "#F9FAFB",
              color: typeFilter === f.key ? "#fff" : "#6B7280",
              border: "1px solid",
              borderColor: typeFilter === f.key ? f.color : "#E5E7EB",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div>
        {loading && (
          <div className="px-5 py-8 text-center text-gray-400 flex items-center justify-center gap-2 text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading...
          </div>
        )}

        {error && (
          <div className="px-5 py-3 text-sm text-red-600 flex items-center gap-2" style={{ background: "#FEF2F2" }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="px-5 py-10 text-center">
            <FileText size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {typeFilter === "ALL" ? "No communications logged yet." : "No communications of this type."}
            </p>
            {typeFilter === "ALL" && (
              <button
                onClick={() => setShowLogForm(true)}
                className="mt-3 text-xs font-medium hover:underline"
                style={{ color: "#0F2744" }}
              >
                Log the first one
              </button>
            )}
          </div>
        )}

        {!loading && filtered.map((c, idx) => {
          const meta = TYPE_META[c.type];
          const Icon = meta.icon;
          const isExpanded = expandedId === c.id;
          return (
            <div
              key={c.id}
              className="px-5 py-3 transition-colors hover:bg-gray-50"
              style={{ borderBottom: idx === filtered.length - 1 ? "none" : "1px solid #F3F4F6" }}
            >
              <div className="flex items-start gap-3">
                {/* Type icon */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${meta.color}15`, color: meta.color }}
                >
                  <Icon size={13} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {c.direction === "OUTBOUND" && <ArrowRight size={11} className="text-gray-400" />}
                    {c.direction === "INBOUND" && <ArrowLeft size={11} className="text-emerald-500" />}
                    <span className="font-semibold" style={{ color: "#0F2744" }}>
                      {meta.label}
                    </span>
                    {c.status === "REPLIED" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#D1FAE5", color: "#065F46" }}>
                        Replied
                      </span>
                    )}
                    {c.status === "BOUNCED" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                        Bounced
                      </span>
                    )}
                    {c.isPinned && <Pin size={10} className="text-amber-500" />}
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{c.loggedBy.name}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-400" title={new Date(c.occurredAt).toLocaleString()}>
                      {timeAgo(c.occurredAt)}
                    </span>
                    {c.durationMinutes && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-400">{c.durationMinutes}m</span>
                      </>
                    )}
                  </div>

                  {c.subject && (
                    <p className="text-sm font-medium mt-0.5 truncate" style={{ color: "#0F2744" }}>
                      {c.subject}
                    </p>
                  )}

                  {c.body && (
                    <p
                      className={`text-xs text-gray-600 mt-1 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {c.body}
                    </p>
                  )}

                  {c.outcome && (
                    <div className="mt-1.5 inline-block px-2 py-0.5 rounded text-[11px]" style={{ background: "#F3F4F6", color: "#374151" }}>
                      Outcome: {c.outcome}
                    </div>
                  )}

                  {c.nextAction && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-700">
                      <Calendar size={10} />
                      <span className="font-medium">Next:</span>
                      <span>{c.nextAction}</span>
                      {c.nextActionDate && (
                        <span className="text-amber-500">· by {new Date(c.nextActionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      )}
                      {c.nextActionAssignedTo && (
                        <span className="text-amber-500">· {c.nextActionAssignedTo.name}</span>
                      )}
                    </div>
                  )}

                  {c.tags.length > 0 && (
                    <div className="mt-1.5 flex gap-1 flex-wrap">
                      {c.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1E40AF" }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    title="Archive"
                  >
                    <Archive size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showLogForm && (
        <LogCommunicationForm
          subject={subject}
          onClose={() => setShowLogForm(false)}
          onLogged={handleLogged}
        />
      )}

      {showSendForm && subject.subjectEmail && (
        <SendEmailModal
          subject={subject}
          onClose={() => setShowSendForm(false)}
          onSent={handleLogged}
        />
      )}
    </div>
  );
}
