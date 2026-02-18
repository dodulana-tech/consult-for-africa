export default function Outcomes() {
  const outcomes = [
    "Restored financial sustainability",
    "Improved operational efficiency",
    "Strengthened governance & accountability",
    "Improved patient safety & quality outcomes",
    "Optimized resource utilization",
    "Long-term institutional resilience",
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p className="uppercase tracking-[0.25em] text-xs text-gray-500 mb-6">
          Outcomes
        </p>

        <h2 className="text-3xl font-semibold mb-12">
          Where Performance Improves, Value Follows
        </h2>

        <div className="grid sm:grid-cols-2 gap-6 text-left">
          {outcomes.map((o) => (
            <div
              key={o}
              className="border rounded-lg p-5 text-gray-700 bg-white"
            >
              • {o}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
