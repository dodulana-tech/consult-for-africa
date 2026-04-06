export default function SolutionsHero() {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ paddingTop: "5rem", minHeight: "52svh" }}
    >
      <div className="absolute inset-0" style={{ background: "#06090f" }} />

      {/* Spotlight */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 65% 80% at 85% 40%, rgba(18,140,210,0.2) 0%, rgba(10,80,140,0.07) 50%, transparent 70%)",
      }}/>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 38% 44% at 72% 4%, rgba(212,175,55,0.12) 0%, transparent 60%)",
      }}/>

      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "180px",
      }}/>

      {/* Hairlines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="sol-lv" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#06090f" stopOpacity="0.97"/>
            <stop offset="60%" stopColor="#06090f" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <line x1="560" y1="120" x2="1440" y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        <line x1="560" y1="240" x2="1440" y2="240" stroke="rgba(255,255,255,0.032)" strokeWidth="1"/>
        <line x1="560" y1="360" x2="1440" y2="360" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
        <line x1="560" y1="480" x2="1440" y2="480" stroke="rgba(255,255,255,0.018)" strokeWidth="1"/>
        <line x1="562" y1="0" x2="562" y2="600" stroke="rgba(255,255,255,0.038)" strokeWidth="1"/>
        <rect x="0" y="0" width="1440" height="600" fill="url(#sol-lv)"/>
      </svg>

      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
        <p
          className="mb-7 text-xs font-medium uppercase tracking-[0.22em]"
          style={{ color: "#D4AF37" }}
        >
          Solutions
        </p>

        <h1
          className="font-semibold leading-[1.08] tracking-tight text-white max-w-3xl"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          Solutions Built for
          <br />
          <span style={{ color: "rgba(255,255,255,0.45)" }}>
            African Healthcare
          </span>
        </h1>

        <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }}/>

        <p
          className="mt-6 max-w-lg leading-relaxed"
          style={{ fontSize: "clamp(0.95rem,1.4vw,1.1rem)", color: "rgba(255,255,255,0.55)" }}
        >
          From advisory to transformation to recruitment. Seven engagement models
          designed for the unique challenges of healthcare delivery across the continent.
        </p>
      </div>
    </section>
  );
}
