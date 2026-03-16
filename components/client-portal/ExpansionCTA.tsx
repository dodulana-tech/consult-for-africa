"use client";

import { useState } from "react";

const SERVICE_TYPE_OPTIONS = [
  { value: "HOSPITAL_OPERATIONS", label: "Hospital Operations" },
  { value: "TURNAROUND", label: "Turnaround" },
  { value: "EMBEDDED_LEADERSHIP", label: "Embedded Leadership" },
  { value: "CLINICAL_GOVERNANCE", label: "Clinical Governance" },
  { value: "DIGITAL_HEALTH", label: "Digital Health" },
  { value: "HEALTH_SYSTEMS", label: "Health Systems" },
  { value: "DIASPORA_EXPERTISE", label: "Diaspora Expertise" },
  { value: "EM_AS_SERVICE", label: "EM as a Service" },
] as const;

export default function ExpansionCTA({ projectId }: { projectId?: string }) {
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe what you need help with.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/client-portal/expansion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: serviceType || undefined,
          description: description.trim(),
          urgency,
          projectId: projectId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit request");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg, #0F2744 0%, #1a3a5c 100%)",
          border: "1px solid #e5eaf0",
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: "rgba(212, 175, 55, 0.15)" }}
        >
          <svg
            width="22"
            height="22"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#D4AF37"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Request Submitted</h3>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
          Our team will review your request and reach out shortly.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setDescription("");
            setServiceType("");
            setUrgency("normal");
          }}
          className="text-xs font-medium mt-4 hover:underline"
          style={{ color: "#D4AF37" }}
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid #e5eaf0" }}
    >
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{
          background: "linear-gradient(135deg, #0F2744 0%, #1a3a5c 100%)",
        }}
      >
        <h3 className="text-sm font-semibold text-white">
          Need additional support?
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
          Tell us how we can help expand your engagement.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 space-y-4">
        {/* Service Type */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#0F2744" }}>
            I need help with...
          </label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
            style={{
              border: "1px solid #e5eaf0",
              color: serviceType ? "#0F2744" : "#9CA3AF",
              background: "#F8FAFB",
            }}
          >
            <option value="">Select a service area (optional)</option>
            {SERVICE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#0F2744" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError("");
            }}
            placeholder="Describe what you need support with..."
            rows={3}
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none resize-none"
            style={{
              border: "1px solid #e5eaf0",
              color: "#0F2744",
              background: "#F8FAFB",
            }}
          />
        </div>

        {/* Urgency Toggle */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: "#0F2744" }}>
            Urgency
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUrgency("normal")}
              className="flex-1 text-xs font-medium py-2 rounded-lg transition-colors"
              style={{
                background: urgency === "normal" ? "#0F2744" : "#F8FAFB",
                color: urgency === "normal" ? "#fff" : "#6B7280",
                border: `1px solid ${urgency === "normal" ? "#0F2744" : "#e5eaf0"}`,
              }}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setUrgency("urgent")}
              className="flex-1 text-xs font-medium py-2 rounded-lg transition-colors"
              style={{
                background: urgency === "urgent" ? "#D4AF37" : "#F8FAFB",
                color: urgency === "urgent" ? "#fff" : "#6B7280",
                border: `1px solid ${urgency === "urgent" ? "#D4AF37" : "#e5eaf0"}`,
              }}
            >
              Urgent
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full text-xs font-semibold py-2.5 rounded-lg transition-colors hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "#0F2744", color: "#fff" }}
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
