import Image from "next/image";

export default function CoreTransformation() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 space-y-24">

        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="uppercase tracking-[0.25em] text-xs text-gray-500 mb-4">
            Service Areas
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Where We Work
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            We focus on the operational, financial, clinical, and digital levers
            that determine whether a healthcare institution performs or struggles.
          </p>
        </div>

        {/* 1 - Hospital Turnaround */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D4AF37] mb-3">01</p>
            <h3 className="text-2xl font-semibold mb-4">
              Hospital Turnaround & Financial Recovery
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              When cashflow tightens and instability sets in, hospitals need decisive action.
              We restore financial control, stop revenue leakage, and rebuild operational discipline.
              Fast.
            </p>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>• Revenue capture and billing integrity</li>
              <li>• Cost discipline and procurement control</li>
              <li>• Theatre and clinic productivity</li>
              <li>• Cashflow stabilization and financial visibility</li>
            </ul>
          </div>
          <Image
            src="/images/operations.jpg"
            alt="Hospital operations"
            width={700}
            height={500}
            className="rounded-2xl shadow-lg object-cover"
          />
        </div>

        {/* 2 - Strategy & Growth */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <Image
            src="/images/strategy.jpg"
            alt="Healthcare strategy"
            width={700}
            height={500}
            className="rounded-2xl shadow-lg object-cover"
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D4AF37] mb-3">02</p>
            <h3 className="text-2xl font-semibold mb-4">
              Strategy, Growth & Commercial Performance
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Growth comes from aligning clinical strengths with demand, referral flows, and
              patient access. Not from adding more services and hoping for the best.
            </p>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>• Service-line and demand alignment</li>
              <li>• Referral network and physician engagement</li>
              <li>• Commercial and payer strategy</li>
              <li>• Revenue diversification and patient experience</li>
            </ul>
          </div>
        </div>

        {/* 3 - Clinical Governance */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D4AF37] mb-3">03</p>
            <h3 className="text-2xl font-semibold mb-4">
              Clinical Governance & Accreditation
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Strong quality systems protect patients and build institutional credibility.
              We strengthen governance structures and prepare institutions for JCI, COHSASA,
              and SafeCare accreditation.
            </p>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>• Clinical governance frameworks</li>
              <li>• Accreditation readiness</li>
              <li>• Patient safety systems</li>
              <li>• Clinical audit and quality monitoring</li>
            </ul>
          </div>
          <Image
            src="/images/clinical.jpg"
            alt="Clinical governance"
            width={700}
            height={500}
            className="rounded-2xl shadow-lg object-cover"
          />
        </div>

        {/* 4 - Digital Health */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <Image
            src="/images/technology.jpg"
            alt="Digital health technology"
            width={700}
            height={500}
            className="rounded-2xl shadow-lg object-cover"
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D4AF37] mb-3">04</p>
            <h3 className="text-2xl font-semibold mb-4">
              Digital Health & Technology Leadership
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We help healthcare organisations and startups get the technology foundation
              right - from HIS selection to digital strategy to building the teams that
              actually run it.
            </p>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>• Executive dashboards and performance intelligence</li>
              <li>• HIS/EMR selection and workflow digitization</li>
              <li>• CTO-as-a-Service for healthtech ventures</li>
              <li>• Option to convert CTO fees into pre-seed equity</li>
            </ul>
          </div>
        </div>

        {/* 5 - Fractional & Secondments */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D4AF37] mb-3">05</p>
            <h3 className="text-2xl font-semibold mb-4">
              Fractional Leadership & Executive Secondments
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Not every hospital needs a full-time C-suite hire. We embed experienced
              healthcare executives on fixed-term mandates to fill leadership gaps,
              drive a specific transformation, or hold an organisation together through
              a critical transition.
            </p>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>• Fractional CEO, COO, CMO, and CTO placements</li>
              <li>• Interim Hospital Director and Medical Director roles</li>
              <li>• Project-embedded clinical and operational leads</li>
              <li>• Performance-linked fixed-term mandates</li>
            </ul>
          </div>
          <div
            className="rounded-2xl p-10 flex flex-col justify-center"
            style={{
              background: "linear-gradient(135deg, #071626 0%, #0d2540 100%)",
              minHeight: "320px",
            }}
          >
            <p className="text-white/50 text-xs uppercase tracking-widest mb-4">How it works</p>
            <p className="text-white text-lg font-semibold leading-snug mb-4">
              You get a senior operator embedded in your institution, not a consultant
              working from a slide deck.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Engagements are structured around specific outcomes and milestones.
              When the mandate is complete, we ensure a clean handover to your team.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
