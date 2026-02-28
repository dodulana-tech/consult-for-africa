"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);

    const N = 80;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.45 + 0.1,
      gold: Math.random() < 0.18,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const a = (1 - dist / 120) * 0.07;
            ctx.strokeStyle = particles[i].gold || particles[j].gold
              ? `rgba(201,168,76,${a})` : `rgba(90,180,220,${a})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(201,168,76,${p.alpha})` : `rgba(122,179,210,${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <section className="relative overflow-hidden text-white" style={{ minHeight: "100svh", paddingTop: "5rem" }}>

      <style>{`
        @keyframes orb-breathe {
          0%,100% { transform:scale(1) translate(0,0); }
          33%      { transform:scale(1.07) translate(-14px,10px); }
          66%      { transform:scale(0.95) translate(10px,-8px); }
        }
        @keyframes orb-drift {
          0%,100% { transform:scale(1) translate(0,0); }
          50%      { transform:scale(1.12) translate(16px,-12px); }
        }
        @keyframes gold-pulse {
          0%,100% { opacity:.5; transform:scale(1); }
          50%      { opacity:.85; transform:scale(1.2); }
        }
        @keyframes ring-expand {
          0%   { transform:scale(0.9); opacity:.22; }
          100% { transform:scale(1.25); opacity:0; }
        }
        @keyframes path-draw {
          from { stroke-dashoffset:1000; }
          to   { stroke-dashoffset:0; }
        }
        @keyframes africa-glow {
          0%,100% { opacity:.15; filter:drop-shadow(0 0 6px rgba(201,168,76,.25)); }
          50%      { opacity:.28; filter:drop-shadow(0 0 18px rgba(201,168,76,.6)); }
        }
        @keyframes scan {
          0%   { top:0%;   opacity:.06; }
          90%  { opacity:.03; }
          100% { top:100%; opacity:0; }
        }
        .orb-1  { animation: orb-breathe 10s ease-in-out infinite; }
        .orb-2  { animation: orb-drift   13s ease-in-out infinite; }
        .orb-3  { animation: orb-breathe  8s ease-in-out infinite reverse; }
        .orb-g  { animation: gold-pulse   5s ease-in-out infinite; }
        .ring-1 { animation: ring-expand  4s ease-out infinite 0s; }
        .ring-2 { animation: ring-expand  4s ease-out infinite 1.35s; }
        .ring-3 { animation: ring-expand  4s ease-out infinite 2.7s; }
        .africa { animation: africa-glow  6s ease-in-out infinite; }
        .p1     { animation: path-draw  3.5s ease-in-out both 1.2s; }
        .p2     { animation: path-draw  4.5s ease-in-out both 1.6s; }
        .p3     { animation: path-draw  5s   ease-in-out both 2s; }
        .scan   { animation: scan       6s linear infinite; }
      `}</style>

      {/* Base */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#030d16 0%,#071e2e 45%,#0a2640 100%)" }} />

      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "160px",
      }} />

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: "radial-gradient(circle,#7ab3cc 1px,transparent 1px)",
        backgroundSize: "36px 36px",
      }} />

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Scan line */}
      <div className="scan absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg,transparent,#c9a84c,transparent)" }} />

      {/* SVG scene */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a9dd9" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#1a9dd9" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="rg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0d6a9e" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#0d6a9e" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="rg3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="rg4" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#030d16" stopOpacity="1"/>
            <stop offset="100%" stopColor="#030d16" stopOpacity="0"/>
          </radialGradient>
          <filter id="blur-xl"><feGaussianBlur stdDeviation="55"/></filter>
          <filter id="blur-md"><feGaussianBlur stdDeviation="25"/></filter>
          <filter id="blur-sm"><feGaussianBlur stdDeviation="12"/></filter>
          <linearGradient id="lv" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#030d16" stopOpacity="0.92"/>
            <stop offset="52%" stopColor="#030d16" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="bv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="55%" stopColor="#030d16" stopOpacity="0"/>
            <stop offset="100%" stopColor="#030d16" stopOpacity="0.8"/>
          </linearGradient>
        </defs>

        {/* Orbs */}
        <ellipse cx="1100" cy="390" rx="560" ry="530" fill="url(#rg4)" filter="url(#blur-xl)" className="orb-3"/>
        <ellipse cx="1060" cy="310" rx="390" ry="390" fill="url(#rg1)" filter="url(#blur-xl)" className="orb-1"/>
        <ellipse cx="1310" cy="520" rx="290" ry="290" fill="url(#rg2)" filter="url(#blur-xl)" className="orb-2"/>
        <ellipse cx="950"  cy="130" rx="145" ry="145" fill="url(#rg3)" filter="url(#blur-md)" className="orb-g"/>
        <ellipse cx="1350" cy="200" rx="80"  ry="80"  fill="url(#rg3)" filter="url(#blur-sm)" className="orb-g"/>

        {/* Pulsing rings */}
        <ellipse cx="1060" cy="310" rx="360" ry="360" fill="none" stroke="#5ab4d9" strokeWidth="1.2" className="ring-1"/>
        <ellipse cx="1060" cy="310" rx="360" ry="360" fill="none" stroke="#5ab4d9" strokeWidth="1.2" className="ring-2"/>
        <ellipse cx="1060" cy="310" rx="360" ry="360" fill="none" stroke="#5ab4d9" strokeWidth="1.2" className="ring-3"/>

        {/* Static halos */}
        {[480,400,320,240,160].map((r,i) => (
          <ellipse key={r} cx="1060" cy="310" rx={r} ry={r}
            fill="none" stroke="#5ab4d9" strokeWidth="0.5" opacity={0.03+i*0.02}/>
        ))}

        {/* Animated paths */}
        <path className="p1" d="M-50 680 C 250 480 550 320 820 440 S 1150 210 1490 190"
          fill="none" stroke="#4ab0d6" strokeWidth="1.4" opacity="0.22"
          strokeDasharray="1000" strokeDashoffset="1000"/>
        <path className="p2" d="M-50 520 C 300 370 600 500 900 370 S 1200 510 1490 390"
          fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.18"
          strokeDasharray="1000" strokeDashoffset="1000"/>
        <path className="p3" d="M-50 800 C 260 620 560 720 860 580 S 1160 700 1490 620"
          fill="none" stroke="#4ab0d6" strokeWidth="0.7" opacity="0.1"
          strokeDasharray="1000" strokeDashoffset="1000"/>

        {/*
          ── Accurate Africa silhouette ──
          Proper outline: Mediterranean top, Sinai/Horn east,
          Gulf of Guinea west-coast indent, Cape at bottom.
          viewBox coords, centered ~(960,450), scale ~0.9
        */}
        <g className="africa" transform="translate(680, 55) scale(0.82)">
          {/* Mainland */}
          <path
            fill="none"
            stroke="#c9a84c"
            strokeWidth="2"
            strokeLinejoin="round"
            d="
              M 200 18
              L 232 12
              L 268 10
              L 300 14
              L 328 20
              L 352 16
              L 375 10
              L 395 14
              L 408 26
              L 412 44
              L 418 58
              C 420 65 416 74 410 80
              L 402 90
              L 406 100
              C 414 112 422 122 428 135
              L 435 152
              L 440 170
              C 442 180 440 190 436 198
              L 428 210
              C 436 220 446 232 450 246
              L 453 262
              L 452 278
              C 450 292 444 305 436 315
              L 424 328
              L 416 344
              L 410 362
              L 406 382
              L 402 403
              L 395 425
              L 384 447
              L 370 468
              L 353 488
              L 333 507
              L 312 524
              L 290 540
              L 270 554
              L 252 566
              L 238 576
              C 230 580 222 578 216 572
              L 204 558
              L 190 540
              L 174 520
              L 157 498
              L 140 474
              L 124 448
              L 110 420
              L 98  390
              L 90  358
              L 85  326
              L 82  294
              L 82  262
              C 82 246 86 232 92 220
              L 100 206
              C 96 196 90 186 86 175
              L 82 162
              C 80 150 82 138 88 128
              L 96 118
              L 100 106
              C 98 96 94 86 90 76
              L 86 62
              C 86 50 92 40 102 32
              L 118 22
              L 140 16
              L 165 13
              Z
            "
          />
          {/* Madagascar */}
          <path
            fill="none"
            stroke="#c9a84c"
            strokeWidth="1.5"
            strokeLinejoin="round"
            d="
              M 482 230
              L 494 242
              L 502 258
              L 508 278
              L 510 300
              L 508 322
              L 502 342
              L 492 356
              L 480 362
              L 470 354
              L 464 338
              L 462 316
              L 464 294
              L 468 272
              L 474 252
              Z
            "
          />
          {/* Sinai peninsula */}
          <path
            fill="none"
            stroke="#c9a84c"
            strokeWidth="1.2"
            opacity="0.7"
            d="M 412 44 L 424 36 L 430 44 L 422 56 Z"
          />
          {/* City dots */}
          {[
            [200, 18],   // Casablanca / Morocco
            [310, 100],  // Libya / Tripoli
            [406, 100],  // Cairo area
            [280, 220],  // Nigeria / Lagos
            [180, 260],  // Ghana/Accra
            [340, 300],  // Kenya/Nairobi
            [220, 430],  // Angola
            [290, 500],  // Mozambique
            [220, 540],  // Zambia
            [238, 576],  // Cape Town
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill="#c9a84c" opacity="0.45"/>
          ))}
        </g>

        {/* Health cross motifs */}
        {[[860,195],[1365,460],[775,535],[1215,115],[1390,270]].map(([cx,cy],i) => (
          <g key={i} opacity="0.14" transform={`translate(${cx},${cy})`}>
            <line x1="-9" y1="0" x2="9" y2="0" stroke="#7ab3cc" strokeWidth="1.5"/>
            <line x1="0" y1="-9" x2="0" y2="9" stroke="#7ab3cc" strokeWidth="1.5"/>
          </g>
        ))}

        {/* Vignettes */}
        <rect x="0" y="0" width="1440" height="900" fill="url(#lv)"/>
        <rect x="0" y="0" width="1440" height="900" fill="url(#bv)"/>
      </svg>

      {/* ── Content ── */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex items-center"
        style={{ minHeight: "calc(100svh - 5rem)" }}>
        <div className="w-full max-w-xl lg:max-w-2xl">

          <p className="uppercase tracking-[0.25em] text-xs text-white mb-6">
            Healthcare Transformation & Management Partner
          </p>

          <h1 className="font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
            style={{ fontSize: "clamp(2rem, 5.5vw, 3.75rem)" }}>
            Transforming Healthcare Performance Across Africa
          </h1>

          {/* Gold accent line */}
          <div className="mt-6 w-16 h-[2px] bg-[var(--brand-secondary)]" />

          <p className="mt-6 text-white/95 max-w-lg leading-relaxed"
            style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.125rem)" }}>
            Strategy, operations, governance, capital projects, and digital
            transformation — delivered with embedded execution.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a href="#contact"
              className="px-8 py-3 bg-white text-[var(--brand-primary)] rounded-lg font-semibold hover:shadow-xl hover:scale-[1.02] transition text-center">
              Request Consultation
            </a>
            <Link href="/services"
              className="px-8 py-3 border border-white/50 rounded-lg text-white hover:bg-white/10 transition text-center">
              View Capabilities
            </Link>
          </div>

          {/* Credibility metrics */}
          <div className="mt-14 flex flex-wrap gap-8 sm:gap-10 text-sm">
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