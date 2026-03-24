const services = [
  {
    num: "01",
    title: "Hospital Turnaround & Financial Recovery",
    summary:
      "When cashflow tightens and instability sets in, hospitals need decisive action. We restore financial control, stop revenue leakage, and rebuild operational discipline. Fast.",
    points: [
      "Revenue capture and billing integrity",
      "Cost discipline and procurement control",
      "Theatre and clinic productivity",
      "Cashflow stabilisation and financial visibility",
    ],
    tag: "Turnaround",
    href: "/turnaround",
  },
  {
    num: "02",
    title: "Strategy, Growth & Commercial Performance",
    summary:
      "Growth comes from aligning clinical strengths with demand, referral flows, and patient access. Not from adding more services and hoping for the best.",
    points: [
      "Service-line and demand alignment",
      "Referral network and physician engagement",
      "Commercial and payer strategy",
      "Revenue diversification and patient experience",
    ],
    tag: "Strategy",
    href: "/services/strategy-growth",
  },
  {
    num: "03",
    title: "Clinical Governance & Accreditation",
    summary:
      "Strong quality systems protect patients and build institutional credibility. We strengthen governance structures and prepare institutions for JCI, COHSASA, and SafeCare accreditation.",
    points: [
      "Clinical governance frameworks",
      "Accreditation readiness (JCI, COHSASA, SafeCare)",
      "Patient safety systems",
      "Clinical audit and quality monitoring",
    ],
    tag: "Governance",
    href: "/services/clinical-governance",
  },
  {
    num: "04",
    title: "Digital Health & Technology Leadership",
    summary:
      "We help healthcare organisations and startups get the technology foundation right, from HIS selection to digital strategy to building the teams that actually run it.",
    points: [
      "Executive dashboards and performance intelligence",
      "HIS/EMR selection and workflow digitisation",
      "CTO-as-a-Service for healthtech ventures",
      "Option to convert CTO fees into pre-seed equity",
    ],
    tag: "Digital",
    href: "/services/digital-health",
  },
  {
    num: "05",
    title: "Fractional Leadership & Executive Secondments",
    summary:
      "Not every hospital needs a full-time C-suite hire. We embed experienced healthcare executives on fixed-term mandates to fill leadership gaps and drive specific transformations.",
    points: [
      "Fractional CEO, COO, CMO, and CTO placements",
      "Interim Hospital Director and Medical Director roles",
      "Project-embedded clinical and operational leads",
      "Performance-linked fixed-term mandates",
    ],
    tag: "Leadership",
    href: "/services/fractional-leadership",
  },
  {
    num: "06",
    title: "Health Systems & Public Sector Advisory",
    summary:
      "We support governments, development partners, and NGOs on health system design, hospital network planning, and policy-to-implementation programmes across African markets.",
    points: [
      "Health system design and hospital network planning",
      "Policy-to-implementation programmes",
      "Primary healthcare strengthening",
      "Development partner and NGO advisory",
    ],
    tag: "Systems",
    href: "/services/health-systems",
  },
  {
    num: "07",
    title: "Healthcare HR Management",
    summary:
      "The workforce crisis is the single biggest threat to African healthcare. We combine consulting with proprietary psychometric technology to help hospitals hire, develop, and retain clinical leaders.",
    points: [
      "Physician and nurse retention strategy",
      "Executive search powered by Maarova\u2122 assessments",
      "Leadership development and succession planning",
      "Workforce planning, compensation, and culture",
    ],
    tag: "Powered by Maarova\u2122",
    href: "/maarova",
  },
];

export default function CoreTransformation() {
  return (
    <section className="py-24" style={{ background: "#06090f" }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Section header */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4AF37" }}>
            Service Areas
          </p>
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            Where We Work
          </h2>
          <p className="mt-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem" }}>
            We focus on the operational, financial, clinical, and digital levers
            that determine whether a healthcare institution performs or struggles.
          </p>
        </div>

        {/* Service grid */}
        <div className="grid md:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {services.map((s) => (
            <div
              key={s.num}
              className="group p-8 transition-colors duration-300 hover:bg-[#0a1320]"
              style={{ background: "#06090f" }}
            >
              <div className="flex items-start justify-between mb-5">
                <span
                  className="text-xs font-semibold tracking-[0.2em] tabular-nums"
                  style={{ color: "#D4AF37" }}
                >
                  {s.num}
                </span>
                <span
                  className="text-xs uppercase tracking-widest px-2 py-1 rounded"
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.05)",
                    letterSpacing: "0.15em",
                  }}
                >
                  {s.tag}
                </span>
              </div>

              <h3
                className="font-semibold text-white leading-snug mb-4"
                style={{ fontSize: "1.15rem" }}
              >
                {s.title}
              </h3>

              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {s.summary}
              </p>

              <ul className="space-y-2 mb-6">
                {s.points.map((pt) => (
                  <li
                    key={pt}
                    className="flex items-start gap-3 text-sm"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    <span style={{ color: "#D4AF37", marginTop: "2px", flexShrink: 0 }}>
                      &#x2014;
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>

              <a
                href={s.href}
                className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                style={{ color: "#D4AF37" }}
              >
                Learn more
                <span className="group-hover:translate-x-0.5 transition-transform">&#x2192;</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
