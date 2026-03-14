export default function PartnerCTA() {
  return (
    <section id="contact" className="relative py-24 text-white overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #061424 0%, #0d2540 55%, #122e50 100%)" }} />

      {/* Subtle blob */}
      <div className="absolute pointer-events-none" style={{
        width: "70vw", height: "70vw", maxWidth: "700px", maxHeight: "700px",
        top: "-20%", right: "-10%",
        background: "radial-gradient(circle, rgba(26,157,217,0.14) 0%, transparent 65%)",
        filter: "blur(60px)",
        borderRadius: "50%",
      }}/>

      <div className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">

        {/* LEFT SIDE */}
        <div>
          <p className="uppercase tracking-[0.25em] text-xs text-white/55 mb-6">
            Confidential Engagement
          </p>

          <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-white mb-6">
            Partner With Consult For Africa
          </h2>

          <div className="w-16 h-[2px] bg-[var(--brand-secondary)] mb-8" />

          <p className="text-white/85 mb-10 max-w-md leading-relaxed">
            We support hospital operators, investors, development partners,
            and institutions seeking disciplined execution, institutional
            strengthening, and measurable performance transformation.
          </p>

          <div className="space-y-6 text-sm text-white/80">
            <div>
              <p className="font-semibold text-white mb-2">Engagement Areas</p>
              <ul className="space-y-1">
                <li>• Hospital management & embedded leadership</li>
                <li>• Turnaround & financial performance recovery</li>
                <li>• Strategy, service-line & revenue growth</li>
                <li>• Capital project planning & commissioning</li>
                <li>• Digital systems & performance dashboards</li>
                <li>• Public sector & PPP transformation</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">Accreditation & Quality Readiness</p>
              <ul className="space-y-1">
                <li>• JCI accreditation preparation</li>
                <li>• COHSASA accreditation readiness</li>
                <li>• SafeCare quality improvement pathways</li>
                <li>• Clinical governance & patient safety systems</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">Engagement Process</p>
              <ul className="space-y-1">
                <li>• Confidential executive review</li>
                <li>• Diagnostic & performance assessment</li>
                <li>• Scope definition & transformation pathway</li>
              </ul>
            </div>
          </div>

          <p className="mt-8 text-xs text-white/50">
            Discreet engagement • NDA available • Executive response within 48 hours
          </p>
        </div>

        {/* RIGHT SIDE - GLASS FORM */}
        <form
          action="https://formsubmit.co/hello@consultforafrica.com"
          method="POST"
          className="glass-surface rounded-2xl p-10 grid gap-5"
        >
          <input type="hidden" name="_subject" value="New CFA Executive Brief Submission" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_captcha" value="false" />

          <p className="text-sm font-semibold text-white">Executive Brief Submission</p>

          <input
            name="Organization"
            className="glass-input"
            placeholder="Organization"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <input name="Country" className="glass-input" placeholder="Country" />
            <input name="Role"    className="glass-input" placeholder="Role / Title" />
          </div>

          <input
            name="Email"
            type="email"
            className="glass-input"
            placeholder="Work Email"
            required
          />

          <select name="Project Type" className="glass-input" required>
            <option value="">Select Project Type</option>
            <option>Hospital Turnaround</option>
            <option>Performance Improvement</option>
            <option>New Hospital Development</option>
            <option>Capital Project Commissioning</option>
            <option>Accreditation & Quality Improvement</option>
            <option>Digital Health & Data Systems</option>
            <option>PPP / Public Sector Transformation</option>
            <option>Strategic Advisory</option>
            <option>Technology Platform / CTO-as-a-Service</option>
          </select>

          <select name="Budget Stage" className="glass-input">
            <option value="">Budget Stage</option>
            <option>Planning phase</option>
            <option>Budget approved</option>
            <option>Funding secured</option>
            <option>Exploring financing options</option>
          </select>

          <select name="Timeline" className="glass-input">
            <option value="">Desired Timeline</option>
            <option>Immediate (0–3 months)</option>
            <option>Near term (3–6 months)</option>
            <option>Medium term (6–12 months)</option>
            <option>Exploratory</option>
          </select>

          <textarea
            name="Project Details"
            className="glass-input"
            style={{ height: "7rem", resize: "none" }}
            placeholder="Brief description of situation or objectives"
          />

          <button
            className="py-3 rounded-lg font-semibold text-white transition hover:shadow-xl hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #0B3C5D, #1a6fa8)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            Submit Executive Brief
          </button>

          <p className="text-xs text-white/40 text-center">
            Information is confidential and reviewed only by senior leadership.
          </p>
        </form>

      </div>
    </section>
  );
}
