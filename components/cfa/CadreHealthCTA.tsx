import Link from "next/link";

export default function CadreHealthCTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Dark background matching C4A visual language */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(145deg, #061424 0%, #0B3C5D 55%, #0E4D6E 100%)" }}
      />

      {/* Subtle glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60vw",
          height: "60vw",
          maxWidth: "600px",
          maxHeight: "600px",
          top: "-15%",
          left: "-10%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 60%)",
          filter: "blur(80px)",
          borderRadius: "50%",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: "50vw",
          height: "50vw",
          maxWidth: "500px",
          maxHeight: "500px",
          bottom: "-20%",
          right: "-5%",
          background:
            "radial-gradient(circle, rgba(11,60,93,0.3) 0%, transparent 60%)",
          filter: "blur(60px)",
          borderRadius: "50%",
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <p
              className="uppercase tracking-[0.22em] text-xs mb-5"
              style={{ color: "#D4AF37" }}
            >
              CadreHealth
            </p>

            <h2 className="text-2xl md:text-3xl font-semibold text-white leading-snug mb-5">
              The career platform for Nigerian
              <br />
              healthcare professionals.
            </h2>

            <div className="w-12 h-[2px] mb-6" style={{ background: "#D4AF37" }} />

            <p
              className="max-w-md leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem" }}
            >
              Real salary data. Honest hospital reviews. Verified credentials.
              Career readiness assessments. For doctors, nurses, pharmacists,
              and every healthcare cadre in between.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                href="/oncadre/readiness"
                className="px-6 py-3 rounded-lg font-semibold text-[#06090f] text-center text-sm transition hover:opacity-90"
                style={{ background: "#D4AF37" }}
              >
                Check Your Readiness Score
              </Link>
              <Link
                href="/oncadre"
                className="px-6 py-3 rounded-lg text-white text-center text-sm font-medium transition hover:bg-white/[0.08]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Learn More
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                ["4,200+", "Professionals"],
                ["73", "Hospitals"],
                ["16", "Cadres"],
              ].map(([stat, label]) => (
                <div
                  key={label}
                  className="px-4 py-2.5 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="text-sm font-semibold text-white">{stat}</p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product mockup preview */}
          <div className="hidden md:block">
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              {/* Readiness score preview */}
              <div className="flex items-center justify-between mb-5">
                <span
                  className="text-xs font-medium"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Career Readiness Score
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold"
                  style={{
                    background: "rgba(212,175,55,0.15)",
                    color: "#D4AF37",
                  }}
                >
                  CadreHealth
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "UK", pct: 43, color: "#3B82F6" },
                  { label: "US", pct: 27, color: "#8B5CF6" },
                  { label: "Canada", pct: 51, color: "#EF4444" },
                  { label: "Gulf", pct: 72, color: "#F59E0B" },
                ].map((d) => (
                  <div
                    key={d.label}
                    className="rounded-lg p-2.5 text-center"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="text-sm font-bold text-white">{d.pct}%</div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {d.label}
                    </div>
                    <div
                      className="mt-1.5 h-1 w-full rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${d.pct}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Hospital review preview */}
              <div
                className="rounded-lg p-3 mb-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      Lagos University Teaching Hospital
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      Teaching Hospital
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: "#D4AF37" }}>
                      &#9733;
                    </span>
                    <span className="text-xs font-bold text-white">3.2</span>
                    <span
                      className="text-[10px]"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      (47)
                    </span>
                  </div>
                </div>
              </div>

              {/* Salary preview */}
              <div
                className="rounded-lg p-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      Staff Nurse (Private, Lagos)
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      &#8358;200k - &#8358;500k
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">&#8358;350k</p>
                    <p
                      className="text-[10px]"
                      style={{ color: "rgba(16,185,129,0.8)" }}
                    >
                      89% paid on time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
