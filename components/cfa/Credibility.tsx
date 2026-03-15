const stats = [
  { value: "60+", label: "Combined years of Africa health leadership" },
  { value: "$1.1M+", label: "Annual savings in a single engagement" },
  { value: "21 states", label: "Healthcare network built and sold" },
  { value: "5 countries", label: "Active engagements across the continent" },
];

const credentials = [
  {
    title: "Hospital CEOs & Executive Operators",
    desc: "Founders and former CEOs of Nigerian and East African hospital groups with P&L accountability.",
  },
  {
    title: "Clinical Governance Authorities",
    desc: "Clinicians who have led accreditation, quality systems, and patient safety programmes at scale.",
  },
  {
    title: "Finance & Revenue Strategists",
    desc: "Specialists in healthcare billing integrity, NHIS/HMO strategy, and cost reduction.",
  },
  {
    title: "Digital Health Implementers",
    desc: "Operators who have deployed HIS, EMR, and data platforms in resource-constrained environments.",
  },
];

export default function Credibility() {
  return (
    <section className="py-24 px-6" style={{ background: "#ffffff" }}>
      <div className="max-w-5xl mx-auto">
        <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3 text-center">Track Record</p>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center mb-14">
          Credibility Built in the Field
        </h2>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {stats.map((s) => (
            <div
              key={s.value}
              className="rounded-xl p-6 text-center"
              style={{ background: "#F8FAFC", border: "1px solid #e5eaf0" }}
            >
              <p className="text-2xl font-bold mb-1" style={{ color: "#0B3C5D" }}>{s.value}</p>
              <p className="text-xs text-gray-500 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Credential cards */}
        <div className="grid sm:grid-cols-2 gap-5">
          {credentials.map((c) => (
            <div
              key={c.title}
              className="rounded-xl p-6"
              style={{ border: "1px solid #e5eaf0", background: "#fff" }}
            >
              <div
                className="w-2 h-2 rounded-full mb-4"
                style={{ background: "#D4AF37" }}
              />
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">{c.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
