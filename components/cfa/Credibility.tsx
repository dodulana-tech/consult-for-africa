export default function Credibility() {
  const items = [
    "Hospital CEOs & Executive Operators",
    "Clinical Governance & Quality Authorities",
    "Finance & Revenue Strategists",
  ];

  return (
    <section className="section bg-[var(--brand-primary)] text-white text-center">
      <div className="container">
        <h2 className="text-white heading-md mb-6">Leadership & Credibility</h2>

        <p className="text-white/80 mb-10 max-w-3xl mx-auto">
          Our leadership combines hospital executives, clinicians, and systems
          transformation experts trusted to restore performance and build
          resilient healthcare institutions.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-sm">
          {items.map((i) => (
            <div
              key={i}
              className="border border-white/20 rounded-xl p-6"
            >
              {i}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
