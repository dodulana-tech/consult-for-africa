"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Clock,
  FileText,
  MessageSquare,
  Zap,
  Video,
  Shield,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Wifi,
} from "lucide-react";

const PARTS = [
  {
    icon: FileText,
    title: "Part 1: Scenario Response",
    duration: "15 minutes",
    description:
      "You will receive a real-world consulting scenario based on your specialty. Write a structured response explaining your approach.",
  },
  {
    icon: MessageSquare,
    title: "Part 2: Experience Deep-Dive",
    duration: "15 minutes (5 min each)",
    description:
      "Three questions about your past experience. Each question has a 5-minute window.",
  },
  {
    icon: Zap,
    title: "Part 3: Quick-Fire",
    duration: "10 minutes (60 sec each)",
    description:
      "Ten short questions, one minute each. Tests your instincts and speed of thought. You cannot go back.",
  },
  {
    icon: Video,
    title: "Part 4: Video Response",
    duration: "5 minutes",
    description:
      "Record a 2-minute video summarising your approach to the scenario from Part 1. Camera and microphone required.",
  },
];

export default function AssessmentIntroPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [monitoringAcknowledged, setMonitoringAcknowledged] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  async function handleStart() {
    if (!monitoringAcknowledged || !cameraReady) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/consultant-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to create assessment session. Please try again.");
        return;
      }

      const { id } = await res.json();
      router.push(`/onboarding/assessment?id=${id}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: "#EFF6FF", color: "#0F2744" }}
          >
            <Shield size={12} />
            Proctored Assessment
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F2744" }}>
            Consultant Skills Assessment
          </h1>
          <p className="text-gray-500 leading-relaxed">
            This assessment evaluates your consulting expertise through scenario-based questions,
            experience review, rapid-fire responses, and a short video. It typically takes
            around 45 minutes.
          </p>
        </div>

        {/* Parts breakdown */}
        <div className="space-y-3 mb-8">
          {PARTS.map((part, i) => {
            const Icon = part.icon;
            return (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#0F2744" }}
                >
                  <Icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                      {part.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{part.duration}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{part.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Integrity notice */}
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 mb-1">
                Integrity Monitoring
              </h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                This assessment monitors tab switching and paste events to ensure authenticity.
                Please close other tabs and do not use external tools such as AI assistants or
                search engines during the assessment. Your responses should reflect your own
                knowledge and experience.
              </p>
            </div>
          </div>
        </div>

        {/* Data usage note */}
        <div
          className="rounded-xl p-4 mb-6 flex items-start gap-3"
          style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
        >
          <Wifi size={16} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-600">
              <strong>Data usage:</strong> The video portion uses approximately 20MB of data.
              Ensure you have a stable internet connection before starting.
            </p>
          </div>
        </div>

        {/* Time window note */}
        <div
          className="rounded-xl p-4 mb-8 flex items-start gap-3"
          style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
        >
          <Clock size={16} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-600">
              <strong>48-hour window:</strong> Once you start the assessment, you have 48 hours
              to complete it. You can close the browser and resume where you left off within
              that window.
            </p>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={monitoringAcknowledged}
              onChange={(e) => setMonitoringAcknowledged(e.target.checked)}
              className="mt-0.5 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              I understand this assessment is monitored for integrity and I will not use
              external tools or assistance
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cameraReady}
              onChange={(e) => setCameraReady(e.target.checked)}
              className="mt-0.5 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              I have a working camera and microphone for the video response
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!monitoringAcknowledged || !cameraReady || loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#0F2744", color: "#fff" }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating assessment session...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Start Assessment
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          By clicking Start Assessment, you confirm you have read and understood the above.
        </p>
      </div>
    </div>
  );
}
