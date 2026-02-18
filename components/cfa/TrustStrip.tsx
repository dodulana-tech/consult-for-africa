export default function TrustStrip() {
  const items = [
    "Governance Alignment",
    "Investor Confidence",
    "Performance Accountability",
    "Institutional Strengthening",
    "Clinical Excellence",
    "Diaspora Expertise",
  ];

  return (
    <section className="bg-[var(--brand-secondary)] text-[#0F2744] py-5 overflow-hidden">
      <div className="whitespace-nowrap animate-scroll flex gap-12 font-semibold">
        {[...items, ...items].map((i, idx) => (
          <span key={idx}>{i}</span>
        ))}
      </div>
    </section>
  );
}
