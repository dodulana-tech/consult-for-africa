export default function EngagementModel() {
  const steps = [
    {
      step: "01",
      label: "Rapid Diagnostic",
      desc: "We get into the institution fast and find the real problems, not just the symptoms.",
    },
    {
      step: "02",
      label: "Strategic Design",
      desc: "We build a clear, prioritised plan tied to financial and operational outcomes.",
    },
    {
      step: "03",
      label: "Embedded Execution",
      desc: "Our team works inside the organisation, not from the outside looking in.",
    },
    {
      step: "04",
      label: "Performance Delivery",
      desc: "We track results against agreed targets and course-correct in real time.",
    },
    {
      step: "05",
      label: "Capability Transfer",
      desc: "We build internal capacity so the improvement sticks after we leave.",
    },
  ];

  return (
    <section
      className="py-24"
      style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <p className="uppercase tracking-[0.25em] text-xs text-white/50 mb-3 text-center">
          How We Engage
        </p>
        <h2 className="text-3xl font-semibold text-white text-center mb-16">
          Execution, Not Advice
        </h2>

        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-5 left-[calc(100%+0px)] w-full h-px"
                  style={{ background: "rgba(255,255,255,0.08)", zIndex: 0 }}
                />
              )}
              <div className="glass-card p-5 relative z-10">
                <p className="text-xs font-medium mb-2" style={{ color: "#D4AF37" }}>{s.step}</p>
                <p className="font-semibold text-white text-sm mb-2">{s.label}</p>
                <p className="text-white/55 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
