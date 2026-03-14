export default function ValueCards() {
  const cards = [
    ["Execution Partner",     "We implement, not advise."],
    ["Performance Operator",  "Efficiency & revenue discipline."],
    ["Systems Transformation","Institutional redesign."],
    ["Management Partner",    "Embedded accountability."],
  ];

  return (
    <section
      className="py-20"
      style={{ background: "linear-gradient(135deg, #071626 0%, #0d2540 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-6">
        {cards.map(([t, d]) => (
          <div key={t} className="glass-card p-7">
            <h3 className="font-semibold mb-2 text-white">{t}</h3>
            <p className="text-sm text-white/65">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
