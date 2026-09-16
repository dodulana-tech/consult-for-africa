"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Video, Calendar, Clock, Users, ExternalLink, Copy, Check, X, Plus, Pencil,
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

/** Date input wants local wall-clock time, not an ISO string in UTC. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [addingPerson, setAddingPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: "", email: "", role: "" });

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

  async function patchMeeting(body: Record<string, unknown>): Promise<boolean> {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Could not save that."); return false; }
      if (data.meeting) setMeeting(data.meeting);
      return true;
    } finally {
      setSaving(false);
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
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
              >
                <Pencil className="w-3.5 h-3.5" /> {editing ? "Close" : "Edit"}
              </button>
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
            {/* Change the meeting rather than cancelling and rebooking it.
                Everything here syncs back to the calendar entry. */}
            {editing && (
              <div className="bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: "#e5eaf0" }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Edit meeting</h3>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                  style={{ borderColor: "#e5eaf0" }}
                  defaultValue={meeting.title}
                  id="m-title"
                  placeholder="Title"
                />
                <textarea
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                  style={{ borderColor: "#e5eaf0" }}
                  rows={3}
                  defaultValue={meeting.description ?? ""}
                  id="m-desc"
                  placeholder="What it is for, and the minutes afterwards"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Starts</label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                      style={{ borderColor: "#e5eaf0" }}
                      defaultValue={toLocalInput(meeting.scheduledAt)}
                      id="m-start"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Minutes</label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                      style={{ borderColor: "#e5eaf0" }}
                      defaultValue={Math.max(
                        15,
                        Math.round((new Date(meeting.scheduledEndAt).getTime() - new Date(meeting.scheduledAt).getTime()) / 60000),
                      )}
                      id="m-dur"
                    />
                  </div>
                </div>
                {err && <p className="text-sm" style={{ color: "#DC2626" }}>{err}</p>}
                <div className="flex gap-2">
                  <button
                    disabled={saving}
                    onClick={async () => {
                      const title = (document.getElementById("m-title") as HTMLInputElement)?.value.trim();
                      const description = (document.getElementById("m-desc") as HTMLTextAreaElement)?.value;
                      const start = (document.getElementById("m-start") as HTMLInputElement)?.value;
                      const dur = Number((document.getElementById("m-dur") as HTMLInputElement)?.value);
                      const ok = await patchMeeting({
                        ...(title ? { title } : {}),
                        description,
                        ...(start ? { scheduledAt: new Date(start).toISOString() } : {}),
                        ...(Number.isFinite(dur) && dur > 0 ? { durationMinutes: dur } : {}),
                      });
                      if (ok) setEditing(false);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: "#0F2744" }}
                  >
                    {saving ? "Saving" : "Save changes"}
                  </button>
                  <button onClick={() => { setEditing(false); setErr(""); }}
                    className="px-4 py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: "#e5eaf0", color: "#64748B" }}>Cancel</button>
                </div>
                <p className="text-[11px]" style={{ color: "#94A3B8" }}>
                  Moving the time re-sends the calendar invitation to everyone going.
                </p>
              </div>
            )}

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

            {/* No link is not the same as no notice. A meeting whose Google Meet
                link failed also sent no invitations, and the absence of a button
                is not something an organiser reads as a problem. */}
            {!meeting.meetLink && meeting.status !== "CANCELLED" && (
              <div className="rounded-xl p-4" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <h3 className="text-xs font-semibold uppercase mb-1" style={{ color: "#92400E" }}>
                  No join link
                </h3>
                <p className="text-sm" style={{ color: "#78350F" }}>
                  Google Calendar did not create a link for this meeting, which also means
                  no invitations went out. Nobody has been told about it. Reconnect Google
                  and book it again, or send the participants a link yourself.
                </p>
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
                    <button
                      onClick={async () => { await patchMeeting({ removeParticipantIds: [p.id] }); }}
                      disabled={saving}
                      title={`Remove ${p.name}`}
                      className="shrink-0 p-1 rounded hover:bg-red-50 disabled:opacity-40"
                      style={{ color: "#CBD5E1" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Somebody left off the original invite should not mean cancelling
                  and rebooking the whole meeting. */}
              {addingPerson ? (
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                    style={{ borderColor: "#e5eaf0" }}
                    placeholder="Name"
                    value={newPerson.name}
                    onChange={(e) => setNewPerson((v) => ({ ...v, name: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                    style={{ borderColor: "#e5eaf0" }}
                    placeholder="Email"
                    type="email"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson((v) => ({ ...v, email: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                    style={{ borderColor: "#e5eaf0" }}
                    placeholder="Role (optional)"
                    value={newPerson.role}
                    onChange={(e) => setNewPerson((v) => ({ ...v, role: e.target.value }))}
                  />
                  <p className="text-[11px]" style={{ color: "#94A3B8" }}>
                    They get the invitation and the calendar entry updates. Nobody already going is emailed again.
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={saving || !newPerson.name.trim() || !newPerson.email.trim()}
                      onClick={async () => {
                        const ok = await patchMeeting({ addParticipants: [newPerson] });
                        if (ok) { setNewPerson({ name: "", email: "", role: "" }); setAddingPerson(false); }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                      style={{ background: "#0F2744" }}
                    >
                      {saving ? "Adding" : "Add and invite"}
                    </button>
                    <button onClick={() => { setAddingPerson(false); setErr(""); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                      style={{ borderColor: "#e5eaf0", color: "#64748B" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingPerson(true)}
                  className="mt-3 flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: "#0F2744" }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add someone
                </button>
              )}
              {err && <p className="text-xs mt-2" style={{ color: "#DC2626" }}>{err}</p>}
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
