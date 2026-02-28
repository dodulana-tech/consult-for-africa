import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 text-white min-h-[620px]">

      {/* Base background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f2a3d] via-[#1a3f5a] to-[#1c3f58]" />

      {/* Left readability lift */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />

      {/* Abstract SVG — replaces hero image */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="blob1" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="blob2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="38" />
          </filter>
        </defs>

        {/* Large outer teal ellipse */}
        <ellipse cx="920" cy="460" rx="560" ry="420"
          fill="#1a4060" fillOpacity="0.55" filter="url(#blob2)"
          transform="rotate(-8 920 460)" />

        {/* Medium ellipse */}
        <ellipse cx="1020" cy="370" rx="400" ry="340"
          fill="#1e4a6e" fillOpacity="0.5" filter="url(#blob1)"
          transform="rotate(-5 1020 370)" />

        {/* Inner deep circle */}
        <ellipse cx="1150" cy="300" rx="280" ry="270"
          fill="#163b57" fillOpacity="0.6" filter="url(#blob1)" />

        {/* Subtle warm highlight */}
        <ellipse cx="1090" cy="250" rx="160" ry="150"
          fill="#224e6e" fillOpacity="0.3" filter="url(#blob1)" />

        {/* Faint gold shimmer */}
        <ellipse cx="1300" cy="150" rx="200" ry="120"
          fill="#c9a84c" fillOpacity="0.04" filter="url(#blob2)" />

        {/* Diagonal lines top-left */}
        <g opacity="0.1" stroke="#5a8aaa" strokeWidth="0.8" fill="none">
          <line x1="-40" y1="120" x2="500" y2="820" />
          <line x1="20"  y1="60"  x2="560" y2="760" />
          <line x1="80"  y1="0"   x2="620" y2="700" />
          <line x1="140" y1="-40" x2="680" y2="660" />
        </g>

        {/* Arc outlines for depth */}
        <ellipse cx="920" cy="460" rx="560" ry="420"
          fill="none" stroke="#5a8aaa" strokeWidth="0.6" opacity="0.15"
          transform="rotate(-8 920 460)" />
        <ellipse cx="920" cy="460" rx="500" ry="370"
          fill="none" stroke="#5a8aaa" strokeWidth="0.4" opacity="0.08"
          transform="rotate(-8 920 460)" />
      </svg>

      <div className="relative max-w-7xl mx-auto px-6 pb-20 flex items-center min-h-[560px]">

        {/* CONTENT — full width, no image column */}
        <div className="max-w-2xl">
          <p className="uppercase tracking-[0.25em] text-xs text-white mb-6">
            Healthcare Transformation & Management Partner
          </p>

          <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
            Transforming Healthcare Performance Across Africa
          </h1>

          {/* Gold accent line */}
          <div className="mt-6 w-16 h-[2px] bg-[var(--brand-secondary)]" />

          <p className="mt-6 text-lg text-white/95 max-w-lg leading-relaxed">
            Strategy, operations, governance, capital projects, and digital
            transformation — delivered with embedded execution.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href="#contact"
              className="px-8 py-3 bg-white text-[var(--brand-primary)] rounded-lg font-semibold hover:shadow-xl hover:scale-[1.02] transition text-center"
            >
              Request Consultation
            </a>
            <Link
              href="/services"
              className="px-8 py-3 border border-white/50 rounded-lg text-white hover:bg-white/10 transition text-center"
            >
              View Capabilities
            </Link>
          </div>

          {/* Credibility metrics */}
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

      </div>
    </section>
  );
}