export default function AboutServices() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">

        <p className="uppercase tracking-[0.25em] text-xs text-gray-500 mb-6">
          About Consult For Africa
        </p>

        <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-6">
          Transforming Healthcare Performance Across Africa
        </h1>

        <div className="w-16 h-[2px] bg-[var(--brand-secondary)] mx-auto mb-8" />

        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Consult For Africa is a healthcare management and transformation partner
          supporting hospitals, startups/SMEs, investors, and healthcare institutions to strengthen
          performance, governance, and execution in complex operating environments.
        </p>

        <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
          We combine executive leadership experience, operational discipline,
          and data-driven performance systems to stabilize distressed institutions,
          improve financial sustainability, and build resilient healthcare
          organizations across the African continent.
        </p>

        {/* credibility metrics */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">

          <div>
            <p className="text-3xl font-semibold text-[var(--brand-primary)]">
              60+ yrs
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Combined leadership experience
            </p>
          </div>

          <div>
            <p className="text-3xl font-semibold text-[var(--brand-primary)]">
              Pan-African
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Operational experience & context
            </p>
          </div>

          <div>
            <p className="text-3xl font-semibold text-[var(--brand-primary)]">
              Execution-Led
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Embedded operators & delivery teams
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
