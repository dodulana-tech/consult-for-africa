import Image from "next/image";

export default function CoreTransformation() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 space-y-24">

        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="uppercase tracking-[0.25em] text-xs text-gray-500 mb-4">
            Transformation Areas
          </p>

          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Where We Restore Performance & Enable Growth
          </h2>

          <p className="text-lg text-gray-600 leading-relaxed">
            Our engagements focus on the operational, financial,
            technological, and governance levers that determine whether
            healthcare institutions perform — or struggle.
          </p>
        </div>

        {/* 1 — TEXT LEFT / IMAGE RIGHT */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <h3 className="text-2xl font-semibold mb-4">
              Hospital Turnaround & Financial Recovery
            </h3>

            <p className="text-gray-600 leading-relaxed mb-4">
              When cashflow tightens and operational instability sets in,
              hospitals require decisive stabilization — not reports.
              We restore financial control, eliminate revenue leakage,
              and rebuild operational discipline.
            </p>

            <ul className="text-gray-600 space-y-2">
              <li>• Revenue capture & billing integrity</li>
              <li>• Cost discipline & procurement control</li>
              <li>• Theatre & clinic productivity improvement</li>
              <li>• Cashflow stabilization & financial visibility</li>
            </ul>
          </div>

          <Image
            src="/images/operations.jpg"
            alt="Hospital operations team"
            width={700}
            height={500}
            className="rounded-2xl shadow-lg object-cover"
          />
        </div>

        {/* 2 — IMAGE LEFT / TEXT RIGHT */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <Image
            src="/images/strategy.jpg"
            alt="Healthcare leadership strategy meeting"
            width={700}
            height={500}
            className="rounded-2xl shadow-lg object-cover"
          />

          <div>
            <h3 className="text-2xl font-semibold mb-4">
              Strategy, Growth & Commercial Performance
            </h3>

            <p className="text-gray-600 leading-relaxed mb-4">
              Growth comes from aligning clinical strengths with demand,
              referral flows, and patient access pathways — not adding services blindly.
            </p>

            <ul className="text-gray-600 space-y-2">
              <li>• Service-line & demand alignment</li>
              <li>• Referral network & physician engagement</li>
              <li>• Commercial & payer optimization</li>
              <li>• Revenue diversification & patient experience</li>
            </ul>
          </div>
        </div>

        {/* 3 — TEXT LEFT */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <h3 className="text-2xl font-semibold mb-4">
              Clinical Governance & Accreditation
            </h3>

            <p className="text-gray-600 leading-relaxed mb-4">
              Quality systems protect patients and unlock institutional credibility.
              We strengthen governance and prepare institutions for JCI, COHSASA,
              and SafeCare standards.
            </p>

            <ul className="text-gray-600 space-y-2">
              <li>• Clinical governance frameworks</li>
              <li>• Accreditation readiness</li>
              <li>• Patient safety systems</li>
              <li>• Clinical audit & quality monitoring</li>
            </ul>
          </div>

          <Image
            src="/images/clinical.jpg"
            alt="Clinical team collaboration"
            width={700}
            height={500}
            className="rounded-2xl shadow-lg object-cover"
          />
        </div>

        {/* 4 — IMAGE LEFT */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <Image
            src="/images/technology.jpg"
            alt="Digital health technology"
            width={700}
            height={500}
            className="rounded-2xl shadow-lg object-cover"
          />

          <div>
            <h3 className="text-2xl font-semibold mb-4">
              Digital Health & Technology Leadership
            </h3>

            <p className="text-gray-600 leading-relaxed mb-4">
              We enable healthcare organizations and startups with the
              technology leadership and platforms required to scale.
            </p>

            <ul className="text-gray-600 space-y-2">
              <li>• Executive dashboards & performance intelligence</li>
              <li>• HIS/EMR selection & workflow digitization</li>
              <li>• CTO-as-a-Service for healthtech ventures</li>
              <li>• Option to convert CTO fees into pre-seed equity</li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
