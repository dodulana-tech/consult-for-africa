import type { Metadata } from "next";
import Link from "next/link";
import MaarovaNav from "@/components/cfa/MaarovaNav";

export const metadata: Metadata = {
  title: "Organisational Intelligence | Maarova",
  description:
    "Enterprise subscription for hospital groups. Live leadership dashboards, succession risk analysis, culture diagnostics, and quarterly board reports.",
};

const dashboardFeatures = [
  {
    title: "Leadership Strength Map",
    desc: "Colour-coded heatmap showing capability levels across every assessed leader, broken down by department, location, and competency dimension.",
  },
  {
    title: "Flight Risk Indicators",
    desc: "Early warning system combining engagement scores, values misalignment, and EQ trends to flag leaders at risk of leaving before they hand in notice.",
  },
  {
    title: "Succession Pipeline",
    desc: "Visual pipeline showing readiness levels for every critical leadership role. Green, amber, red ratings with recommended development actions.",
  },
  {
    title: "Culture Health Score",
    desc: "Aggregate culture diagnostics across the organisation. Track shifts in team cohesion, psychological safety, and alignment with institutional values.",
  },
];

const steps = [
  {
    num: "01",
    title: "Assess 30+ Leaders",
    desc: "Roll out Maarova assessments across your leadership population. Full six-dimension profiling for every participant.",
  },
  {
    num: "02",
    title: "Maarova Generates Live Dashboards",
    desc: "Real-time analytics aggregate individual profiles into organisational intelligence. Heatmaps, risk scores, and capability gaps update automatically.",
  },
  {
    num: "03",
    title: "Quarterly Reports for Board",
    desc: "Board-ready leadership reports generated every quarter. Executive summaries, trend analysis, and strategic recommendations included.",
  },
  {
    num: "04",
    title: "Identify Gaps Before They Become Crises",
    desc: "Succession risks, culture erosion, and capability gaps surfaced proactively. Act on data, not surprises.",
  },
];

const audiences = [
  {
    title: "Hospital Groups",
    desc: "Multi-site hospital networks that need a unified view of leadership capability across all facilities. Compare sites, identify best practices, and standardise development.",
  },
  {
    title: "Health Systems",
    desc: "Integrated delivery networks managing hospitals, clinics, and specialised units. Enterprise-wide leadership intelligence for strategic workforce planning.",
  },
  {
    title: "Ministries of Health",
    desc: "Government health agencies responsible for leadership pipelines across public hospitals and primary health centres. National-level capability mapping.",
  },
  {
    title: "Private Equity Healthcare Portfolios",
    desc: "Investment firms with multiple healthcare assets. Assess leadership quality across portfolio companies. Identify management risk before it impacts returns.",
  },
];

export default function IntelligencePage() {
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
              "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(16,185,129,0.2) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 70% at 15% 70%, rgba(16,185,129,0.08) 0%, transparent 55%)",
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
                background: "rgba(16,185,129,0.15)",
                color: "#10B981",
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              Stream 3
            </span>
            <span
              className="text-xs tracking-wide"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Organisational Intelligence
            </span>
          </div>

          <h1
            className="font-semibold tracking-tight text-white"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              lineHeight: 1.08,
            }}
          >
            See your entire
            <br />
            <span style={{ color: "#10B981" }}>leadership landscape.</span>
          </h1>

          <p
            className="mt-6 leading-[1.7] max-w-2xl"
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.1rem)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Enterprise subscription for hospital groups. Assess your entire
            leadership population, generate live capability heatmaps, succession
            risk dashboards, culture diagnostics, and quarterly board reports.
            The strategic intelligence your board has been asking for.
          </p>

          <div className="mt-8">
            <Link
              href="/maarova/demo"
              className="inline-block px-7 py-3.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "#10B981", color: "#fff" }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU SEE ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#10B981" }}
            >
              What you see
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Real-time leadership intelligence at your fingertips
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Live Capability Heatmaps",
                desc: "Visual representation of leadership strength across your entire organisation. Filter by department, site, competency, or leadership level.",
              },
              {
                title: "Succession Risk Dashboards",
                desc: "Know which critical roles have ready successors and which are exposed. Red, amber, green ratings with recommended development actions.",
              },
              {
                title: "Culture Diagnostics",
                desc: "Aggregate culture health scores across teams and departments. Track trends over time and identify pockets of disengagement early.",
              },
              {
                title: "Quarterly Board Reports",
                desc: "Board-ready PDF reports generated automatically every quarter. Executive summaries, trend charts, and strategic recommendations.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#10B981" }}
            >
              How it works
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              From individual assessments to organisational intelligence
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
                  style={{ background: "#10B981" }}
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

      {/* ── DASHBOARD PREVIEW ────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#10B981" }}
            >
              Dashboard preview
            </p>
            <h2
              className="font-semibold text-gray-900 mb-4"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Your enterprise leadership command centre
            </h2>
            <p className="max-w-2xl mx-auto text-gray-500">
              A single view of your entire leadership population. Updated in
              real time as assessments are completed and coaching milestones are
              reached.
            </p>
          </div>

          {/* Mock dashboard */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #e5eaf0", background: "#F8FAFC" }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ background: "#fff", borderBottom: "1px solid #e5eaf0" }}
            >
              <div className="flex gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#EF4444" }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#F59E0B" }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#10B981" }}
                />
              </div>
              <div className="flex-1 mx-8">
                <div
                  className="rounded-md px-3 py-1 text-[10px] text-center"
                  style={{
                    background: "#fff",
                    color: "#94A3B8",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  maarova.consultforafrica.com/enterprise
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Stat row */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  {
                    label: "Leaders Assessed",
                    value: "147",
                    delta: "across 4 sites",
                    color: "#10B981",
                  },
                  {
                    label: "Succession Gaps",
                    value: "12",
                    delta: "3 critical roles",
                    color: "#EF4444",
                  },
                  {
                    label: "Avg EQ Score",
                    value: "6.9",
                    delta: "+0.5 vs 6 months ago",
                    color: "#2D9CDB",
                  },
                  {
                    label: "Culture Health",
                    value: "78%",
                    delta: "trending up",
                    color: "#D4A574",
                  },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="rounded-lg p-4"
                    style={{
                      background: "#fff",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <p
                      className="text-[10px] mb-1"
                      style={{ color: "#94A3B8" }}
                    >
                      {c.label}
                    </p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: c.color }}
                    >
                      {c.value}
                    </p>
                    <p
                      className="text-[9px] mt-0.5"
                      style={{ color: "#CBD5E1" }}
                    >
                      {c.delta}
                    </p>
                  </div>
                ))}
              </div>

              {/* Heatmap + pipeline */}
              <div className="grid grid-cols-3 gap-4">
                <div
                  className="col-span-2 rounded-lg p-4"
                  style={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <p
                    className="text-[10px] font-medium mb-3"
                    style={{ color: "#64748B" }}
                  >
                    Leadership Capability Heatmap
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const colors = [
                        "#10B981",
                        "#2D9CDB",
                        "#D4A574",
                        "#F59E0B",
                        "#EF4444",
                        "#7C3AED",
                      ];
                      const opacities = [0.2, 0.35, 0.5, 0.65, 0.8];
                      return (
                        <div
                          key={i}
                          className="h-5 rounded-sm"
                          style={{
                            background: colors[i % 6],
                            opacity: opacities[i % 5],
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-3">
                    {["EQ", "Values", "DISC", "CILTI", "360", "Culture"].map(
                      (d) => (
                        <span
                          key={d}
                          className="text-[8px]"
                          style={{ color: "#94A3B8" }}
                        >
                          {d}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div
                  className="rounded-lg p-4"
                  style={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <p
                    className="text-[10px] font-medium mb-3"
                    style={{ color: "#64748B" }}
                  >
                    Succession Pipeline
                  </p>
                  <div className="space-y-2">
                    {[
                      { role: "CMO", status: "Ready", color: "#10B981" },
                      { role: "CNO", status: "At Risk", color: "#EF4444" },
                      { role: "COO", status: "Developing", color: "#F59E0B" },
                      { role: "CFO", status: "Ready", color: "#10B981" },
                      { role: "Dept Head x3", status: "Gap", color: "#EF4444" },
                    ].map((r) => (
                      <div
                        key={r.role}
                        className="flex items-center justify-between"
                      >
                        <span
                          className="text-[9px] font-medium"
                          style={{ color: "#1E293B" }}
                        >
                          {r.role}
                        </span>
                        <span
                          className="text-[8px] font-semibold px-2 py-0.5 rounded"
                          style={{
                            color: r.color,
                            background: `${r.color}15`,
                          }}
                        >
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <p
                    className="text-[10px] font-medium mb-2"
                    style={{ color: "#64748B" }}
                  >
                    Flight Risk Monitor
                  </p>
                  <div className="flex items-end gap-1 h-12">
                    {[30, 45, 35, 65, 50, 75, 55, 85, 60, 40, 70, 90].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{
                            height: `${h}%`,
                            background:
                              h > 70
                                ? `rgba(239,68,68,${0.4 + i * 0.04})`
                                : `rgba(16,185,129,${0.3 + i * 0.04})`,
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <p
                    className="text-[10px] font-medium mb-2"
                    style={{ color: "#64748B" }}
                  >
                    Culture Health by Site
                  </p>
                  <div className="flex gap-3 items-end">
                    {[
                      { site: "Lagos", pct: 82, color: "#10B981" },
                      { site: "Abuja", pct: 71, color: "#F59E0B" },
                      { site: "PH", pct: 88, color: "#10B981" },
                      { site: "Ibadan", pct: 64, color: "#EF4444" },
                    ].map((s) => (
                      <div key={s.site} className="flex-1 text-center">
                        <div
                          className="h-10 rounded-md mb-1 flex items-end justify-center"
                          style={{ background: "#F1F5F9" }}
                        >
                          <div
                            className="w-full rounded-md"
                            style={{
                              height: `${s.pct}%`,
                              background: s.color,
                              opacity: 0.7,
                            }}
                          />
                        </div>
                        <p
                          className="text-[8px]"
                          style={{ color: "#94A3B8" }}
                        >
                          {s.site} {s.pct}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD FEATURES ───────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#F1F5F9" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#10B981" }}
            >
              Inside the dashboard
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Four pillars of organisational intelligence
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {dashboardFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#10B981" }}
            >
              Who it{"'"}s for
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Built for organisations managing leadership at scale
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {audiences.map((a) => (
              <div
                key={a.title}
                className="rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {a.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METRICS ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#10B981" }}
            >
              At a glance
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Enterprise-grade leadership intelligence
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                value: "Live",
                label: "Succession risk dashboard, updated in real time",
              },
              {
                value: "Quarterly",
                label: "Board-ready leadership reports, generated automatically",
              },
              {
                value: "30+",
                label: "Leaders assessed per organisation, minimum",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl p-8 text-center"
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #e5eaf0",
                }}
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

      <MaarovaNav current="/maarova/intelligence" />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ background: "#FAF8F5" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-5"
            style={{ color: "#10B981" }}
          >
            Ready to see the full picture?
          </p>
          <h2
            className="font-semibold text-gray-900 mb-5"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Your board wants answers.
            <br />
            <span className="text-gray-400">
              Give them intelligence.
            </span>
          </h2>
          <p className="mb-10 leading-relaxed max-w-lg mx-auto text-gray-500">
            See how Maarova organisational intelligence transforms scattered
            assessments into the strategic leadership data your board needs.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/maarova/demo"
              className="px-8 py-3.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "#10B981", color: "#fff" }}
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
            Consult for Africa {"·"} Maarova{"\u2122"} Organisational
            Intelligence
          </p>
        </div>
      </section>
    </main>
  );
}
