import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Leadership Development | Maarova",
  description:
    "Every leader gets a personalised development roadmap. Assess, coach, measure, repeat. ICF-certified coaches who understand African healthcare.",
};

const tiers = [
  {
    level: "Frontline Leaders",
    roles: "Ward managers, charge nurses, team leads",
    focus:
      "Building foundational leadership skills. Transitioning from individual contributor to people manager. Emotional intelligence, delegation, conflict resolution, and team communication.",
    color: "#10B981",
  },
  {
    level: "Middle Management",
    roles: "Department heads, unit directors, programme managers",
    focus:
      "Strategic thinking, cross-functional collaboration, performance management, and change leadership. Bridging the gap between frontline reality and executive vision.",
    color: "#2D9CDB",
  },
  {
    level: "Executive Leadership",
    roles: "C-suite, medical directors, chief nursing officers",
    focus:
      "Board engagement, organisational culture, strategic planning, stakeholder management, and legacy building. Leading the institution, not just the department.",
    color: "#D4A574",
  },
];

const cycle = [
  {
    step: "01",
    label: "Assess",
    desc: "Baseline Maarova profile across all six dimensions. Behavioural style, values, EQ, clinical leadership transition, 360 feedback, and culture fit.",
  },
  {
    step: "02",
    label: "Match",
    desc: "Paired with an ICF-certified African coach selected for sector expertise, leadership level, and personality fit. Not a random assignment.",
  },
  {
    step: "03",
    label: "Develop",
    desc: "6 to 12 month structured coaching programme with milestone tracking, monthly check-ins, and quarterly progress reviews against the development plan.",
  },
  {
    step: "04",
    label: "Measure",
    desc: "Re-assessment using the same Maarova instruments. Quantified improvement across every dimension. No guesswork, just data.",
  },
];

export default function DevelopmentPage() {
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
              "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(212,165,116,0.25) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 70% at 15% 70%, rgba(212,165,116,0.1) 0%, transparent 55%)",
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
                background: "rgba(212,165,116,0.15)",
                color: "#D4A574",
                border: "1px solid rgba(212,165,116,0.25)",
              }}
            >
              Stream 2
            </span>
            <span
              className="text-xs tracking-wide"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Leadership Development
            </span>
          </div>

          <h1
            className="font-semibold tracking-tight text-white"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              lineHeight: 1.08,
            }}
          >
            Assess. Coach. Measure.
            <br />
            <span style={{ color: "#D4A574" }}>Repeat.</span>
          </h1>

          <p
            className="mt-6 leading-[1.7] max-w-2xl"
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.1rem)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Every leader gets a personalised development roadmap built from
            their Maarova profile. Matched with an ICF-certified coach who
            understands African healthcare. Progress tracked, results measured,
            improvement quantified.
          </p>

          <div className="mt-8">
            <Link
              href="/maarova/demo"
              className="inline-block px-7 py-3.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "#D4A574", color: "#06090f" }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── THREE TIERS ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#D4A574" }}
            >
              Three programme tiers
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Right-sized development for every leadership level
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((t) => (
              <div
                key={t.level}
                className="rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <div
                  className="w-2 h-2 rounded-full mb-4"
                  style={{ background: t.color }}
                />
                <h3 className="font-semibold text-gray-900 mb-1">{t.level}</h3>
                <p
                  className="text-xs font-medium mb-4"
                  style={{ color: t.color }}
                >
                  {t.roles}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t.focus}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE DEVELOPMENT CYCLE ────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#FAF8F5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#D4A574" }}
            >
              The Maarova development cycle
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              A closed loop from insight to measurable growth
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {cycle.map((c) => (
              <div
                key={c.step}
                className="rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-sm font-bold text-white"
                  style={{ background: "#D4A574" }}
                >
                  {c.step}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">
                  {c.label}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Cycle visual connector */}
          <div className="hidden md:flex items-center justify-center mt-8 gap-2">
            <div
              className="h-px flex-1"
              style={{ background: "rgba(212,165,116,0.3)" }}
            />
            <p
              className="text-xs font-semibold px-4"
              style={{ color: "#D4A574" }}
            >
              Then repeat. Every 6 to 12 months.
            </p>
            <div
              className="h-px flex-1"
              style={{ background: "rgba(212,165,116,0.3)" }}
            />
          </div>
        </div>
      </section>

      {/* ── COACHING NETWORK ─────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="text-xs uppercase tracking-[0.25em] mb-4"
                style={{ color: "#D4A574" }}
              >
                Our coaching network
              </p>
              <h2
                className="font-semibold text-gray-900 mb-5"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
              >
                ICF-certified coaches from across Africa who understand
                healthcare leadership.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Not generic executive coaches running the same playbook they use
                for banks and telcos. Our network is built exclusively for
                healthcare. Every coach has direct experience with clinical
                environments, the pressures of patient care, and the unique
                dynamics of leading in under-resourced settings.
              </p>
              <p className="text-gray-500 leading-relaxed">
                Coaches are matched to leaders based on sector expertise,
                leadership level, personality profile, and development goals.
                The relationship is structured, tracked, and measured. If a
                match is not working, we reassign within two weeks.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "ICF-Certified",
                  desc: "Every coach in our network holds International Coaching Federation credentials. No exceptions.",
                },
                {
                  title: "Healthcare-Specific",
                  desc: "Coaches with direct experience in hospitals, clinics, and health systems across Africa.",
                },
                {
                  title: "Data-Informed",
                  desc: "Coaching plans built directly from Maarova assessment data. Not generic templates.",
                },
                {
                  title: "Structured and Tracked",
                  desc: "Monthly sessions, milestone tracking, quarterly progress reports. Full accountability.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl p-5"
                  style={{ background: "#F8FAFC", border: "1px solid #e5eaf0" }}
                >
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#F1F5F9" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: "#D4A574" }}
            >
              Results
            </p>
            <h2
              className="font-semibold text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Measurable leadership growth
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                value: "+0.8 pt",
                label: "Average EQ improvement at 6 months",
              },
              {
                value: "92%",
                label: "Coaching session attendance rate",
              },
              {
                value: "3 tiers",
                label: "Frontline, Middle, and Executive programmes",
              },
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

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ background: "#FAF8F5" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-5"
            style={{ color: "#D4A574" }}
          >
            Ready to develop your leaders?
          </p>
          <h2
            className="font-semibold text-gray-900 mb-5"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Build leaders who stay,
            <br />
            <span className="text-gray-400">grow, and deliver.</span>
          </h2>
          <p className="mb-10 leading-relaxed max-w-lg mx-auto text-gray-500">
            See how Maarova development programmes turn assessment data into
            lasting leadership transformation.
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
              Back to Maarova
            </Link>
          </div>

          <p className="mt-10 text-xs text-gray-300">
            Consult for Africa {"·"} Maarova{"\u2122"} Leadership Development
          </p>
        </div>
      </section>
    </main>
  );
}
