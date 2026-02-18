export default function EngagementModel() {
  const steps = [
    "Rapid Diagnostic",
    "Strategic Design",
    "Embedded Execution",
    "Performance Delivery",
    "Capability Transfer",
  ];

  return (
    <section className="py-24 bg-[var(--surface-muted)] text-center">
      <div className="max-w-6xl mx-auto px-6">
        <p className="uppercase tracking-[0.25em] text-xs text-gray-500 mb-6">
          Engagement Model
        </p>

        <h2 className="text-3xl font-semibold mb-16">
          Execution, Not Advice
        </h2>

        <div className="grid md:grid-cols-5 gap-8 text-sm">
          {steps.map((step) => (
            <div key={step}>
              <div className="w-14 h-14 mx-auto rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-semibold mb-3">
                •
              </div>
              <p className="font-medium">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
