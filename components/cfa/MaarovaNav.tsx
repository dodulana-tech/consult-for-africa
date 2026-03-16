import Link from "next/link";

const pages = [
  { href: "/maarova/assessment", label: "The Assessment", accent: "#1A3A52" },
  { href: "/maarova/recruitment", label: "Recruitment", accent: "#2D9CDB" },
  { href: "/maarova/development", label: "Development", accent: "#D4A574" },
  { href: "/maarova/intelligence", label: "Intelligence", accent: "#10B981" },
  { href: "/maarova/services", label: "HR Services", accent: "#7C3AED" },
];

export default function MaarovaNav({ current }: { current: string }) {
  const others = pages.filter((p) => p.href !== current);

  return (
    <section className="py-16 px-6" style={{ background: "#F8FAFC", borderTop: "1px solid #e5eaf0" }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-[0.25em] text-center mb-8 text-gray-400">
          Explore Maarova
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {others.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              <div
                className="w-2 h-2 rounded-full mx-auto mb-3"
                style={{ background: p.accent }}
              />
              <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                {p.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
