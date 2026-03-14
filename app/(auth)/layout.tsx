export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* ── Eccentric background pattern ── */}

      {/* Large arc — top left */}
      <svg className="absolute pointer-events-none" style={{ top: -160, left: -160, opacity: 0.06 }} width="520" height="520" viewBox="0 0 520 520" fill="none">
        <circle cx="260" cy="260" r="240" stroke="#0F2744" strokeWidth="1.5" />
        <circle cx="260" cy="260" r="190" stroke="#0F2744" strokeWidth="1" />
        <circle cx="260" cy="260" r="140" stroke="#D4AF37" strokeWidth="1.5" />
        <circle cx="260" cy="260" r="90" stroke="#0F2744" strokeWidth="1" />
      </svg>

      {/* Large arc — bottom right */}
      <svg className="absolute pointer-events-none" style={{ bottom: -200, right: -200, opacity: 0.06 }} width="560" height="560" viewBox="0 0 560 560" fill="none">
        <circle cx="280" cy="280" r="260" stroke="#D4AF37" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="210" stroke="#0F2744" strokeWidth="1" />
        <circle cx="280" cy="280" r="160" stroke="#D4AF37" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="110" stroke="#0F2744" strokeWidth="1" />
        <circle cx="280" cy="280" r="60" stroke="#D4AF37" strokeWidth="1" />
      </svg>

      {/* Diagonal ruled lines — top right quadrant */}
      <svg className="absolute pointer-events-none" style={{ top: 0, right: 0, opacity: 0.04 }} width="500" height="400" viewBox="0 0 500 400" fill="none">
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={i} x1={i * 30 - 40} y1="0" x2={i * 30 + 360} y2="400" stroke="#0F2744" strokeWidth="1" />
        ))}
      </svg>

      {/* Diagonal ruled lines — bottom left quadrant */}
      <svg className="absolute pointer-events-none" style={{ bottom: 0, left: 0, opacity: 0.04 }} width="420" height="340" viewBox="0 0 420 340" fill="none">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={i * 32 - 40} y1="0" x2={i * 32 + 300} y2="340" stroke="#0F2744" strokeWidth="1" />
        ))}
      </svg>

      {/* Scattered dots — right edge */}
      <svg className="absolute pointer-events-none" style={{ top: "15%", right: 32, opacity: 0.12 }} width="80" height="260" viewBox="0 0 80 260" fill="none">
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 4 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 18 + 8} cy={row * 52 + 10} r="2.5" fill="#0F2744" />
          ))
        )}
      </svg>

      {/* Scattered dots — left edge */}
      <svg className="absolute pointer-events-none" style={{ bottom: "18%", left: 32, opacity: 0.12 }} width="80" height="200" viewBox="0 0 80 200" fill="none">
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 4 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 18 + 8} cy={row * 46 + 10} r="2.5" fill="#D4AF37" />
          ))
        )}
      </svg>

      {/* Gold cross — top right */}
      <svg className="absolute pointer-events-none" style={{ top: 48, right: 80, opacity: 0.18 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="0" x2="12" y2="24" stroke="#D4AF37" strokeWidth="1.5" />
        <line x1="0" y1="12" x2="24" y2="12" stroke="#D4AF37" strokeWidth="1.5" />
      </svg>

      {/* Navy cross — bottom left */}
      <svg className="absolute pointer-events-none" style={{ bottom: 64, left: 100, opacity: 0.14 }} width="20" height="20" viewBox="0 0 20 20" fill="none">
        <line x1="10" y1="0" x2="10" y2="20" stroke="#0F2744" strokeWidth="1.5" />
        <line x1="0" y1="10" x2="20" y2="10" stroke="#0F2744" strokeWidth="1.5" />
      </svg>

      {/* Rotated square — mid left */}
      <svg className="absolute pointer-events-none" style={{ top: "42%", left: 48, opacity: 0.08 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <rect x="10" y="10" width="40" height="40" stroke="#0F2744" strokeWidth="1.5" transform="rotate(20 30 30)" />
        <rect x="18" y="18" width="24" height="24" stroke="#D4AF37" strokeWidth="1" transform="rotate(20 30 30)" />
      </svg>

      {/* Rotated square — mid right */}
      <svg className="absolute pointer-events-none" style={{ top: "55%", right: 56, opacity: 0.07 }} width="50" height="50" viewBox="0 0 50 50" fill="none">
        <rect x="8" y="8" width="34" height="34" stroke="#D4AF37" strokeWidth="1.5" transform="rotate(-15 25 25)" />
        <rect x="16" y="16" width="18" height="18" stroke="#0F2744" strokeWidth="1" transform="rotate(-15 25 25)" />
      </svg>

      {/* Thin horizontal rule — top */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(15,39,68,0.12) 30%, rgba(212,175,55,0.2) 60%, transparent)", opacity: 0.8 }} />

      {/* Thin horizontal rule — bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(15,39,68,0.12) 30%, rgba(212,175,55,0.2) 60%, transparent)", opacity: 0.8 }} />

      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
