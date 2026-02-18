import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 text-white min-h-[620px]">

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#12324A] via-[#1F4D6F] to-[#3E7FA6]" />

      {/* Left readability lift */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-14 items-center">

        {/* LEFT CONTENT */}
        <div>
          <p className="uppercase tracking-[0.25em] text-xs text-white mb-6">
            Healthcare Transformation & Management Partner
          </p>

          <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
            Transforming Healthcare Performance Across Africa
          </h1>

          {/* accent line */}
          <div className="mt-6 w-16 h-[2px] bg-[var(--brand-secondary)]" />

          <p className="mt-6 text-lg text-white/95 max-w-lg leading-relaxed">
            Strategy, operations, governance, capital projects, and digital
            transformation — delivered with embedded execution.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-3 bg-white text-[var(--brand-primary)] rounded-lg font-semibold hover:shadow-xl hover:scale-[1.02] transition">
              Request Consultation
            </button>

            <button className="px-8 py-3 border border-white/70 rounded-lg text-white hover:bg-white/10 transition">
              View Capabilities
            </button>
          </div>

          {/* credibility metrics */}
          <div className="mt-14 flex gap-10 text-sm">
            <div>
              <p className="text-xl font-semibold text-white">60+ yrs</p>
              <p className="text-white/85">combined leadership</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">Pan-African</p>
              <p className="text-white/85">operational context</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">Execution-led</p>
              <p className="text-white/85">embedded operators</p>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative w-full max-w-lg mx-auto md:mx-0">
          <Image
            src="/hero-hospital.jpg"
            alt="Healthcare leadership team"
            width={900}
            height={650}
            priority
            className="rounded-2xl shadow-2xl object-cover h-[420px] md:h-[480px] w-full"
          />
        </div>

      </div>
    </section>
  );
}
