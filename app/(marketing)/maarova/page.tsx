import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Maarova\u2122 | CFA Leadership Assessment Platform",
  description:
    "Africa\u2019s first psychometric assessment platform built for healthcare leaders. Proprietary technology by Consult for Africa.",
};

/* ─── data ────────────────────────────────────────────────────────────────── */

const modules = [
  {
    num: "01",
    name: "Behavioural Style",
    short: "How they lead",
    desc: "Communication patterns, decision-making approach, and team dynamics using a validated DISC-based framework calibrated for African healthcare.",
    icon: "\u2666",
  },
  {
    num: "02",
    name: "Values & Drivers",
    short: "Why they lead",
    desc: "Intrinsic motivators, professional values, and alignment with organisational culture. Predicts long-term engagement and fit.",
    icon: "\u2605",
  },
  {
    num: "03",
    name: "Emotional Intelligence",
    short: "How they connect",
    desc: "Self-awareness, empathy, social skills. The strongest single predictor of leadership effectiveness in clinical environments.",
    icon: "\u2764",
  },
  {
    num: "04",
    name: "Clinical Leadership Transition",
    short: "Are they ready?",
    desc: "Our proprietary CILTI measure. Assesses the critical shift from clinical identity to leadership identity. No other tool does this.",
    icon: "\u2191",
  },
  {
    num: "05",
    name: "360-Degree Feedback",
    short: "How others see them",
    desc: "Multi-rater feedback from peers, reports, supervisors. Benchmarked against our growing normative database of African healthcare leaders.",
    icon: "\u25CB",
  },
  {
    num: "06",
    name: "Culture & Team Diagnostics",
    short: "How the org works",
    desc: "Map culture, score team effectiveness, identify engagement drivers. From individual insight to full organisational intelligence.",
    icon: "\u25A0",
  },
];

const journey = [
  { step: "1", label: "Assess", desc: "60-minute online assessment across 6 dimensions" },
  { step: "2", label: "Report", desc: "Detailed leadership profile generated in under 5 minutes" },
  { step: "3", label: "Match", desc: "Paired with an ICF-certified coach from our African network" },
  { step: "4", label: "Develop", desc: "6 to 12 months of structured coaching with milestone tracking" },
  { step: "5", label: "Measure", desc: "Re-assessment to quantify growth and ROI" },
];

const streams = [
  {
    label: "Recruitment Assessment",
    headline: "Hire with science, not gut feel.",
    body: "Screen every leadership candidate through Maarova before they step into the role. Get side-by-side comparison reports, structured interview guides, and predictive success indicators. Stop gambling on your most important hires.",
    accent: "#2D9CDB",
    metrics: [
      { value: "90%", sub: "12-month retention of Maarova-assessed hires" },
      { value: "<5 min", sub: "Report generation time" },
      { value: "33%", sub: "Reduction in mis-hires" },
    ],
  },
  {
    label: "Leadership Development",
    headline: "Assess. Coach. Measure. Repeat.",
    body: "Every leader gets a personalised development roadmap built from their Maarova profile. Matched with an ICF-certified coach who has walked in their shoes. Progress tracked, results measured, improvement quantified.",
    accent: "#D4A574",
    metrics: [
      { value: "+0.8 pt", sub: "Average EQ improvement at 6 months" },
      { value: "3 tiers", sub: "Frontline, Middle, Executive programmes" },
      { value: "92%", sub: "Coaching session attendance" },
    ],
  },
  {
    label: "Organisational Intelligence",
    headline: "See your entire leadership landscape.",
    body: "Enterprise subscription for hospital groups. Assess 30+ leaders, generate live capability heatmaps, succession risk dashboards, culture diagnostics, and quarterly board reports. The strategic intelligence your board has been asking for.",
    accent: "#10B981",
    metrics: [
      { value: "Live", sub: "Succession risk dashboard" },
      { value: "Quarterly", sub: "Board-ready leadership reports" },
      { value: "30+", sub: "Leaders assessed per organisation" },
    ],
  },
];

/* ─── component ───────────────────────────────────────────────────────────── */

export default function MaarovaPage() {
  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem", minHeight: "80svh" }}
      >
        {/* Layered background */}
        <div className="absolute inset-0" style={{ background: "#0f1a2a" }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(212,165,116,0.25) 0%, transparent 60%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 50% 70% at 15% 70%, rgba(45,156,219,0.15) 0%, transparent 55%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(circle at 50% 110%, rgba(16,185,129,0.1) 0%, transparent 50%)",
        }} />

        {/* Grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.028]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }} />

        {/* Floating grid lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" preserveAspectRatio="none" viewBox="0 0 100 100">
          {[20, 40, 60, 80].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#fff" strokeWidth="0.15" />
          ))}
          {[25, 50, 75].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#fff" strokeWidth="0.15" />
          ))}
        </svg>

        <div className="relative max-w-7xl mx-auto px-6 pt-24 md:pt-32 pb-10">
          {/* Top content row */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ background: "rgba(212,165,116,0.15)", color: "#D4A574", border: "1px solid rgba(212,165,116,0.2)" }}>
                  CFA Proprietary
                </span>
                <span className="text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Maarova{"\u2122"} Platform
                </span>
              </div>

              <h1
                className="font-semibold tracking-tight text-white"
                style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)", lineHeight: 1.08 }}
              >
                Assess, develop, and retain{" "}
                <span style={{ color: "#D4A574" }}>Africa{"'"}s healthcare leaders.</span>
              </h1>

              <p
                className="mt-6 leading-[1.7]"
                style={{ fontSize: "clamp(1rem, 1.4vw, 1.1rem)", color: "rgba(255,255,255,0.5)" }}
              >
                Psychometric science meets African healthcare.
                <br />
                Built by CFA. Nothing else like it.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/#contact"
                  className="px-7 py-3.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{ background: "#D4A574", color: "#06090f" }}
                >
                  Book a Demo
                </Link>
                <a
                  href="#journey"
                  className="px-7 py-3.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }}
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right: platform mockup (light mode) */}
            <div className="relative hidden md:block">
              {/* Browser chrome */}
              <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#fff" }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#EF4444" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F59E0B" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10B981" }} />
                  </div>
                  <div className="flex-1 mx-8">
                    <div className="rounded-md px-3 py-1 text-[10px] text-center" style={{ background: "#fff", color: "#94A3B8", border: "1px solid #E2E8F0" }}>
                      maarova.consultforafrica.com/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard mockup */}
                <div className="p-5 space-y-4" style={{ background: "#fff" }}>
                  {/* Top bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo-cfa.png" alt="CFA" style={{ height: 20, width: "auto", objectFit: "contain" }} />
                      <span className="text-xs font-semibold" style={{ color: "#1A3A52" }}>Maarova</span>
                      <span className="text-[10px]" style={{ color: "#94A3B8" }}>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-2 rounded" style={{ background: "#E2E8F0" }} />
                      <div className="w-6 h-6 rounded-full" style={{ background: "#DBEAFE" }} />
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Leaders Assessed", value: "142", delta: "+12 this month", color: "#D4A574" },
                      { label: "Avg EQ Score", value: "6.8", delta: "+0.4 vs baseline", color: "#2D9CDB" },
                      { label: "Coaching Active", value: "38", delta: "92% attendance", color: "#10B981" },
                      { label: "Flight Risk", value: "7", delta: "3 critical", color: "#EF4444" },
                    ].map((c) => (
                      <div key={c.label} className="rounded-lg p-3" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
                        <p className="text-[9px] mb-1" style={{ color: "#94A3B8" }}>{c.label}</p>
                        <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
                        <p className="text-[8px] mt-0.5" style={{ color: "#CBD5E1" }}>{c.delta}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart area + sidebar */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Leadership heatmap mock */}
                    <div className="col-span-2 rounded-lg p-3" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
                      <p className="text-[9px] font-medium mb-3" style={{ color: "#64748B" }}>Leadership Capability Heatmap</p>
                      <div className="grid grid-cols-6 gap-1">
                        {Array.from({ length: 24 }).map((_, i) => {
                          const colors = ["#10B981", "#2D9CDB", "#D4A574", "#F59E0B", "#EF4444", "#7C3AED"];
                          const opacities = [0.25, 0.4, 0.55, 0.7, 0.85];
                          return (
                            <div
                              key={i}
                              className="h-5 rounded-sm"
                              style={{ background: colors[i % 6], opacity: opacities[i % 5] }}
                            />
                          );
                        })}
                      </div>
                      <div className="flex gap-3 mt-2">
                        {["EQ", "Values", "DISC", "CILTI", "360", "Culture"].map((d) => (
                          <span key={d} className="text-[7px]" style={{ color: "#94A3B8" }}>{d}</span>
                        ))}
                      </div>
                    </div>

                    {/* Recent assessments */}
                    <div className="rounded-lg p-3" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
                      <p className="text-[9px] font-medium mb-2" style={{ color: "#64748B" }}>Recent Assessments</p>
                      <div className="space-y-2">
                        {[
                          { name: "Dr. Adeyemi", role: "CMO", score: 84 },
                          { name: "N. Okafor", role: "Nurse Mgr", score: 71 },
                          { name: "Dr. Ibrahim", role: "Dept Head", score: 92 },
                          { name: "F. Mwangi", role: "COO", score: 78 },
                        ].map((a) => (
                          <div key={a.name} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ background: "#DBEAFE" }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[8px] font-medium truncate" style={{ color: "#1E293B" }}>{a.name}</p>
                              <p className="text-[7px]" style={{ color: "#94A3B8" }}>{a.role}</p>
                            </div>
                            <span className="text-[9px] font-bold" style={{ color: a.score >= 80 ? "#10B981" : "#D4A574" }}>
                              {a.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
                      <p className="text-[9px] font-medium mb-2" style={{ color: "#64748B" }}>Coaching Pipeline</p>
                      <div className="flex items-end gap-1 h-10">
                        {[35, 55, 40, 70, 60, 80, 65, 90, 75, 85, 95, 88].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: `rgba(212,165,116,${0.3 + i * 0.055})` }} />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
                      <p className="text-[9px] font-medium mb-2" style={{ color: "#64748B" }}>Succession Risk</p>
                      <div className="flex gap-2 items-center">
                        {[
                          { label: "Low", pct: 62, color: "#10B981" },
                          { label: "Med", pct: 28, color: "#F59E0B" },
                          { label: "High", pct: 10, color: "#EF4444" },
                        ].map((r) => (
                          <div key={r.label} className="flex-1 text-center">
                            <div className="h-8 rounded-md mb-1 flex items-end justify-center" style={{ background: "#F1F5F9" }}>
                              <div className="w-full rounded-md" style={{ height: `${r.pct}%`, background: r.color, opacity: 0.8 }} />
                            </div>
                            <p className="text-[7px]" style={{ color: "#94A3B8" }}>{r.label} {r.pct}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow behind mockup */}
              <div className="absolute -inset-6 -z-10 rounded-3xl" style={{
                background: "radial-gradient(ellipse at center, rgba(212,165,116,0.08) 0%, transparent 70%)",
              }} />
            </div>
          </div>

          {/* Trust line */}
          <p className="mt-14 text-xs tracking-wide text-center md:text-left" style={{ color: "rgba(255,255,255,0.2)" }}>
            Built by Africans, for Africa {"·"} Proprietary technology by Consult for Africa
          </p>
        </div>
      </section>

      {/* ── PROBLEM (compact, punchy) ────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: narrative */}
            <div>
              <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4A574" }}>
                The workforce crisis
              </p>
              <h2 className="font-semibold text-gray-900 mb-5" style={{ fontSize: "clamp(1.5rem,3vw,2rem)" }}>
                Your people are leaving.
                <br />
                Your leaders aren{"'"}t ready.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                4,193 doctors left Nigeria in 2024 alone. Nurse retention
                across Sub-Saharan Africa sits at 53%. The people you trained,
                mentored, and invested in are walking out the door. And the ones
                staying? Many just got promoted into leadership roles nobody
                prepared them for.
              </p>
              <p className="text-gray-500 leading-relaxed">
                Western assessment tools weren{"'"}t built for this context.
                They miss the cultural dynamics, the clinical-to-leadership
                transition, and the realities of running a ward with half
                the staff you need.
                <span className="font-semibold text-gray-900"> So we built something that actually works here.</span>
              </p>
            </div>

            {/* Right: stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "4,193", label: "Doctors left Nigeria in 2024 alone. A 200% surge.", color: "#DC2626" },
                { value: "53%", label: "Nurse retention rate in Sub-Saharan Africa", color: "#D97706" },
                { value: "3.8", label: "Doctors per 10,000 people. WHO says you need 17.", color: "#7C3AED" },
                { value: "$2B", label: "Lost annually across Africa to healthcare brain drain", color: "#0B3C5D" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-5"
                  style={{ background: "#F8FAFC", border: "1px solid #e5eaf0" }}
                >
                  <p className="text-3xl font-bold mb-2" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-500 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── JOURNEY (visual pipeline) ────────────────────────────────────── */}
      <section id="journey" className="py-24 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4A574" }}>
              How Maarova Works
            </p>
            <h2 className="font-semibold text-gray-900" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}>
              From assessment to transformation in five steps
            </h2>
          </div>

          {/* Pipeline */}
          <div className="hidden md:grid grid-cols-5 gap-4">
            {journey.map((j) => (
              <div
                key={j.step}
                className="rounded-xl p-6 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold"
                  style={{ background: "#1A3A52", color: "#fff" }}
                >
                  {j.step}
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-2">{j.label}</p>
                <p className="text-xs leading-relaxed text-gray-500">{j.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile version */}
          <div className="md:hidden space-y-3">
            {journey.map((j) => (
              <div key={j.step} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "#1A3A52", color: "#fff" }}
                >
                  {j.step}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{j.label}</p>
                  <p className="text-xs mt-1 text-gray-500">{j.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASSESSMENT MODULES ───────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4A574" }}>
              Six Dimensions
            </p>
            <h2 className="font-semibold text-gray-900" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}>
              A complete picture of leadership
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m) => (
              <div
                key={m.num}
                className="group rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl" aria-hidden="true">{m.icon}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "#D4A574" }}>{m.num}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{m.name}</h3>
                <p className="text-xs font-medium mb-3" style={{ color: "#D4A574" }}>{m.short}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE STREAMS ────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#F1F5F9" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4A574" }}>
              Three Ways to Use Maarova
            </p>
            <h2 className="font-semibold text-gray-900" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}>
              Recruitment. Development. Intelligence.
            </h2>
          </div>

          <div className="space-y-5">
            {streams.map((s, i) => (
              <div
                key={s.label}
                className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <div className="p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: s.accent }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: s.accent }}>
                        Stream {i + 1}
                      </p>
                      <p className="font-semibold text-gray-900 text-sm">{s.label}</p>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-3" style={{ fontSize: "1.35rem" }}>
                    {s.headline}
                  </h3>

                  <p className="text-sm leading-relaxed max-w-2xl mb-8 text-gray-500">
                    {s.body}
                  </p>

                  <div className="grid grid-cols-3 gap-6">
                    {s.metrics.map((mt) => (
                      <div key={mt.sub}>
                        <p className="text-xl font-bold" style={{ color: "#1A3A52" }}>{mt.value}</p>
                        <p className="text-xs mt-1 text-gray-400">{mt.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HR SERVICE LINES ─────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4A574" }}>
              Full-Spectrum Healthcare HR
            </p>
            <h2 className="font-semibold text-gray-900 mb-4" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}>
              Nine service lines. One practice.
            </h2>
            <p className="max-w-2xl mx-auto text-gray-500">
              Maarova powers our leadership assessment and coaching. But the HR practice goes
              far deeper. Every workforce challenge a hospital faces, we solve.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px rounded-xl overflow-hidden" style={{ background: "#e5eaf0" }}>
            {[
              {
                title: "Physician & Nurse Retention",
                desc: "Stop the exodus. Maarova identifies flight risks before they resign. Retention coaching for high-performers at risk of leaving.",
                tag: "Maarova-powered",
              },
              {
                title: "Strategic Workforce Planning",
                desc: "Maarova capability mapping shows leadership strength and gaps. Build a 3-5 year workforce plan aligned with growth strategy.",
                tag: "Maarova-powered",
              },
              {
                title: "Executive Search & Selection",
                desc: "Every finalist assessed through Maarova. Side-by-side comparison reports. Science-based hiring for CMOs, COOs, CNOs, and department heads.",
                tag: "Maarova-powered",
              },
              {
                title: "Compensation & Benefits",
                desc: "Market benchmarking, pay equity analysis, total rewards design. Attract better talent without breaking the bank.",
                tag: "Consulting",
              },
              {
                title: "HR Infrastructure Build",
                desc: "50+ HR policies, HRIS implementation, and Maarova integration. From no HR function to professional practice in 12-20 weeks.",
                tag: "Maarova-powered",
              },
              {
                title: "Performance Management",
                desc: "KPIs for every clinical role. Maarova 360 feedback replaces manual reviews. Coaching for low performers, not just termination.",
                tag: "Maarova-powered",
              },
              {
                title: "Employee Engagement & Culture",
                desc: "Maarova culture diagnostics plus engagement surveys. Identify what drives your people and what is driving them away.",
                tag: "Maarova-powered",
              },
              {
                title: "Leadership Development & Succession",
                desc: "The flagship use case. Full Maarova assessment suite, ICF-certified coaches, 6-18 month development programmes. Build your leadership bench.",
                tag: "Flagship",
              },
              {
                title: "HR Compliance & Risk",
                desc: "Labour law, licensing, contracts, payroll compliance. Identify violations before they become legal exposure. Remediation and training.",
                tag: "Consulting",
              },
            ].map((svc) => (
              <div
                key={svc.title}
                className="p-6 transition-colors duration-200 hover:bg-[#F8FAFC]"
                style={{ background: "#fff" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded"
                    style={{
                      color: svc.tag === "Flagship" ? "#92400E" : svc.tag === "Maarova-powered" ? "#1E6FA0" : "#64748B",
                      background: svc.tag === "Flagship" ? "#FEF3C7" : svc.tag === "Maarova-powered" ? "#DBEAFE" : "#F1F5F9",
                    }}
                  >
                    {svc.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{svc.title}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{svc.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/#contact"
              className="inline-block px-7 py-3 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "#1A3A52", color: "#fff" }}
            >
              Discuss Your Workforce Challenges
            </Link>
          </div>
        </div>
      </section>

      {/* ── DIFFERENTIATORS (bold grid) ──────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4A574" }}>
              Our Edge
            </p>
            <h2 className="font-semibold text-gray-900" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}>
              Why nothing else comes close
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px rounded-2xl overflow-hidden" style={{ background: "#e5eaf0" }}>
            {[
              {
                title: "Built for Africa. Period.",
                desc: "Not Western tools with a localisation layer. Designed from scratch for African healthcare contexts, cultural norms, and leadership realities. Every question, every benchmark, every norm.",
                highlight: true,
              },
              {
                title: "Healthcare-specific",
                desc: "Generic leadership assessments miss what matters most in healthcare: the clinician-to-leader transition, clinical credibility dynamics, and the unique pressures of patient care environments.",
                highlight: false,
              },
              {
                title: "Compounding intelligence",
                desc: "Every assessment strengthens our African healthcare leadership normative database. The more hospitals that use Maarova, the smarter and more accurate it becomes. First-mover advantage that compounds.",
                highlight: false,
              },
              {
                title: "Consulting + Technology",
                desc: "Maarova is not a standalone SaaS tool. It is integrated with CFA consulting expertise. You get data AND the people who know how to act on it. No other firm offers both.",
                highlight: true,
              },
            ].map((d) => (
              <div
                key={d.title}
                className="p-8"
                style={{ background: d.highlight ? "#F8FAFC" : "#fff" }}
              >
                <h3 className="font-semibold text-gray-900 mb-3">{d.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS STRIP ──────────────────────────────────────────────── */}
      <section className="py-12 px-6" style={{ background: "#fff", borderTop: "1px solid #e5eaf0" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] text-center mb-6 text-gray-400">
            Maarova Partners
          </p>
          <div className="flex items-center justify-center gap-12 md:gap-16 flex-wrap">
            {[
              { src: "/partners/hba-africa.webp", alt: "Health Business Academy Africa", height: 120 },
              { src: "/partners/doctors-foundation.webp", alt: "Doctors Foundation for Care", height: 124 },
            ].map((p) => (
              <div key={p.alt} className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.alt}
                  style={{ height: p.height, width: "auto", objectFit: "contain" }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 overflow-hidden" style={{ background: "#FAF8F5" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.25em] mb-5" style={{ color: "#D4A574" }}>
            Ready?
          </p>
          <h2 className="font-semibold text-gray-900 mb-5" style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}>
            Stop losing your best leaders
            <br />
            <span className="text-gray-400">to guesswork and neglect.</span>
          </h2>
          <p className="mb-10 leading-relaxed max-w-lg mx-auto text-gray-500">
            See how CFA + Maarova can change the way you hire,
            develop, and retain healthcare leaders.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/#contact"
              className="px-8 py-3.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "#1A3A52", color: "#fff" }}
            >
              Book a Demo
            </Link>
            <Link
              href="/services"
              className="px-8 py-3.5 rounded-lg text-sm font-semibold transition-all"
              style={{ border: "1px solid #CBD5E1", color: "#64748B" }}
            >
              View All Services
            </Link>
          </div>

          <p className="mt-10 text-xs text-gray-300">
            Consult for Africa {"·"} Proprietary Technology {"·"} Built in Africa, for Africa
          </p>
        </div>
      </section>
    </main>
  );
}
