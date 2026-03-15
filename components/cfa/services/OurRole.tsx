export default function OurRole() {
  const clients = [
    {
      label: "Hospitals & Health Systems",
      desc: "Turnaround, restructuring, and performance improvement for private and public hospitals facing financial, operational, or governance challenges.",
    },
    {
      label: "Investors & Boards",
      desc: "Operational due diligence, performance oversight, and post-acquisition transformation support for healthcare investors and hospital boards.",
    },
    {
      label: "Healthtech & Startups",
      desc: "CTO and clinical leadership as a service, digital strategy, and go-to-market support for healthtech ventures building in African markets.",
    },
  ];

  return (
    <section
      className="py-16"
      style={{ background: "#0a1320" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-xs uppercase tracking-[0.22em] mb-10" style={{ color: "rgba(255,255,255,0.35)" }}>
          Who We Work With
        </p>
        <div className="grid md:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {clients.map((item) => (
            <div
              key={item.label}
              className="p-8"
              style={{ background: "#0a1320" }}
            >
              <div className="w-6 h-[2px] mb-5" style={{ background: "#D4AF37" }}/>
              <h3 className="font-semibold text-white mb-3 text-base">{item.label}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
