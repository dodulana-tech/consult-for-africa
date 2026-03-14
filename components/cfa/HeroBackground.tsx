/**
 * Shared background for all page hero sections.
 * Renders: near-black base, teal/blue/gold spotlights,
 * grain, dot grid, animated flow lines, and vignettes.
 */
export default function HeroBackground() {
  return (
    <>
      <style>{`
        @keyframes cfa-line-draw {
          from { stroke-dashoffset: var(--len, 1200); }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes cfa-line-fade {
          0%,100% { opacity: var(--base-op, 0.18); }
          50%      { opacity: calc(var(--base-op, 0.18) * 1.75); }
        }
        @keyframes cfa-spot {
          0%,100% { opacity: 1; }
          50%      { opacity: .72; }
        }
        .cfa-ld   { animation: cfa-line-draw var(--dur,3.5s) ease-in-out both var(--delay,0s); }
        .cfa-lf   { animation: cfa-line-fade var(--cycle,8s) ease-in-out infinite var(--fdelay,0s); }
        .cfa-spot { animation: cfa-spot 10s ease-in-out infinite; will-change: opacity; }
      `}</style>

      {/* Base */}
      <div className="absolute inset-0" style={{ background: "#06090f" }} />

      {/* Teal spotlight */}
      <div
        className="cfa-spot absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 80% at 88% 30%, rgba(18,160,220,0.26) 0%, rgba(10,90,160,0.1) 45%, transparent 68%)",
        }}
      />

      {/* Deep blue lower right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 95% 75%, rgba(30,80,210,0.16) 0%, transparent 60%)",
        }}
      />

      {/* Gold whisper top right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 38% 42% at 72% 0%, rgba(201,168,76,0.14) 0%, transparent 65%)",
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.038,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.028,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Flow lines + vignettes */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cfa-lv" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#06090f" stopOpacity="0.97"/>
            <stop offset="62%" stopColor="#06090f" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="cfa-bv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="55%" stopColor="#06090f" stopOpacity="0"/>
            <stop offset="100%" stopColor="#06090f" stopOpacity="0.9"/>
          </linearGradient>
        </defs>

        {/* Teal lines */}
        <path className="cfa-ld cfa-lf"
          style={{ "--len":"1400","--dur":"3.6s","--delay":"0.3s","--base-op":"0.22","--cycle":"9s","--fdelay":"0s" } as React.CSSProperties}
          d="M 600 900 C 720 720 860 560 980 420 S 1180 210 1490 120"
          fill="none" stroke="rgba(28,170,230,1)" strokeWidth="1.1"
          strokeDasharray="1400" strokeDashoffset="1400"/>
        <path className="cfa-ld cfa-lf"
          style={{ "--len":"1300","--dur":"4s","--delay":"0.7s","--base-op":"0.13","--cycle":"11s","--fdelay":"1.5s" } as React.CSSProperties}
          d="M 500 900 C 640 700 800 580 940 460 S 1160 290 1490 220"
          fill="none" stroke="rgba(28,170,230,1)" strokeWidth="0.7"
          strokeDasharray="1300" strokeDashoffset="1300"/>
        <path className="cfa-ld cfa-lf"
          style={{ "--len":"1500","--dur":"4.5s","--delay":"1.1s","--base-op":"0.09","--cycle":"13s","--fdelay":"3s" } as React.CSSProperties}
          d="M 700 900 C 820 740 940 620 1060 490 S 1260 300 1490 240"
          fill="none" stroke="rgba(28,170,230,1)" strokeWidth="0.5"
          strokeDasharray="1500" strokeDashoffset="1500"/>

        {/* Blue lines */}
        <path className="cfa-ld cfa-lf"
          style={{ "--len":"1600","--dur":"5s","--delay":"0.5s","--base-op":"0.15","--cycle":"12s","--fdelay":"2s" } as React.CSSProperties}
          d="M 300 900 C 500 730 760 600 960 500 S 1220 360 1490 300"
          fill="none" stroke="rgba(60,110,220,1)" strokeWidth="0.9"
          strokeDasharray="1600" strokeDashoffset="1600"/>
        <path className="cfa-ld cfa-lf"
          style={{ "--len":"1700","--dur":"5.5s","--delay":"1s","--base-op":"0.08","--cycle":"15s","--fdelay":"4s" } as React.CSSProperties}
          d="M 200 900 C 420 700 700 620 920 520 S 1210 400 1490 360"
          fill="none" stroke="rgba(60,110,220,1)" strokeWidth="0.5"
          strokeDasharray="1700" strokeDashoffset="1700"/>

        {/* Gold lines */}
        <path className="cfa-ld cfa-lf"
          style={{ "--len":"1300","--dur":"4.2s","--delay":"1.4s","--base-op":"0.17","--cycle":"10s","--fdelay":"0.5s" } as React.CSSProperties}
          d="M 800 900 C 920 700 1040 560 1140 420 S 1310 220 1490 160"
          fill="none" stroke="rgba(201,168,76,1)" strokeWidth="1"
          strokeDasharray="1300" strokeDashoffset="1300"/>
        <path className="cfa-ld cfa-lf"
          style={{ "--len":"1200","--dur":"3.8s","--delay":"2s","--base-op":"0.09","--cycle":"14s","--fdelay":"5s" } as React.CSSProperties}
          d="M 900 900 C 1010 740 1120 600 1210 460 S 1360 280 1490 200"
          fill="none" stroke="rgba(201,168,76,1)" strokeWidth="0.6"
          strokeDasharray="1200" strokeDashoffset="1200"/>

        {/* Horizontal hairlines */}
        <line x1="580" y1="280" x2="1490" y2="280" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
        <line x1="580" y1="460" x2="1490" y2="460" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
        <line x1="580" y1="640" x2="1490" y2="640" stroke="rgba(255,255,255,0.02)"  strokeWidth="1"/>

        {/* Vignettes */}
        <rect x="0" y="0" width="1440" height="900" fill="url(#cfa-lv)"/>
        <rect x="0" y="0" width="1440" height="900" fill="url(#cfa-bv)"/>
      </svg>
    </>
  );
}
