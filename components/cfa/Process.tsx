export default function Process() {
  const steps = ["Diagnose", "Design", "Deploy", "Deliver", "Transfer"];

  return (
    <section id="process" className="section text-center">
      <div className="container">
        <h2 className="heading-md mb-12">Execution Model</h2>

        <div className="grid md:grid-cols-5 gap-8 text-sm">
          {steps.map((step) => (
            <div key={step}>
              <div className="w-16 h-16 mx-auto rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-semibold mb-3">
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
