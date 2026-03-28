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
      style={{ background: "linear-gradient(145deg, #0a1e32 0%, #0d2a45 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-xl mb-16">
          <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            How We Engage
          </p>
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            Execution, Not Advice
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Every Consult For Africa engagement follows the same five-stage model. Diagnostic first,
            always. Results delivered in every phase, not just at the end.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {steps.map((s) => (
            <div
              key={s.step}
              className="p-7"
              style={{ background: "#0d2a45" }}
            >
              <p
                className="text-xs font-semibold tracking-[0.2em] mb-4 tabular-nums"
                style={{ color: "#D4AF37" }}
              >
                {s.step}
              </p>
              <p className="font-semibold text-white text-sm mb-3">{s.label}</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
