"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Stethoscope, Plane, BookOpen, ArrowRight } from "lucide-react";

type Location = "IN_NIGERIA" | "DIASPORA" | "STEPPED_BACK";

interface Choice {
  id: Location;
  title: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
}

const CHOICES: Choice[] = [
  {
    id: "IN_NIGERIA",
    title: "I am practising in Nigeria",
    description: "Clinical work, teaching, hospital management or private practice based in Nigeria.",
    detail: "You will see salary and locum benchmarks, role openings at named facilities, and the public hospital review feed.",
    icon: <Stethoscope className="h-5 w-5" />,
  },
  {
    id: "DIASPORA",
    title: "I am practising abroad",
    description: "Currently working in the UK, US, Canada, Gulf, or anywhere outside Nigeria.",
    detail: "You will see visiting consultant slots at named Nigerian institutions, advisory and visiting faculty appointments, and a quiet feed of policy and standards work you can contribute to without leaving your post.",
    icon: <Plane className="h-5 w-5" />,
  },
  {
    id: "STEPPED_BACK",
    title: "I have stepped back from full-time clinical work",
    description: "Retired, semi-retired, or shifted into teaching, advisory or board work.",
    detail: "You will see mentorship requests from junior colleagues, advisory board invitations, optional case-review panels, and the senior fellows convening.",
    icon: <BookOpen className="h-5 w-5" />,
  },
];

export function WhereClient({ professionalId }: { professionalId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Location | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/cadre/practice-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId, location: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save your selection");
        setSubmitting(false);
        return;
      }
      router.push(data.next ?? "/oncadre/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-7">
      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm text-red-700" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          {error}
        </div>
      )}

      <div className="space-y-3">
        {CHOICES.map((choice) => {
          const isActive = selected === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => setSelected(choice.id)}
              className="block w-full rounded-xl border p-5 text-left transition"
              style={{
                borderColor: isActive ? "#0B3C5D" : "#E8EBF0",
                background: isActive ? "rgba(11,60,93,0.03)" : "#FFFFFF",
                boxShadow: isActive ? "0 0 0 2px rgba(11,60,93,0.08)" : "none",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: isActive ? "#0B3C5D" : "rgba(11,60,93,0.06)",
                    color: isActive ? "#FFFFFF" : "#0B3C5D",
                  }}
                >
                  {choice.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold" style={{ color: "#0F2744" }}>
                    {choice.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{choice.description}</p>
                  {isActive && (
                    <p className="mt-2.5 text-xs leading-relaxed text-gray-700">{choice.detail}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected || submitting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold text-white transition disabled:opacity-40"
        style={{
          background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
          boxShadow: "0 2px 8px rgba(11,60,93,0.25)",
          minHeight: "48px",
        }}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {submitting ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
