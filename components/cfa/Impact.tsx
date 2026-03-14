export default function Impact() {
  return (
    <section className="py-16" style={{ background: "linear-gradient(135deg, #0B3C5D 0%, #0e4a75 100%)" }}>
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-12">
          <p className="uppercase tracking-[0.25em] text-xs text-white/60 mb-3">
            Performance Impact
          </p>
          <h3 className="text-2xl font-semibold text-white">
            Where Performance Improves, Value Follows
          </h3>
        </div>

        <div className="grid md:grid-cols-4 gap-5">
          {[
            ["Revenue Recovery",   "Capture earned income & billing accuracy"],
            ["Utilization Gains",  "Maximize theatre, bed & clinic productivity"],
            ["Cost Discipline",    "Control waste & procurement leakage"],
            ["Governance Strength","Improve oversight & accountability"],
          ].map(([title, desc]) => (
            <div key={title} className="glass-card p-6 text-center group">
              <p className="text-base font-semibold text-white">{title}</p>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">{desc}</p>
              <div className="mt-4 h-[2px] w-8 bg-[var(--brand-secondary)] mx-auto transition-all duration-300 group-hover:w-14" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
