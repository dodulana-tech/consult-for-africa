"use client";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ minHeight: "100svh", paddingTop: "5rem" }}
    >
      <style>{`
        @keyframes line-draw {
          from { stroke-dashoffset: var(--len, 1200); }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes line-fade {
          0%,100% { opacity: var(--base-op, 0.2); }
          50%      { opacity: calc(var(--base-op, 0.2) * 1.8); }
        }
        @keyframes spot-breathe {
          0%,100% { opacity: 1; }
          50%      { opacity: .7; }
        }
        .ld { animation: line-draw var(--dur,3.5s) ease-in-out both var(--delay,0s); }
        .lf { animation: line-fade var(--cycle,7s) ease-in-out infinite var(--fdelay,0s); }
        .spot { animation: spot-breathe 10s ease-in-out infinite; will-change: opacity; }
      `}</style>

      {/* Base */}
      <div className="absolute inset-0" style={{ background: "#06090f" }} />

      {/* Main teal spotlight */}
      <div
        className="spot absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 68% 88% at 88% 30%, rgba(18,160,220,0.34) 0%, rgba(10,90,160,0.12) 42%, transparent 65%)",
        }}
      />

      {/* Cyan flash top right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 42% 48% at 80% -2%, rgba(0,210,255,0.18) 0%, transparent 52%)",
        }}
      />

      {/* Gold accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 36% 42% at 68% 6%, rgba(212,175,55,0.18) 0%, transparent 60%)",
        }}
      />

      {/* Deep blue lower right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 52% 58% at 96% 82%, rgba(30,80,210,0.18) 0%, transparent 60%)",
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

      {/* SVG line system */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lv" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#06090f" stopOpacity="0.97"/>
            <stop offset="60%" stopColor="#06090f" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="bv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="52%" stopColor="#06090f" stopOpacity="0"/>
            <stop offset="100%" stopColor="#06090f" stopOpacity="0.9"/>
          </linearGradient>
        </defs>

        {/* Teal sweep lines */}
        <path
          className="ld lf"
          style={{ "--len":"1400","--dur":"3.4s","--delay":"0.2s","--base-op":"0.38","--cycle":"9s","--fdelay":"0s" } as React.CSSProperties}
          d="M 550 900 C 680 720 820 570 960 430 S 1170 200 1490 110"
          fill="none" stroke="rgba(28,170,230,1)" strokeWidth="1.3"
          strokeDasharray="1400" strokeDashoffset="1400"
        />
        <path
          className="ld lf"
          style={{ "--len":"1320","--dur":"4s","--delay":"0.6s","--base-op":"0.22","--cycle":"11s","--fdelay":"1.2s" } as React.CSSProperties}
          d="M 450 900 C 600 700 760 575 920 455 S 1140 265 1490 185"
          fill="none" stroke="rgba(28,170,230,1)" strokeWidth="0.9"
          strokeDasharray="1320" strokeDashoffset="1320"
        />
        <path
          className="ld lf"
          style={{ "--len":"1480","--dur":"4.6s","--delay":"1s","--base-op":"0.14","--cycle":"13s","--fdelay":"2.5s" } as React.CSSProperties}
          d="M 660 900 C 780 740 900 610 1025 490 S 1225 285 1490 210"
          fill="none" stroke="rgba(28,170,230,1)" strokeWidth="0.7"
          strokeDasharray="1480" strokeDashoffset="1480"
        />
        <path
          className="ld lf"
          style={{ "--len":"1550","--dur":"5s","--delay":"1.5s","--base-op":"0.09","--cycle":"15s","--fdelay":"4s" } as React.CSSProperties}
          d="M 710 900 C 820 752 940 642 1048 522 S 1244 336 1490 268"
          fill="none" stroke="rgba(28,170,230,1)" strokeWidth="0.5"
          strokeDasharray="1550" strokeDashoffset="1550"
        />

        {/* Cyan accent lines */}
        <path
          className="ld lf"
          style={{ "--len":"1280","--dur":"3.8s","--delay":"1.8s","--base-op":"0.32","--cycle":"10s","--fdelay":"0.8s" } as React.CSSProperties}
          d="M 860 900 C 960 740 1060 600 1155 460 S 1325 242 1490 158"
          fill="none" stroke="rgba(0,210,255,1)" strokeWidth="1.1"
          strokeDasharray="1280" strokeDashoffset="1280"
        />
        <path
          className="ld lf"
          style={{ "--len":"1200","--dur":"4.2s","--delay":"2.2s","--base-op":"0.16","--cycle":"12s","--fdelay":"3s" } as React.CSSProperties}
          d="M 960 900 C 1055 762 1145 625 1236 485 S 1382 274 1490 202"
          fill="none" stroke="rgba(0,210,255,1)" strokeWidth="0.6"
          strokeDasharray="1200" strokeDashoffset="1200"
        />

        {/* Blue depth lines */}
        <path
          className="ld lf"
          style={{ "--len":"1600","--dur":"5.2s","--delay":"0.4s","--base-op":"0.18","--cycle":"12s","--fdelay":"2s" } as React.CSSProperties}
          d="M 300 900 C 500 730 755 600 955 500 S 1215 362 1490 302"
          fill="none" stroke="rgba(60,110,220,1)" strokeWidth="0.9"
          strokeDasharray="1600" strokeDashoffset="1600"
        />
        <path
          className="ld lf"
          style={{ "--len":"1700","--dur":"5.8s","--delay":"0.9s","--base-op":"0.1","--cycle":"16s","--fdelay":"4.5s" } as React.CSSProperties}
          d="M 200 900 C 420 700 705 625 922 522 S 1205 405 1490 362"
          fill="none" stroke="rgba(60,110,220,1)" strokeWidth="0.5"
          strokeDasharray="1700" strokeDashoffset="1700"
        />
        <path
          className="ld lf"
          style={{ "--len":"1750","--dur":"6s","--delay":"1.3s","--base-op":"0.06","--cycle":"18s","--fdelay":"6s" } as React.CSSProperties}
          d="M 100 900 C 340 700 640 640 875 545 S 1190 440 1490 410"
          fill="none" stroke="rgba(60,110,220,1)" strokeWidth="0.4"
          strokeDasharray="1750" strokeDashoffset="1750"
        />

        {/* Gold accent lines */}
        <path
          className="ld lf"
          style={{ "--len":"1280","--dur":"4s","--delay":"1.2s","--base-op":"0.34","--cycle":"10s","--fdelay":"0.4s" } as React.CSSProperties}
          d="M 780 900 C 900 700 1022 558 1122 420 S 1302 218 1490 152"
          fill="none" stroke="rgba(212,175,55,1)" strokeWidth="1.2"
          strokeDasharray="1280" strokeDashoffset="1280"
        />
        <path
          className="ld lf"
          style={{ "--len":"1200","--dur":"4.4s","--delay":"1.8s","--base-op":"0.2","--cycle":"11s","--fdelay":"2s" } as React.CSSProperties}
          d="M 872 900 C 982 742 1092 602 1188 462 S 1353 268 1490 196"
          fill="none" stroke="rgba(212,175,55,1)" strokeWidth="0.8"
          strokeDasharray="1200" strokeDashoffset="1200"
        />
        <path
          className="ld lf"
          style={{ "--len":"1350","--dur":"5s","--delay":"2.4s","--base-op":"0.11","--cycle":"14s","--fdelay":"5s" } as React.CSSProperties}
          d="M 682 900 C 802 722 922 598 1042 468 S 1232 274 1490 208"
          fill="none" stroke="rgba(212,175,55,1)" strokeWidth="0.5"
          strokeDasharray="1350" strokeDashoffset="1350"
        />

        {/* Horizontal structural lines */}
        <line x1="560" y1="160" x2="1490" y2="160" stroke="rgba(255,255,255,0.055)" strokeWidth="1"/>
        <line x1="560" y1="280" x2="1490" y2="280" stroke="rgba(255,255,255,0.048)" strokeWidth="1"/>
        <line x1="560" y1="390" x2="1490" y2="390" stroke="rgba(255,255,255,0.038)" strokeWidth="1"/>
        <line x1="560" y1="500" x2="1490" y2="500" stroke="rgba(255,255,255,0.030)" strokeWidth="1"/>
        <line x1="560" y1="620" x2="1490" y2="620" stroke="rgba(255,255,255,0.022)" strokeWidth="1"/>
        <line x1="560" y1="740" x2="1490" y2="740" stroke="rgba(255,255,255,0.015)" strokeWidth="1"/>

        {/* Vertical divider */}
        <line x1="562" y1="0" x2="562" y2="900" stroke="rgba(255,255,255,0.045)" strokeWidth="1"/>

        {/* Vignettes */}
        <rect x="0" y="0" width="1440" height="900" fill="url(#lv)"/>
        <rect x="0" y="0" width="1440" height="900" fill="url(#bv)"/>
      </svg>

      {/* Content */}
      <div
        className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex items-center"
        style={{ minHeight: "calc(100svh - 5rem)" }}
      >
        <div className="w-full max-w-xl lg:max-w-2xl">

          {/* Eyebrow */}
          <p
            className="mb-8 text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: "#D4AF37" }}
          >
            Healthcare Transformation &amp; Management
          </p>

          <h1
            className="font-semibold leading-[1.08] tracking-tight text-white"
            style={{ fontSize: "clamp(2.1rem, 5.5vw, 3.85rem)" }}
          >
            Transforming Healthcare
            <br />
            <span style={{ color: "rgba(255,255,255,0.62)" }}>
              Performance Across Africa
            </span>
          </h1>

          <div className="mt-7 w-12 h-[2px]" style={{ background: "#D4AF37" }}/>

          <p
            className="mt-6 max-w-lg leading-relaxed"
            style={{
              fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Strategy, operations, governance, and capital projects.
            Delivered by people who actually execute.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a
              href="#contact"
              className="px-7 py-3 rounded-lg font-semibold text-[#06090f] text-center transition hover:opacity-90 hover:scale-[1.01]"
              style={{ background: "#ffffff" }}
            >
              Request Consultation
            </a>
            <Link
              href="/services"
              className="px-7 py-3 rounded-lg text-white text-center transition hover:bg-white/[0.1] text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              View Capabilities
            </Link>
          </div>

          {/* Metrics */}
          <div className="mt-14 flex flex-wrap gap-2.5">
            {[
              ["60+ yrs",       "combined leadership"],
              ["Pan-African",   "operational context"],
              ["Execution-led", "embedded operators"],
            ].map(([stat, label]) => (
              <div
                key={stat}
                className="px-4 py-3 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-base font-semibold text-white">{stat}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
