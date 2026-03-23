import type { Metadata } from "next";
import Link from "next/link";
import MaarovaNav from "@/components/cfa/MaarovaNav";

export const metadata: Metadata = {
  title: "Healthcare HR Services | Maarova by CFA",
  description:
    "Nine specialised HR service lines for healthcare organisations. From recruitment to retention, powered by Maarova psychometric intelligence.",
};

/* -- data ------------------------------------------------------------------ */

type ServiceTag = "Flagship" | "Maarova-powered" | "Consulting";

interface Service {
  num: string;
  tag: ServiceTag;
  title: string;
  description: string;
  includes: string[];
}

const tagColors: Record<ServiceTag, { bg: string; text: string; border: string }> = {
  Flagship: {
    bg: "rgba(212,165,116,0.12)",
    text: "#D4A574",
    border: "rgba(212,165,116,0.25)",
  },
  "Maarova-powered": {
    bg: "rgba(26,58,82,0.08)",
    text: "#1A3A52",
    border: "rgba(26,58,82,0.15)",
  },
  Consulting: {
    bg: "rgba(100,116,139,0.08)",
    text: "#64748B",
    border: "rgba(100,116,139,0.15)",
  },
};

const services: Service[] = [
  {
    num: "01",
    tag: "Flagship",
    title: "Leadership Development & Succession",
    description:
      "Full Maarova assessment suite, ICF-certified coaches, 6 to 18 month development programmes. Build leaders who stay and perform.",
    includes: [
      "Baseline assessment",
      "Coach matching",
      "Milestone tracking",
      "Re-assessment",
      "Succession planning",
    ],
  },
  {
    num: "02",
    tag: "Maarova-powered",
    title: "Physician & Nurse Retention",
    description:
      "Identifies flight risks before they resign. Retention coaching for high-performers at risk of leaving.",
    includes: [
      "Flight risk scoring",
      "Stay interviews design",
      "Retention coaching",
      "Exit analysis",
    ],
  },
  {
    num: "03",
    tag: "Maarova-powered",
    title: "Strategic Workforce Planning",
    description:
      "Maarova capability mapping shows leadership strength and gaps. Build 3 to 5 year workforce plans grounded in data.",
    includes: [
      "Capability heatmap",
      "Gap analysis",
      "Workforce model",
      "Recruitment roadmap",
    ],
  },
  {
    num: "04",
    tag: "Maarova-powered",
    title: "Executive Search & Selection",
    description:
      "Every finalist assessed through Maarova. Side-by-side comparison reports so you hire with science, not gut feel.",
    includes: [
      "Role profiling",
      "Candidate assessment",
      "Comparison reports",
      "Structured interview guides",
    ],
  },
  {
    num: "05",
    tag: "Consulting",
    title: "Compensation & Benefits",
    description:
      "Market benchmarking, pay equity analysis, total rewards design. Know exactly where you stand and where to invest.",
    includes: [
      "Market survey",
      "Pay equity audit",
      "Total rewards strategy",
      "Implementation support",
    ],
  },
  {
    num: "06",
    tag: "Maarova-powered",
    title: "HR Infrastructure Build",
    description:
      "50+ HR policies, HRIS implementation, and Maarova integration. From zero to professional in 12 to 20 weeks.",
    includes: [
      "Policy library",
      "HRIS setup",
      "Maarova integration",
      "Training",
    ],
  },
  {
    num: "07",
    tag: "Maarova-powered",
    title: "Performance Management",
    description:
      "KPIs for every clinical role. Maarova 360 feedback replaces manual reviews with data-driven development conversations.",
    includes: [
      "KPI framework",
      "360 feedback system",
      "Coaching protocols",
      "Calibration sessions",
    ],
  },
  {
    num: "08",
    tag: "Maarova-powered",
    title: "Employee Engagement & Culture",
    description:
      "Culture diagnostics plus engagement surveys. Identify what drives your people and what is pushing them away.",
    includes: [
      "Culture assessment",
      "Engagement survey",
      "Action planning",
      "Quarterly pulse checks",
    ],
  },
  {
    num: "09",
    tag: "Consulting",
    title: "HR Compliance & Risk",
    description:
      "Labour law, licensing, contracts, payroll compliance. Identify violations before they become exposure.",
    includes: [
      "Compliance audit",
      "Risk register",
      "Remediation plan",
      "Staff training",
    ],
  },
];

/* -- component ------------------------------------------------------------- */

export default function MaarovaServicesPage() {
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
            Healthcare HR Services
          </p>
          <h1
            className="font-semibold text-gray-900"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1 }}
          >
            Nine service lines.{" "}
            <span style={{ color: "#D4A574" }}>One practice.</span>
          </h1>
          <p
            className="mt-6 leading-relaxed max-w-2xl mx-auto"
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
              color: "#64748B",
            }}
          >
            Full-spectrum healthcare HR, powered by Maarova psychometric
            intelligence. From recruitment to retention, every service line is
            built for the realities of African healthcare.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {(["Flagship", "Maarova-powered", "Consulting"] as ServiceTag[]).map((tag) => {
              const c = tagColors[tag];
              return (
                <span
                  key={tag}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SERVICE GRID ───────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => {
              const c = tagColors[s.tag];
              return (
                <div
                  key={s.num}
                  className="rounded-2xl p-7 flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: "#CBD5E1" }}
                    >
                      {s.num}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em]"
                      style={{
                        background: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      {s.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="font-semibold text-gray-900 mb-3"
                    style={{ fontSize: "1.1rem", lineHeight: 1.3 }}
                  >
                    {s.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-500 leading-relaxed mb-5 flex-1">
                    {s.description}
                  </p>

                  {/* Includes */}
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3"
                      style={{ color: "#94A3B8" }}
                    >
                      What{"'"}s included
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.includes.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium"
                          style={{
                            background: "#F1F5F9",
                            color: "#475569",
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#fff" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#D4A574" }}
            >
              The CFA Difference
            </p>
            <h2
              className="font-semibold text-gray-900 mb-4"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
            >
              Consulting + Technology. Not one or the other.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Every service line is backed by Maarova psychometric data where it
              matters and CFA consulting expertise throughout. You get the
              intelligence and the people who know how to act on it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                num: "1",
                label: "Assess",
                desc: "Maarova surfaces the data. Leadership profiles, flight risk scores, capability heatmaps, culture diagnostics.",
              },
              {
                num: "2",
                label: "Advise",
                desc: "CFA consultants interpret the data and build actionable strategies tailored to your organisation.",
              },
              {
                num: "3",
                label: "Implement",
                desc: "We stay through execution. Coaching, policy rollout, HRIS setup, compliance remediation. End to end.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-xl p-6 text-center"
                style={{ background: "#FAF8F5", border: "1px solid #e5eaf0" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold"
                  style={{ background: "#1A3A52", color: "#fff" }}
                >
                  {step.num}
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-2">
                  {step.label}
                </p>
                <p className="text-xs leading-relaxed text-gray-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICE COVERAGE ───────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p
                className="text-xs uppercase tracking-[0.25em] mb-4"
                style={{ color: "#D4A574" }}
              >
                Full Spectrum
              </p>
              <h2
                className="font-semibold text-gray-900 mb-5"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
              >
                One practice covers the entire employee lifecycle.
              </h2>
              <p className="text-gray-500 leading-relaxed">
                Most HR consultancies do one or two things well. We built nine
                service lines because healthcare organisations need a partner who
                can handle the full lifecycle: attract, select, onboard, develop,
                retain, and plan for succession. Every service line connects.
                Every data point feeds the next.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "9", label: "Service lines" },
                { value: "50+", label: "HR policies" },
                { value: "6", label: "Assessment dimensions" },
                { value: "ICF", label: "Certified coaches" },
                { value: "12 wk", label: "Fastest build" },
                { value: "360\u00B0", label: "Feedback system" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-4 text-center"
                  style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                >
                  <p
                    className="text-xl font-bold mb-1"
                    style={{ color: "#1A3A52" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MaarovaNav current="/maarova/services" />

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-5"
            style={{ color: "#D4A574" }}
          >
            Ready to start?
          </p>
          <h2
            className="font-semibold text-gray-900 mb-5"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Your workforce strategy starts here.
          </h2>
          <p className="mb-10 leading-relaxed max-w-lg mx-auto text-gray-500">
            Book a consultation and we will map the right combination of service
            lines to your organisation, your budget, and your timeline.
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
            Consult For Africa {"\u00B7"} Proprietary Technology {"\u00B7"} Built
            in Africa, for Africa
          </p>
        </div>
      </section>
    </main>
  );
}
