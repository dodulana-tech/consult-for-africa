const outcomes = [
  {
    stat: "135+",
    label: "Years combined expertise",
    desc: "Across hospital operations, clinical leadership, finance, and digital health.",
  },
  {
    stat: "21",
    label: "Nigerian states reached",
    desc: "Public and private healthcare institutions across the country.",
  },
  {
    stat: "5",
    label: "Countries active",
    desc: "Healthcare advisory and transformation mandates across Africa.",
  },
  {
    stat: "$1.1M+",
    label: "Grant capital mobilised",
    desc: "For health system strengthening and institutional reform programmes.",
  },
];

export default function Outcomes() {
  return (
    <section className="py-24" style={{ background: "#06090f" }}>
      <div className="max-w-7xl mx-auto px-6">

        <div className="max-w-xl mb-16">
          <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4AF37" }}>
            Track Record
          </p>
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            Where Performance Improves,
            <br />
            <span style={{ color: "rgba(255,255,255,0.45)" }}>Value Follows</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {outcomes.map((o) => (
            <div
              key={o.stat}
              className="p-8"
              style={{ background: "#06090f" }}
            >
              <p
                className="font-semibold mb-2 tabular-nums"
                style={{ fontSize: "2.25rem", color: "#D4AF37", lineHeight: 1 }}
              >
                {o.stat}
              </p>
              <p className="font-medium text-white text-sm mb-2">{o.label}</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                {o.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Outcome bullets */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "Restored financial sustainability",
            "Improved operational efficiency",
            "Strengthened governance and accountability",
            "Improved patient safety and quality outcomes",
            "Optimised resource utilisation",
            "Long-term institutional resilience",
          ].map((o) => (
            <div
              key={o}
              className="flex items-center gap-3 px-5 py-4 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span style={{ color: "#D4AF37", flexShrink: 0 }}>&#x2014;</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{o}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
