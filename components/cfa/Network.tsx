const disciplines = [
  {
    title: "Hospital Operations Leaders",
    desc: "Former COOs, General Managers, and turnaround specialists with frontline hospital experience.",
  },
  {
    title: "Clinical Governance & Quality",
    desc: "Clinicians and quality leads who have implemented accreditation and patient safety frameworks.",
  },
  {
    title: "Finance & Revenue Specialists",
    desc: "Healthcare finance experts covering billing, NHIS/HMO, cost recovery, and P&L management.",
  },
  {
    title: "Digital & Data Experts",
    desc: "Implementers of HIS, EMR, and analytics platforms across public and private African health systems.",
  },
  {
    title: "Public Health & Systems",
    desc: "M&E specialists, health systems consultants, and development partner advisors.",
  },
  {
    title: "African Diaspora Experts",
    desc: "Senior professionals returning expertise and global standards to African healthcare institutions.",
  },
];

export default function Network() {
  return (
    <section id="network" className="py-24 px-6" style={{ background: "#F8FAFC" }}>
      <div className="max-w-5xl mx-auto">
        <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3 text-center">The Network</p>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center mb-4">
          Multidisciplinary. African-Rooted. Execution-Ready.
        </h2>
        <p className="text-center text-gray-500 text-sm max-w-xl mx-auto mb-14">
          The C4A consultant network covers every domain of healthcare management.
          Every engagement draws from the right expertise for the specific challenge.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {disciplines.map((d) => (
            <div
              key={d.title}
              className="rounded-xl p-6 transition-shadow duration-200 hover:shadow-md"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              <div className="w-8 h-[2px] mb-4" style={{ background: "#D4AF37" }} />
              <h3 className="font-semibold text-gray-900 text-sm mb-2">{d.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
