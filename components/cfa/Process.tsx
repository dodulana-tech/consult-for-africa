const steps = [
  {
    num: "01",
    name: "Diagnose",
    desc: "Deep operational and financial assessment. We find the real problem, not the presenting one.",
  },
  {
    num: "02",
    name: "Design",
    desc: "A bespoke transformation plan with clear milestones, ownership, and measurable targets.",
  },
  {
    num: "03",
    name: "Deploy",
    desc: "Embedded execution. Our team works inside the institution alongside your people.",
  },
  {
    num: "04",
    name: "Deliver",
    desc: "Measurable outcomes — revenue recovered, costs reduced, governance strengthened.",
  },
  {
    num: "05",
    name: "Transfer",
    desc: "Capability and systems transferred to your team so performance sustains after we leave.",
  },
];

export default function Process() {
  return (
    <section
      id="process"
      className="py-24 px-6"
      style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}
    >
      <div className="max-w-5xl mx-auto">
        <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3 text-center">How We Work</p>
        <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-14">
          The CFA Execution Model
        </h2>

        <div className="grid md:grid-cols-5 gap-4">
          {steps.map((step, i) => (
            <div key={step.num} className="relative glass-card p-6 flex flex-col items-center text-center">
              {/* connector line */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-8 left-[calc(100%)] w-4 h-[1px] z-10"
                  style={{ background: "rgba(212,175,55,0.3)" }}
                />
              )}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold mb-4"
                style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}
              >
                {step.num}
              </div>
              <p className="font-semibold text-white text-sm mb-2">{step.name}</p>
              <p className="text-white/55 text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
