import {
  ClipboardList,
  PhoneCall,
  UserCheck,
  Crown,
  Building2,
  Handshake,
  Megaphone,
} from "lucide-react";

const solutions = [
  {
    num: "01",
    icon: ClipboardList,
    title: "Advisory Projects",
    tag: "PROJECT",
    href: "/solutions/advisory",
    summary:
      "Targeted consulting for specific operational or strategic challenges.",
    how: [
      "Rapid diagnostic to identify root causes",
      "Clear scope with defined deliverables",
      "Embedded team working inside your organisation",
      "Measurable outcomes tied to performance targets",
    ],
    duration: "8 to 16 weeks",
  },
  {
    num: "02",
    icon: PhoneCall,
    title: "Retainer Advisory",
    tag: "RETAINER",
    href: "/solutions/retainer",
    summary:
      "Ongoing strategic counsel with a dedicated pool of consulting hours each month.",
    how: [
      "Monthly hours allocation with rollover flexibility",
      "Priority access to specialist consultants",
      "Quarterly performance reviews and recalibration",
      "Flexible scope that adapts as priorities shift",
    ],
    duration: "6 to 12 month rolling",
  },
  {
    num: "03",
    icon: UserCheck,
    title: "Embedded Secondments",
    tag: "SECONDMENT",
    href: "/solutions/secondment",
    summary:
      "Full-time consultants placed inside your organisation to drive change from within.",
    how: [
      "Dedicated resource embedded in your team",
      "Reports directly to your leadership",
      "Knowledge transfer built into every engagement",
      "Recall clause for operational flexibility",
    ],
    duration: "3 to 12 months",
  },
  {
    num: "04",
    icon: Crown,
    title: "Fractional Leadership",
    tag: "FRACTIONAL",
    href: "/solutions/fractional",
    summary:
      "Part-time C-suite executives for hospitals that need senior leadership without full-time cost.",
    how: [
      "2 to 3 days per week, on-site or hybrid",
      "Board-ready professionals with sector depth",
      "Performance-linked engagement terms",
      "Transition to permanent hire optional",
    ],
    duration: "6 to 18 months",
  },
  {
    num: "05",
    icon: Building2,
    title: "Hospital Transformation",
    tag: "TRANSFORMATION",
    href: "/solutions/transformation",
    summary:
      "Equity-backed operational turnarounds for underperforming healthcare facilities.",
    how: [
      "Diagnostic and entry valuation",
      "Management takeover with full operational control",
      "KPI-driven performance tracking and reporting",
      "Structured exit with defined return targets",
    ],
    duration: "24 to 60 months",
  },
  {
    num: "06",
    icon: Handshake,
    title: "Transaction Advisory",
    tag: "TRANSACTION",
    href: "/solutions/transaction",
    summary:
      "M&A and capital raising for healthcare assets across Africa.",
    how: [
      "Mandate structuring and deal positioning",
      "Buyer and investor pipeline development",
      "Data room preparation and due diligence support",
      "Deal execution through to completion",
    ],
    duration: "6 to 18 months",
  },
  {
    num: "07",
    icon: UserCheck,
    title: "Healthcare Recruitment",
    tag: "CADREHEALTH",
    href: "/oncadre",
    summary:
      "Finding and retaining qualified healthcare professionals is the single biggest challenge facing African hospitals. CadreHealth gives you access to 4,200+ verified professionals across 16 cadres.",
    how: [
      "Post permanent roles and source candidates from a verified talent pool",
      "Fill locum and temporary staffing gaps within days",
      "Pre-employment assessments and credential verification",
      "Salary intelligence and workforce benchmarking",
    ],
    duration: "Ongoing",
  },
  {
    num: "08",
    icon: Megaphone,
    title: "Commercial Distribution",
    tag: "AGENT CHANNEL",
    href: "/solutions/distribution",
    summary:
      "Commission-based sales agent network for healthcare products and services. We recruit, credential, and manage independent agents who sell on your behalf.",
    how: [
      "Agent recruitment from our verified healthcare professional network",
      "Structured commission models with deal tracking and attribution",
      "Territory management and performance monitoring",
      "Compliance oversight and quality assurance",
    ],
    duration: "Ongoing",
  },
];

export default function SolutionsList() {
  return (
    <section className="py-24" style={{ background: "#06090f" }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Section header */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4AF37" }}>
            Engagement Models
          </p>
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            Eight Ways to Work With Us
          </h2>
          <p className="mt-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem" }}>
            Every healthcare organisation has different needs and constraints.
            We offer engagement models that range from short-term advisory
            to long-term transformation partnerships.
          </p>
        </div>

        {/* Solutions grid */}
        <div className="grid md:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {solutions.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="group p-8 md:p-10 transition-colors duration-300 hover:bg-[#0a1320]"
                style={{ background: "#06090f" }}
              >
                {/* Top row: number, tag, icon */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <span
                      className="text-xs font-semibold tracking-[0.2em] tabular-nums"
                      style={{ color: "#D4AF37" }}
                    >
                      {s.num}
                    </span>
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    />
                  </div>
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

                {/* Title */}
                <h3
                  className="font-semibold text-white leading-snug mb-3"
                  style={{ fontSize: "1.15rem" }}
                >
                  {s.title}
                </h3>

                {/* Summary */}
                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {s.summary}
                </p>

                {/* How it works */}
                <p
                  className="text-xs font-semibold uppercase tracking-[0.15em] mb-3"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  How it works
                </p>
                <ul className="space-y-2 mb-6">
                  {s.how.map((pt) => (
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

                {/* Duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs uppercase tracking-[0.12em]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      Typical duration:
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "#D4AF37" }}
                    >
                      {s.duration}
                    </span>
                  </div>
                  <a
                    href={s.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    style={{ color: "#D4AF37" }}
                  >
                    Learn more
                    <span className="group-hover:translate-x-0.5 transition-transform">&#x2192;</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
