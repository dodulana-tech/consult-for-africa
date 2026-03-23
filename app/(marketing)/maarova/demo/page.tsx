"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const numberOfLeadersOptions = ["1-10", "10-30", "30-100", "100+"];
const streamInterestOptions = [
  "Recruitment Assessment",
  "Leadership Development",
  "Organisational Intelligence",
  "All Streams",
];
const timelineOptions = [
  "Immediate",
  "1-3 months",
  "3-6 months",
  "Just exploring",
];

const facts = [
  { value: "6", label: "Psychometric dimensions assessed in a single sitting" },
  { value: "<5 min", label: "From completed assessment to full leadership report" },
  { value: "90%", label: "12-month retention of Maarova-assessed hires" },
  { value: "142+", label: "Healthcare leaders assessed across Africa" },
];

/* ─── styles ──────────────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "rgba(255,255,255,0.6)",
  marginBottom: 6,
};

/* ─── component ───────────────────────────────────────────────────────────── */

export default function MaarovaDemoPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organisation: "",
    role: "",
    numberOfLeaders: "",
    streamInterest: "",
    timeline: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/maarova/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: "#0f1a2a", paddingTop: "5rem" }}
    >
      {/* Background effects */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(212,165,116,0.12) 0%, transparent 60%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 70% at 15% 70%, rgba(45,156,219,0.08) 0%, transparent 55%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* ── Left: Copy ─────────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-32">
            <Link
              href="/maarova"
              className="inline-flex items-center gap-2 text-xs mb-8 transition-colors"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <span aria-hidden="true">&larr;</span> Back to Maarova
            </Link>

            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#D4A574" }}
            >
              Book a Demo
            </p>

            <h1
              className="font-semibold text-white mb-6"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: 1.12 }}
            >
              See Maarova in action.
              <br />
              <span style={{ color: "rgba(255,255,255,0.4)" }}>
                Built for your context.
              </span>
            </h1>

            <p
              className="leading-relaxed mb-10 max-w-md"
              style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}
            >
              In 30 minutes, we will walk you through the full Maarova assessment
              suite, show you a sample leadership report, and discuss how it fits
              your organisation. No commitments, no generic slides.
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl p-5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    className="text-2xl font-bold mb-1"
                    style={{ color: "#D4A574" }}
                  >
                    {f.value}
                  </p>
                  <p
                    className="text-xs leading-snug"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {f.label}
                  </p>
                </div>
              ))}
            </div>

            <p
              className="mt-10 text-xs"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              Consult For Africa {"·"} Proprietary Technology {"·"} Built in
              Africa, for Africa
            </p>
          </div>

          {/* ── Right: Form ────────────────────────────────────────────────── */}
          <div>
            {status === "success" ? (
              <div
                className="rounded-2xl p-10 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: "rgba(16,185,129,0.15)" }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2
                  className="text-xl font-semibold text-white mb-3"
                >
                  Demo request received
                </h2>
                <p
                  className="mb-8 leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}
                >
                  Thank you for your interest in Maarova. A member of the CFA
                  team will be in touch within 24 hours to schedule your
                  personalised demo.
                </p>
                <Link
                  href="/maarova"
                  className="inline-block px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
                  style={{ background: "#D4A574", color: "#06090f" }}
                >
                  Back to Maarova
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl p-8 md:p-10 space-y-5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h2
                  className="font-semibold text-white mb-2"
                  style={{ fontSize: 20 }}
                >
                  Request your demo
                </h2>
                <p
                  className="text-sm mb-6"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Fields marked with * are required.
                </p>

                {/* Name */}
                <div>
                  <label style={labelStyle}>
                    Full Name <span style={{ color: "#D4A574" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Dr. Adeyemi Okonkwo"
                    style={inputStyle}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(212,165,116,0.4)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>
                    Work Email <span style={{ color: "#D4A574" }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@hospital.org"
                    style={inputStyle}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(212,165,116,0.4)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                  />
                </div>

                {/* Organisation */}
                <div>
                  <label style={labelStyle}>
                    Organisation <span style={{ color: "#D4A574" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.organisation}
                    onChange={(e) => update("organisation", e.target.value)}
                    placeholder="Lagos University Teaching Hospital"
                    style={inputStyle}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(212,165,116,0.4)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={labelStyle}>Your Role</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => update("role", e.target.value)}
                    placeholder="CEO, HR Director, CMO..."
                    style={inputStyle}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(212,165,116,0.4)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                  />
                </div>

                {/* Two-column row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Number of Leaders */}
                  <div>
                    <label style={labelStyle}>Number of Leaders</label>
                    <select
                      value={form.numberOfLeaders}
                      onChange={(e) => update("numberOfLeaders", e.target.value)}
                      style={{
                        ...inputStyle,
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                      }}
                    >
                      <option value="" style={{ background: "#0f1a2a" }}>
                        Select...
                      </option>
                      {numberOfLeadersOptions.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          style={{ background: "#0f1a2a" }}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Timeline */}
                  <div>
                    <label style={labelStyle}>Timeline</label>
                    <select
                      value={form.timeline}
                      onChange={(e) => update("timeline", e.target.value)}
                      style={{
                        ...inputStyle,
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                      }}
                    >
                      <option value="" style={{ background: "#0f1a2a" }}>
                        Select...
                      </option>
                      {timelineOptions.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          style={{ background: "#0f1a2a" }}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stream Interest */}
                <div>
                  <label style={labelStyle}>Stream of Interest</label>
                  <select
                    value={form.streamInterest}
                    onChange={(e) => update("streamInterest", e.target.value)}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 14px center",
                    }}
                  >
                    <option value="" style={{ background: "#0f1a2a" }}>
                      Select...
                    </option>
                    {streamInterestOptions.map((opt) => (
                      <option
                        key={opt}
                        value={opt}
                        style={{ background: "#0f1a2a" }}
                      >
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label style={labelStyle}>
                    Anything else we should know?
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="Tell us about your leadership challenges, goals, or questions..."
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: 100,
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(212,165,116,0.4)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                  />
                </div>

                {/* Error */}
                {status === "error" && (
                  <div
                    className="rounded-lg px-4 py-3 text-sm"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#FCA5A5",
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.01] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "#D4A574", color: "#06090f" }}
                >
                  {status === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="opacity-25"
                        />
                        <path
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          fill="currentColor"
                          className="opacity-75"
                        />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Book Your Demo"
                  )}
                </button>

                <p
                  className="text-center text-xs"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  We typically respond within 24 hours.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
