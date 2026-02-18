export default function ValueCards() {
  const cards = [
    ["Execution Partner", "We implement, not advise."],
    ["Performance Operator", "Efficiency & revenue discipline."],
    ["Systems Transformation", "Institutional redesign."],
    ["Management Partner", "Embedded accountability."],
  ];

  return (
    <section className="py-20 bg-[var(--surface-muted)]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-6">
        {cards.map(([t, d]) => (
          <div key={t} className="bg-white p-7 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
            <h3 className="font-semibold mb-2">{t}</h3>
            <p className="text-sm text-gray-600">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
