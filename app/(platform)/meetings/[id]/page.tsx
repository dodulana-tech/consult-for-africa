"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Video, Calendar, Clock, Users, ExternalLink, Copy, Check,
  FileText, ListChecks, AlertCircle, Sparkles,
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  email: string;
  role: string | null;
  attended: boolean;
  joinedAt: string | null;
  leftAt: string | null;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  scheduledAt: string;
  scheduledEndAt: string;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  meetLink: string | null;
  calendarEventId: string | null;
  nuruEnabled: boolean;
  nuruJoined: boolean;
  transcript: string | null;
  aiSummary: string | null;
  aiActionItems: string[];
  aiKeyDecisions: string[];
  recordingUrl: string | null;
  organizer: { id: string; name: string; email: string };
  participants: Participant[];
  engagement: { id: string; name: string } | null;
  discoveryCall: { id: string; organizationName: string; contactName: string } | null;
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

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(`/api/meetings/${id}`)
      .then((r) => r.json())
      .then((data) => setMeeting(data.meeting ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function copyLink() {
    if (!meeting?.meetLink) return;
    navigator.clipboard.writeText(meeting.meetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCancel() {
    if (!confirm("Cancel this meeting? Participants will be notified.")) return;
    setCancelling(true);
    try {
      await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      router.push("/meetings");
    } catch {
      setCancelling(false);
    }
  }

  async function handleStatusChange(status: string) {
    const res = await fetch(`/api/meetings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.meeting) setMeeting(data.meeting);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">Meeting not found</p>
      </div>
    );
  }

  const colors = STATUS_COLORS[meeting.status] ?? STATUS_COLORS.SCHEDULED;
  const isActive = meeting.status === "SCHEDULED" || meeting.status === "IN_PROGRESS";

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
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
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Meetings
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                {meeting.title}
              </h1>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: colors.bg, color: colors.text }}
              >
                {meeting.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(meeting.scheduledAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatTime(meeting.scheduledAt)} - {formatTime(meeting.scheduledEndAt)}
              </span>
              <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">
                {TYPE_LABELS[meeting.type] ?? meeting.type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isActive && meeting.meetLink && (
              <a
                href={meeting.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: meeting.status === "IN_PROGRESS" ? "#16a34a" : "#1a73e8" }}
              >
                <Video className="w-4 h-4" />
                {meeting.status === "IN_PROGRESS" ? "Join Now" : "Join Meeting"}
              </a>
            )}
            {meeting.status === "SCHEDULED" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50"
              >
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meet Link */}
            {meeting.meetLink && (
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Google Meet Link
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href={meeting.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium flex-1 truncate"
                    style={{ color: "#1a73e8" }}
                  >
                    {meeting.meetLink}
                  </a>
                  <button
                    onClick={copyLink}
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                  <a
                    href={meeting.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                </div>
              </div>
            )}

            {/* Description */}
            {meeting.description && (
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.description}</p>
              </div>
            )}

            {/* Nuru Summary */}
            {meeting.aiSummary && (
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#D4AF37" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" style={{ color: "#D4AF37" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                    Nuru Meeting Notes
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Summary</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.aiSummary}</p>
                  </div>

                  {meeting.aiActionItems.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" /> Action Items
                      </h4>
                      <ul className="space-y-1">
                        {meeting.aiActionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-medium mt-0.5">
                              {i + 1}
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {meeting.aiKeyDecisions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Key Decisions
                      </h4>
                      <ul className="space-y-1">
                        {meeting.aiKeyDecisions.map((d, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transcript */}
            {meeting.transcript && (
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                    Transcript
                  </h3>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {meeting.transcript}
                </div>
              </div>
            )}

            {/* Status Actions */}
            {isActive && (
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Actions</h3>
                <div className="flex gap-2">
                  {meeting.status === "SCHEDULED" && (
                    <>
                      <button
                        onClick={() => handleStatusChange("IN_PROGRESS")}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ background: "#16a34a" }}
                      >
                        Start Meeting
                      </button>
                      <button
                        onClick={() => handleStatusChange("NO_SHOW")}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border"
                        style={{ borderColor: "#e5eaf0" }}
                      >
                        Mark as No-Show
                      </button>
                    </>
                  )}
                  {meeting.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusChange("COMPLETED")}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ background: "#0F2744" }}
                    >
                      End Meeting
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Participants ({meeting.participants.length})
              </h3>
              <div className="space-y-2">
                {/* Organizer */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: "#0F2744" }}>
                    {meeting.organizer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{meeting.organizer.name}</p>
                    <p className="text-xs text-gray-400">Organizer</p>
                  </div>
                </div>
                {meeting.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-200 text-gray-600">
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.role || p.email}</p>
                    </div>
                    {p.attended && (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Nuru Status */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#D4AF37" }} />
                Nuru Assistant
              </h3>
              {meeting.nuruEnabled ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${meeting.nuruJoined ? "bg-green-500" : "bg-amber-400"}`} />
                    <p className="text-sm text-gray-700">
                      {meeting.nuruJoined
                        ? "Nuru is in the meeting"
                        : meeting.status === "COMPLETED"
                          ? "Nuru attended this meeting"
                          : "Nuru will join when the meeting starts"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Real-time transcription and note-taking
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Disabled for this meeting</p>
              )}
            </div>

            {/* Linked entities */}
            {(meeting.engagement || meeting.discoveryCall) && (
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Linked To</h3>
                {meeting.engagement && (
                  <a
                    href={`/projects/${meeting.engagement.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    style={{ color: "#0F2744" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {meeting.engagement.name}
                  </a>
                )}
                {meeting.discoveryCall && (
                  <a
                    href={`/discovery-calls/${meeting.discoveryCall.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    style={{ color: "#0F2744" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Discovery: {meeting.discoveryCall.organizationName}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
