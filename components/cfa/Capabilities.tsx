import Link from "next/link";

export default function Capabilities() {
  const groups: [string, string[]][] = [
    [
      "Strategy, Growth & Portfolio",
      [
        "Market & service-line strategy",
        "Operating model & org design",
        "Commercial & payer strategy",
        "M&A / partnerships",
      ],
    ],
    [
      "Capital Projects (Design & Build)",
      [
        "Feasibility & business case",
        "Clinical planning & adjacencies",
        "CAPEX budgeting & procurement",
        "PMO / delivery governance",
      ],
    ],
    [
      "Hospital Management & Turnaround",
      [
        "Stabilization & recovery",
        "Operations & cost discipline",
        "Revenue cycle & cash",
        "Performance management cadence",
      ],
    ],
    [
      "Clinical Governance & Quality",
      [
        "Clinical governance model",
        "Quality improvement system",
        "Accreditation readiness",
        "Patient safety & risk",
      ],
    ],
    [
      "Digital, Data & Operating Intelligence",
      [
        "Dashboards & KPI tree",
        "HIS/EMR selection & rollout",
        "Workflow digitization",
        "Automation & AI enablement",
      ],
    ],
    [
      "People, Leadership & Change",
      [
        "Executive coaching & cadence",
        "Capability building",
        "Incentives & accountability",
        "Change adoption",
      ],
    ],
  ];

  return (
    <section
      id="services"
      className="py-16 md:py-24 px-6"
      style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10 text-white">
          Our Capabilities
        </h2>

        <div className="grid md:grid-cols-3 gap-6 text-sm">
          {groups.map(([title, items]) => (
            <Link
              key={title}
              href="/services"
              className="glass-card p-6 block"
            >
              <h3 className="font-semibold mb-3 text-white">{title}</h3>
              <ul className="space-y-1 text-white/60">
                {items.map((i) => (
                  <li key={i}>• {i}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
