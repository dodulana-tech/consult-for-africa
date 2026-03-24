"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Video, Plus, Calendar, Clock, Users, ExternalLink } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  scheduledEndAt: string;
  meetLink: string | null;
  nuruEnabled: boolean;
  organizer: { id: string; name: string };
  participants: { id: string; name: string; email: string; role: string | null; attended: boolean }[];
  engagement: { id: string; name: string } | null;
  discoveryCall: { id: string; organizationName: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  DISCOVERY_CALL: "Discovery Call",
  PROJECT_CHECKIN: "Project Check-in",
  INTERNAL: "Internal",
  CLIENT_REVIEW: "Client Review",
  COACHING: "Coaching",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: "#EFF6FF", text: "#1D4ED8" },
  IN_PROGRESS: { bg: "#FEF3C7", text: "#92400E" },
  COMPLETED: { bg: "#ECFDF5", text: "#065F46" },
  CANCELLED: { bg: "#FEF2F2", text: "#991B1B" },
  NO_SHOW: { bg: "#F3F4F6", text: "#6B7280" },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    const params = tab === "upcoming" ? "?upcoming=true" : "";
    fetch(`/api/meetings${params}`)
      .then((r) => r.json())
      .then((data) => setMeetings(data.meetings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      weekday: "short", month: "short", day: "numeric",
      timeZone: "Africa/Lagos",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-NG", {
      hour: "2-digit", minute: "2-digit",
      timeZone: "Africa/Lagos",
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>Meetings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Schedule and manage video calls with clients and team members
            </p>
          </div>
          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#0F2744" }}
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg bg-gray-100 w-fit">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setLoading(true); }}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#0F2744" : "#6B7280",
                boxShadow: tab === t ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              {t === "upcoming" ? "Upcoming" : "Past"}
            </button>
          ))}
        </div>

        {/* Meeting List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border" style={{ borderColor: "#e5eaf0" }}>
            <Video className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {tab === "upcoming" ? "No upcoming meetings scheduled" : "No past meetings found"}
            </p>
            {tab === "upcoming" && (
              <Link
                href="/meetings/new"
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium"
                style={{ color: "#D4AF37" }}
              >
                <Plus className="w-4 h-4" /> Schedule your first meeting
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((m) => {
              const colors = STATUS_COLORS[m.status] ?? STATUS_COLORS.SCHEDULED;
              const isNow = m.status === "IN_PROGRESS";
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow"
                  style={{ borderColor: isNow ? "#D4AF37" : "#e5eaf0" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/meetings/${m.id}`}
                          className="text-sm font-semibold hover:underline truncate"
                          style={{ color: "#0F2744" }}
                        >
                          {m.title}
                        </Link>
                        <span
                          className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {m.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(m.scheduledAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(m.scheduledAt)} - {formatTime(m.scheduledEndAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {m.participants.length} participant{m.participants.length !== 1 ? "s" : ""}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px]">
                          {TYPE_LABELS[m.type] ?? m.type}
                        </span>
                        {m.nuruEnabled && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>
                            Nuru
                          </span>
                        )}
                      </div>

                      {(m.engagement || m.discoveryCall) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {m.engagement ? `Project: ${m.engagement.name}` : ""}
                          {m.discoveryCall ? `Discovery: ${m.discoveryCall.organizationName}` : ""}
                        </p>
                      )}
                    </div>

                    {m.meetLink && (m.status === "SCHEDULED" || m.status === "IN_PROGRESS") && (
                      <a
                        href={m.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: isNow ? "#16a34a" : "#1a73e8" }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {isNow ? "Join Now" : "Join"}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
