export default function OurRole() {
  return (
    <section className="py-20 bg-[var(--surface-muted)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {[
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
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-xl p-7 border"
              style={{ borderColor: "#e5eaf0" }}
            >
              <div className="w-8 h-[2px] mb-4" style={{ background: "#D4AF37" }}/>
              <h3 className="font-semibold text-gray-900 mb-2">{item.label}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
