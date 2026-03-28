"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

const MEETING_TYPES = [
  { value: "DISCOVERY_CALL", label: "Discovery Call" },
  { value: "PROJECT_CHECKIN", label: "Project Check-in" },
  { value: "INTERNAL", label: "Internal Meeting" },
  { value: "CLIENT_REVIEW", label: "Client Review" },
  { value: "COACHING", label: "Coaching Session" },
];

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

interface Participant {
  name: string;
  email: string;
  role: string;
  userId?: string;
}

function NewMeetingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const engagementId = searchParams.get("engagementId");
  const discoveryCallId = searchParams.get("discoveryCallId");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: discoveryCallId ? "DISCOVERY_CALL" : "",
    scheduledAt: "",
    durationMinutes: 60,
    nuruEnabled: true,
    engagementId: engagementId || "",
    discoveryCallId: discoveryCallId || "",
  });

  const [participants, setParticipants] = useState<Participant[]>([
    { name: "", email: "", role: "Organizer" },
  ]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load projects for linking
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        const list = data.engagements ?? data.projects ?? [];
        setProjects(list.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, []);

  // Pre-populate from discovery call
  useEffect(() => {
    if (!discoveryCallId) return;
    fetch(`/api/discovery-calls/${discoveryCallId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.call) {
          const call = data.call;
          setForm((f) => ({
            ...f,
            title: `Discovery Call: ${call.organizationName}`,
            type: "DISCOVERY_CALL",
          }));
          if (call.contactEmail) {
            setParticipants((prev) => [
              ...prev,
              { name: call.contactName, email: call.contactEmail, role: "Client" },
            ]);
          }
        }
      })
      .catch(() => {});
  }, [discoveryCallId]);

  function addParticipant() {
    setParticipants((prev) => [...prev, { name: "", email: "", role: "" }]);
  }

  function removeParticipant(index: number) {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateParticipant(index: number, field: keyof Participant, value: string) {
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const validParticipants = participants.filter((p) => p.name.trim() && p.email.trim());
    if (validParticipants.length === 0) {
      setError("Add at least one participant with name and email");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          participants: validParticipants,
          engagementId: form.engagementId || null,
          discoveryCallId: form.discoveryCallId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create meeting");
      router.push(`/meetings/${data.meeting.id}`);
    } catch (err) {
      console.error("Meeting creation failed:", err);
      setError("Unable to create the meeting. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none";
  const inputStyle = { borderColor: "#e5eaf0" };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F2744" }}>
          Schedule Meeting
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Create a meeting with a Google Meet link. Nuru will join to take notes automatically.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meeting Details */}
          <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5eaf0" }}>
            <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Meeting Details
            </h2>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. Weekly project sync with client"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                <select
                  required
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="">Select type...</option>
                  {MEETING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Link to Project
                </label>
                <select
                  value={form.engagementId}
                  onChange={(e) => setForm((f) => ({ ...f, engagementId: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date & Time *
                </label>
                <input
                  required
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                <select
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))
                  }
                  className={inputClass}
                  style={inputStyle}
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description (optional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputClass}
                style={inputStyle}
                rows={3}
                placeholder="Meeting agenda or notes..."
              />
            </div>

            {/* Nuru Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#FFFBEB" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                  Nuru Meeting Assistant
                </p>
                <p className="text-xs text-gray-500">
                  Nuru will join to take notes and capture action items
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, nuruEnabled: !f.nuruEnabled }))}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: form.nuruEnabled ? "#D4AF37" : "#D1D5DB" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                  style={{ transform: form.nuruEnabled ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5eaf0" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                Participants
              </h2>
              <button
                type="button"
                onClick={addParticipant}
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: "#D4AF37" }}
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {participants.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                <div>
                  {i === 0 && (
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  )}
                  <input
                    value={p.name}
                    onChange={(e) => updateParticipant(i, "name", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  {i === 0 && (
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  )}
                  <input
                    type="email"
                    value={p.email}
                    onChange={(e) => updateParticipant(i, "email", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  {i === 0 && (
                    <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  )}
                  <select
                    value={p.role}
                    onChange={(e) => updateParticipant(i, "role", e.target.value)}
                    className={inputClass}
                    style={{ ...inputStyle, width: "120px" }}
                  >
                    <option value="">Role...</option>
                    <option value="Organizer">Organizer</option>
                    <option value="Client">Client</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Stakeholder">Stakeholder</option>
                    <option value="Observer">Observer</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeParticipant(i)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={participants.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#0F2744" }}
            >
              {saving ? "Scheduling..." : "Schedule Meeting"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border"
              style={{ borderColor: "#e5eaf0" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewMeetingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      }
    >
      <NewMeetingForm />
    </Suspense>
  );
}
