import type { Metadata } from "next";
import Link from "next/link";
import MaarovaNav from "@/components/cfa/MaarovaNav";

export const metadata: Metadata = {
  title: "The Assessment | Maarova - Six Dimensions of Healthcare Leadership",
  description:
    "Explore the six psychometric dimensions that make Maarova the most comprehensive healthcare leadership assessment built for Africa.",
};

/* -- data ------------------------------------------------------------------ */

const modules = [
  {
    num: "01",
    icon: "\u2666",
    name: "Behavioural Style",
    tagline: "How they lead",
    basis: "Based on the validated DISC framework, calibrated for African healthcare contexts.",
    measures: [
      "Communication patterns",
      "Decision-making approach",
      "Team dynamics",
      "Conflict style",
    ],
    output:
      "Behavioural style profile with healthcare-specific interpretation and team composition recommendations.",
    why: "Understanding how a leader communicates and makes decisions predicts team performance. Get this wrong, and even technically excellent clinicians struggle in leadership roles.",
    bg: "#fff",
  },
  {
    num: "02",
    icon: "\u2605",
    name: "Values and Drivers",
    tagline: "Why they lead",
    basis: "Measures intrinsic motivators, professional values, and organisational culture alignment.",
    measures: [
      "Intrinsic motivators",
      "Professional values",
      "Organisational culture alignment",
      "Engagement drivers",
    ],
    output:
      "Values profile showing what drives engagement and where misalignment risks exist.",
    why: "Values alignment is the strongest predictor of long-term retention. Mis-aligned leaders leave within 18 months regardless of compensation.",
    bg: "#FAF8F5",
  },
  {
    num: "03",
    icon: "\u2764",
    name: "Emotional Intelligence",
    tagline: "How they connect",
    basis: "Measures the core competencies that separate good managers from transformational leaders.",
    measures: [
      "Self-awareness",
      "Empathy",
      "Social skills",
      "Emotional regulation",
    ],
    output:
      "EQ profile with benchmarks against African healthcare leadership norms.",
    why: "The single strongest predictor of leadership effectiveness in clinical environments. Leaders with high EQ have 40% lower staff turnover in their teams.",
    bg: "#fff",
  },
  {
    num: "04",
    icon: "\u2191",
    name: "Clinical Leadership Transition Index (CILTI)",
    tagline: "Are they ready?",
    basis: "CFA's proprietary measure. No other tool does this.",
    measures: [
      "Clinical identity vs. leadership identity",
      "Readiness for leadership transition",
      "Areas of identity friction",
      "Coaching priority mapping",
    ],
    output:
      "CILTI score showing readiness for leadership, areas of identity friction, and transition coaching recommendations.",
    why: 'The number one reason clinical leaders fail is not competence. It is unresolved identity conflict between "I am a doctor" and "I am a leader."',
    bg: "#FAF8F5",
  },
  {
    num: "05",
    icon: "\u25CB",
    name: "360-Degree Feedback",
    tagline: "How others see them",
    basis: "Multi-rater feedback from peers, direct reports, and supervisors.",
    measures: [
      "Peer perception",
      "Direct report feedback",
      "Supervisor evaluation",
      "Self-perception gap analysis",
    ],
    output:
      "360 profile with gap analysis between self-perception and others' perception, benchmarked against our growing normative database of African healthcare leaders.",
    why: "Blind spots are invisible by definition. The 360 reveals what the leader cannot see about themselves.",
    bg: "#fff",
  },
  {
    num: "06",
    icon: "\u25A0",
    name: "Culture and Team Diagnostics",
    tagline: "How the org works",
    basis: "Maps the organisational system the leader operates within.",
    measures: [
      "Organisational culture mapping",
      "Team effectiveness scoring",
      "Engagement driver analysis",
      "System-level constraints",
    ],
    output:
      "Culture map, team health score, and engagement driver analysis.",
    why: "Individual leadership exists within a system. Understanding the system reveals what is enabling or constraining the leader.",
    bg: "#FAF8F5",
  },
];

/* -- component ------------------------------------------------------------- */

export default function MaarovaAssessmentPage() {
  return (
    <main>
      {/* ── BACK LINK ──────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5eaf0" }}>
        <div className="max-w-6xl mx-auto px-6 py-3">
          <Link
            href="/maarova"
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "#D4A574" }}
          >
            &larr; Back to Maarova
          </Link>
        </div>
      </div>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6" style={{ background: "#fff" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-5"
            style={{ color: "#D4A574" }}
          >
            The Maarova Assessment
          </p>
          <h1
            className="font-semibold text-gray-900"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1 }}
          >
            A complete picture of leadership.
          </h1>
          <p
            className="mt-6 leading-relaxed max-w-2xl mx-auto"
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
              color: "#64748B",
            }}
          >
            Six psychometric dimensions, calibrated for African healthcare.
            <br />
            Nothing else like it.
          </p>
        </div>
      </section>

      {/* ── OVERVIEW ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="font-semibold text-gray-900 mb-5"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
              >
                Six dimensions. One assessment. 60 minutes.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                Maarova combines six validated assessment dimensions into a
                single 60-minute online assessment. Each dimension provides
                unique insight into a different facet of leadership capacity.
              </p>
              <p className="text-gray-500 leading-relaxed">
                Together, they create the most comprehensive leadership profile
                available for healthcare leaders in Africa. No other tool
                combines all six. No other tool is calibrated for this context.
              </p>
            </div>

            {/* Quick visual summary */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "6", label: "Psychometric dimensions" },
                { value: "60 min", label: "Online assessment" },
                { value: "<5 min", label: "Report generation" },
                { value: "1", label: "Complete leadership profile" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-5 text-center"
                  style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                >
                  <p
                    className="text-2xl font-bold mb-1"
                    style={{ color: "#1A3A52" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE SIX MODULES ────────────────────────────────────────────── */}
      {modules.map((m) => (
        <section
          key={m.num}
          className="py-20 px-6"
          style={{ background: m.bg }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-12 gap-10 items-start">
              {/* Left: icon + number */}
              <div className="md:col-span-3">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{
                      background: "rgba(212,165,116,0.1)",
                      border: "1px solid rgba(212,165,116,0.15)",
                    }}
                    aria-hidden="true"
                  >
                    {m.icon}
                  </span>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: "#D4A574" }}
                  >
                    Module {m.num}
                  </span>
                </div>
                <h3
                  className="font-semibold text-gray-900"
                  style={{ fontSize: "1.35rem" }}
                >
                  {m.name}
                </h3>
                <p
                  className="text-sm font-medium mt-1"
                  style={{ color: "#D4A574" }}
                >
                  {m.tagline}
                </p>
              </div>

              {/* Right: detail */}
              <div className="md:col-span-9">
                <p className="text-gray-500 leading-relaxed mb-6">
                  {m.basis}
                </p>

                {/* Measures */}
                <div className="mb-6">
                  <p
                    className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3"
                    style={{ color: "#94A3B8" }}
                  >
                    What it measures
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {m.measures.map((measure) => (
                      <span
                        key={measure}
                        className="px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{
                          background: "#F1F5F9",
                          color: "#475569",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        {measure}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Output */}
                <div className="mb-6">
                  <p
                    className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3"
                    style={{ color: "#94A3B8" }}
                  >
                    Output
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {m.output}
                  </p>
                </div>

                {/* Why it matters */}
                <div
                  className="rounded-xl p-5"
                  style={{
                    background:
                      m.bg === "#fff"
                        ? "#FAF8F5"
                        : "#fff",
                    border: "1px solid #e5eaf0",
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-2"
                    style={{ color: "#D4A574" }}
                  >
                    Why it matters
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {m.why}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ── HOW THEY CONNECT ───────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#F1F5F9" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-4"
            style={{ color: "#D4A574" }}
          >
            The Full Picture
          </p>
          <h2
            className="font-semibold text-gray-900 mb-6"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
          >
            Six dimensions. One diagnostic view.
          </h2>
          <p className="text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            Each dimension tells you something no other dimension can. Behavioural
            Style shows how they lead. Values shows why. EQ shows how well they
            connect. CILTI shows whether they are ready. The 360 shows what they
            cannot see. Culture Diagnostics shows what the system is doing to them.
          </p>

          {/* Visual: six connected circles */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {modules.map((m) => (
              <div
                key={m.num}
                className="w-28 h-28 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <span className="text-xl mb-1" aria-hidden="true">
                  {m.icon}
                </span>
                <span
                  className="text-[10px] font-semibold text-center px-2 leading-tight"
                  style={{ color: "#1A3A52" }}
                >
                  {m.name.split("(")[0].trim()}
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold" style={{ color: "#1A3A52" }}>
            Alone, each dimension is useful. Together, they are diagnostic.
          </p>
        </div>
      </section>

      {/* ── THE REPORT ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p
                className="text-xs uppercase tracking-[0.25em] mb-4"
                style={{ color: "#D4A574" }}
              >
                The Report
              </p>
              <h2
                className="font-semibold text-gray-900 mb-5"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
              >
                A leadership profile in under 5 minutes.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Every assessment-taker receives a detailed leadership profile
                report generated in under 5 minutes. No waiting. No manual
                scoring. Science-backed insights, delivered instantly.
              </p>

              <div className="space-y-4">
                {[
                  "Scores across all six dimensions with visual breakdowns",
                  "Benchmark comparisons against African healthcare leadership norms",
                  "Personalised development recommendations",
                  "Coaching priorities ranked by impact",
                  "Strengths, risk areas, and blind spot analysis",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                      style={{ background: "#D4A574", color: "#fff" }}
                    >
                      &#10003;
                    </span>
                    <p className="text-sm text-gray-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Report mockup */}
            <div
              className="rounded-xl p-6 shadow-lg"
              style={{ background: "#F8FAFC", border: "1px solid #e5eaf0" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "#1A3A52", color: "#fff" }}
                >
                  M
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1A3A52" }}>
                    Maarova Leadership Profile
                  </p>
                  <p className="text-[10px]" style={{ color: "#94A3B8" }}>
                    Generated in 4 min 32 sec
                  </p>
                </div>
              </div>

              {/* Dimension scores */}
              <div className="space-y-3 mb-5">
                {[
                  { name: "Behavioural Style", score: 82, color: "#2D9CDB" },
                  { name: "Values & Drivers", score: 91, color: "#10B981" },
                  { name: "Emotional Intelligence", score: 74, color: "#D4A574" },
                  { name: "CILTI", score: 68, color: "#F59E0B" },
                  { name: "360 Feedback", score: 79, color: "#7C3AED" },
                  { name: "Culture & Team", score: 85, color: "#2D9CDB" },
                ].map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-medium" style={{ color: "#475569" }}>
                        {d.name}
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: d.color }}>
                        {d.score}
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${d.score}%`, background: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary box */}
              <div
                className="rounded-lg p-4"
                style={{ background: "#fff", border: "1px solid #E2E8F0" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#D4A574" }}>
                  Top Development Priority
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Clinical Leadership Transition: score indicates moderate identity
                  friction. Recommended 6-month coaching programme focused on
                  leadership identity formation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MaarovaNav current="/maarova/assessment" />

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-5"
            style={{ color: "#D4A574" }}
          >
            Ready to see it?
          </p>
          <h2
            className="font-semibold text-gray-900 mb-5"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            See Maarova in action.
          </h2>
          <p className="mb-10 leading-relaxed max-w-lg mx-auto text-gray-500">
            Book a walkthrough and see exactly how the assessment works, what the
            report looks like, and how it integrates with coaching and development
            programmes.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/maarova/demo"
              className="px-8 py-3.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "#D4A574", color: "#06090f" }}
            >
              Book a Demo
            </Link>
            <Link
              href="/maarova"
              className="px-8 py-3.5 rounded-lg text-sm font-semibold transition-all"
              style={{ border: "1px solid #CBD5E1", color: "#64748B" }}
            >
              Back to Maarova Overview
            </Link>
          </div>

          <p className="mt-10 text-xs text-gray-300">
            Consult for Africa {"\u00B7"} Proprietary Technology {"\u00B7"} Built
            in Africa, for Africa
          </p>
        </div>
      </section>
    </main>
  );
}
