const rows = [
  {
    model: "Advisory Projects",
    duration: "8 to 16 weeks",
    teamSize: "2 to 4 consultants",
    clientInvolvement: "Moderate. Sponsor plus working group",
    feeStructure: "Fixed project fee",
    bestFor: "Specific operational or strategic challenges with a clear scope",
  },
  {
    model: "Retainer Advisory",
    duration: "6 to 12 months (rolling)",
    teamSize: "1 to 2 senior advisors",
    clientInvolvement: "Light. Monthly check-ins, on-demand access",
    feeStructure: "Monthly retainer",
    bestFor: "Ongoing strategic guidance without a full engagement",
  },
  {
    model: "Embedded Secondments",
    duration: "3 to 12 months",
    teamSize: "1 to 3 embedded staff",
    clientInvolvement: "High. Consultant reports to client leadership",
    feeStructure: "Monthly placement fee",
    bestFor: "Capacity gaps requiring hands-on, full-time support",
  },
  {
    model: "Fractional Leadership",
    duration: "6 to 18 months",
    teamSize: "1 executive",
    clientInvolvement: "High. Integrated into leadership team",
    feeStructure: "Monthly fee, performance-linked",
    bestFor: "Senior leadership needs without full-time hiring cost",
  },
  {
    model: "Hospital Transformation",
    duration: "24 to 60 months",
    teamSize: "Full management team",
    clientInvolvement: "Board-level oversight",
    feeStructure: "Management fee plus equity participation",
    bestFor: "Underperforming facilities requiring operational turnaround",
  },
  {
    model: "Transaction Advisory",
    duration: "6 to 18 months",
    teamSize: "2 to 4 specialists",
    clientInvolvement: "Moderate. Data provision and decision gates",
    feeStructure: "Retainer plus success fee",
    bestFor: "Healthcare M&A, fundraising, or asset transactions",
  },
];

const columns = [
  { key: "model" as const, label: "Engagement Model" },
  { key: "duration" as const, label: "Duration" },
  { key: "teamSize" as const, label: "CFA Team Size" },
  { key: "clientInvolvement" as const, label: "Client Involvement" },
  { key: "feeStructure" as const, label: "Fee Structure" },
  { key: "bestFor" as const, label: "Best For" },
];

export default function SolutionsComparison() {
  return (
    <section
      className="py-24"
      style={{ background: "linear-gradient(145deg, #0a1e32 0%, #0d2a45 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Section header */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            At a Glance
          </p>
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            Compare Engagement Models
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Choose the model that fits your organisation{"'"}s stage, budget, and objectives.
            Most clients combine two or more models over time.
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-[0.12em]"
                    style={{ color: "#D4AF37", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.model}
                  style={{
                    background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                    borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                  }}
                >
                  <td className="px-5 py-4 font-semibold text-white whitespace-nowrap">
                    {row.model}
                  </td>
                  <td className="px-5 py-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {row.duration}
                  </td>
                  <td className="px-5 py-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {row.teamSize}
                  </td>
                  <td className="px-5 py-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {row.clientInvolvement}
                  </td>
                  <td className="px-5 py-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {row.feeStructure}
                  </td>
                  <td className="px-5 py-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {row.bestFor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-4">
          {rows.map((row) => (
            <div
              key={row.model}
              className="rounded-lg p-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3 className="font-semibold text-white mb-4">{row.model}</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Duration
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.6)" }}>{row.duration}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Team Size
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.6)" }}>{row.teamSize}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Client Involvement
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.6)" }}>{row.clientInvolvement}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Fee Structure
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.6)" }}>{row.feeStructure}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-[0.1em] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Best For
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.6)" }}>{row.bestFor}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
