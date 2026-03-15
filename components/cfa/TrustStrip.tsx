export default function TrustStrip() {
  const items = [
    "Governance Alignment",
    "Investor Confidence",
    "Performance Accountability",
    "Institutional Strengthening",
    "Clinical Excellence",
    "Diaspora Expertise",
    "Revenue Recovery",
    "Health Systems Strengthening",
  ];

  return (
    <section className="overflow-hidden py-4" style={{ background: "#D4AF37" }}>
      <div className="whitespace-nowrap animate-scroll flex">
        {[...items, ...items].map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em] px-5"
            style={{ color: "#0F2744" }}
          >
            {item}
            <span style={{ opacity: 0.35 }}>◆</span>
          </span>
        ))}
      </div>
    </section>
  );
}
