import type { Metadata } from "next";
import Link from "next/link";
import MaarovaNav from "@/components/cfa/MaarovaNav";

export const metadata: Metadata = {
  title: "Recruitment Assessment | Maarova",
  description:
    "Screen every leadership candidate through psychometric assessment before they step into the role. Science-based hiring for healthcare leaders.",
};

const steps = [
  {
    num: "01",
    title: "Submit Candidates",
    desc: "Upload candidate profiles through the Maarova portal. No limit on the number of candidates per role.",
  },
  {
    num: "02",
    title: "60-Minute Assessment",
    desc: "Each candidate completes a structured psychometric assessment covering all six Maarova dimensions.",
  },
  {
    num: "03",
    title: "Comparison Report Generated",
    desc: "Maarova produces a side-by-side comparison report ranking candidates across every measured competency.",
  },
  {
    num: "04",
    title: "Structured Interview Guide",
    desc: "Receive a tailored interview guide with probing questions based on each candidate's specific profile gaps.",
  },
];

const deliverables = [
  {
    title: "Comparison Reports",
    desc: "Side-by-side candidate rankings across behavioural style, EQ, values alignment, and clinical leadership readiness.",
  },
  {
    title: "Predictive Success Indicators",
    desc: "Data-driven predictions on 12-month retention, cultural fit, and leadership transition readiness for each candidate.",
  },
  {
    title: "Structured Interview Guides",
    desc: "Custom question sets designed to probe the specific gaps and risks flagged in each candidate's Maarova profile.",
  },
  {
    title: "Cultural Fit Analysis",
    desc: "Detailed mapping of candidate values against your organisation's culture profile. Identifies alignment and friction points.",
  },
  {
    title: "Onboarding Recommendations",
    desc: "A personalised 90-day onboarding plan based on the candidate's assessed strengths, blind spots, and development needs.",
  },
];

const useCases = [
  {
    title: "CMO Recruitment",
    desc: "Your most consequential hire. Assess clinical credibility, strategic thinking, and board-readiness before you commit.",
  },
  {
    title: "Department Head Selection",
    desc: "Promote the right clinician into leadership. CILTI scores reveal who is ready for the transition and who needs more time.",
  },
  {
    title: "Nursing Leadership",
    desc: "Charge nurses and nurse managers set the tone for entire wards. Assess emotional intelligence, resilience, and team dynamics.",
  },
  {
    title: "Board Appointments",
    desc: "Non-executive and advisory board members assessed for strategic capability, governance orientation, and values alignment.",
  },
];

export default function RecruitmentPage() {
  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem", minHeight: "70svh" }}
      >
        <div className="absolute inset-0" style={{ background: "#0f1a2a" }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(45,156,219,0.25) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 70% at 15% 70%, rgba(45,156,219,0.1) 0%, transparent 55%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-24 md:pt-32 pb-16">
          <Link
            href="/maarova"
            className="inline-flex items-center gap-2 text-xs tracking-wide mb-10 transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <span aria-hidden="true">&larr;</span> Back to Maarova
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span
              className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{
                background: "rgba(45,156,219,0.15)",
                color: "#2D9CDB",
                border: "1px solid rgba(45,156,219,0.25)",
              }}
            >
              Stream 1
            </span>
            <span
              className="text-xs tracking-wide"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Recruitment Assessment
            </span>
          </div>

          <h1
            className="font-semibold tracking-tight text-white"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              lineHeight: 1.08,
            }}
          >
            Hire with science,
            <br />
            <span style={{ color: "#2D9CDB" }}>not gut feel.</span>
          </h1>

          <p
            className="mt-6 leading-[1.7] max-w-2xl"
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.1rem)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Screen every leadership candidate through psychometric assessment
            before they step into the role. Comparison reports, predictive
            indicators, and structured interview guides, all generated in
            minutes.
          </p>

          <div className="mt-8">
            <Link
              href="/maarova/demo"
              className="inline-block px-7 py-3.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "#2D9CDB", color: "#fff" }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="text-xs uppercase tracking-[0.25em] mb-4"
                style={{ color: "#2D9CDB" }}
              >
                The problem
              </p>
              <h2
                className="font-semibold text-gray-900 mb-5"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
              >
                Most healthcare orgs hire leaders based on clinical reputation
                and interviews alone.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                A brilliant surgeon does not automatically make a brilliant CMO.
                A respected nurse does not automatically manage a department.
                Yet across Africa, the default path to leadership is clinical
                excellence plus seniority. No assessment. No data. No science.
              </p>
              <p className="text-gray-500 leading-relaxed">
                The result? One in three leadership hires fails within 18
                months. The cost is not just financial. It destabilises teams,
                erodes trust, and pushes good people out the door.
                <span className="font-semibold text-gray-900">
                  {" "}
                  There is a better way.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  value: "33%",
                  label:
                    "of leadership hires fail within 18 months without structured assessment",
                  color: "#DC2626",
                },
                {
                  value: "2.5x",
                  label: "cost of a mis-hire versus getting it right the first time",
                  color: "#D97706",
                },
                {
                  value: "78%",
                  label:
                    "of hospitals rely on interviews alone for leadership selection",
                  color: "#7C3AED",
                },
                {
                  value: "6 mo",
                  label:
                    "average time to realise a leadership hire is not working out",
                  color: "#0B3C5D",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-5"
                  style={{ background: "#F8FAFC", border: "1px solid #e5eaf0" }}
                >
                  <p
                    className="text-3xl font-bold mb-2"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-500 leading-snug">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#2D9CDB" }}
            >
              How it works
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Four steps from candidate to confident hire
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {steps.map((s) => (
              <div
                key={s.num}
                className="rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-sm font-bold text-white"
                  style={{ background: "#2D9CDB" }}
                >
                  {s.num}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">
                  {s.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#2D9CDB" }}
            >
              What you get
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Everything you need to make the right call
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {deliverables.map((d) => (
              <div
                key={d.title}
                className="rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <h3 className="font-semibold text-gray-900 text-sm mb-2">
                  {d.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METRICS ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#F1F5F9" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#2D9CDB" }}
            >
              Results
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              The numbers speak for themselves
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                value: "90%",
                label: "12-month retention of Maarova-assessed hires",
              },
              { value: "<5 min", label: "Report generation time" },
              { value: "33%", label: "Reduction in mis-hires" },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl p-8 text-center"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <p
                  className="text-4xl font-bold mb-3"
                  style={{ color: "#1A3A52" }}
                >
                  {m.value}
                </p>
                <p className="text-sm text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#2D9CDB" }}
            >
              Use cases
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Where recruitment assessment makes the biggest impact
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className="rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {uc.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {uc.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MaarovaNav current="/maarova/recruitment" />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ background: "#fff" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-5"
            style={{ color: "#2D9CDB" }}
          >
            Ready to hire differently?
          </p>
          <h2
            className="font-semibold text-gray-900 mb-5"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Stop gambling on your
            <br />
            <span className="text-gray-400">most important hires.</span>
          </h2>
          <p className="mb-10 leading-relaxed max-w-lg mx-auto text-gray-500">
            See how Maarova recruitment assessment gives you the data to hire
            with confidence, every time.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/maarova/demo"
              className="px-8 py-3.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "#2D9CDB", color: "#fff" }}
            >
              Book a Demo
            </Link>
            <Link
              href="/maarova"
              className="px-8 py-3.5 rounded-lg text-sm font-semibold transition-all"
              style={{ border: "1px solid #CBD5E1", color: "#64748B" }}
            >
              Back to Maarova
            </Link>
          </div>

          <p className="mt-10 text-xs text-gray-300">
            Consult for Africa {"·"} Maarova{"\u2122"} Recruitment Assessment
          </p>
        </div>
      </section>
    </main>
  );
}
