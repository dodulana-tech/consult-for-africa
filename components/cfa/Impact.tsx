export default function Impact() {
  return (
    <section className="bg-[#0B3C5D] text-white py-16">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-12">
          <p className="uppercase tracking-[0.25em] text-xs text-white/70 mb-3">
            Performance Impact
          </p>

          <h3 className="text-2xl font-semibold text-white">
            Where Performance Improves, Value Follows
          </h3>
        </div>

        <div className="grid md:grid-cols-4 gap-10 text-center">
          {[
            ["Revenue Recovery","Capture earned income & billing accuracy"],
            ["Utilization Gains","Maximize theatre, bed & clinic productivity"],
            ["Cost Discipline","Control waste & procurement leakage"],
            ["Governance Strength","Improve oversight & accountability"],
          ].map(([title,desc]) => (
            <div key={title} className="group">

              <p className="text-lg font-semibold text-white">
                {title}
              </p>

              <p className="text-white/85 text-sm mt-2">
                {desc}
              </p>

              <div className="mt-4 h-[2px] w-10 bg-[var(--brand-secondary)] mx-auto transition-all group-hover:w-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
