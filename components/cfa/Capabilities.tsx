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
    <section id="services" className="section">
      <div className="container">
        <h2 className="heading-md text-center mb-10">
          Our Capabilities
        </h2>

        <div className="grid md:grid-cols-3 gap-6 text-sm">
          {groups.map(([title, items]) => (
            <Link
              key={title}
              href="/services"
              className="card card-hover p-6 block"
            >
              <h3 className="font-semibold mb-3">{title}</h3>
              <ul className="space-y-1 text-gray-600">
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
