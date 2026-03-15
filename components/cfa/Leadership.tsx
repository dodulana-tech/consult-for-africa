import Image from "next/image";
import Link from "next/link";

const credentials = [
  { label: "MBBS", detail: "Medical Doctor" },
  { label: "MSc", detail: "International Health Management, Imperial College London" },
  { label: "15+ yrs", detail: "Africa health system leadership" },
];

const bullets = [
  "CEO, Cedarcrest Hospitals Abuja",
  "Chief Innovation & Strategy Officer, Evercare Hospital Lekki",
  "Founder, Doctoora — Africa's first integrated private healthcare network (21 states)",
  "Led hospital turnarounds restoring financial performance in constrained environments",
];

export default function Leadership() {
  return (
    <section className="py-24 px-6" style={{ background: "#F8FAFC" }}>
      <div className="max-w-5xl mx-auto">
        <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Founding Partner</p>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-14">
          Built by Someone Who Has Done It
        </h2>

        <div
          className="rounded-2xl overflow-hidden grid md:grid-cols-[260px_1fr]"
          style={{ border: "1px solid #e5eaf0", background: "#fff", boxShadow: "0 4px 32px rgba(11,60,93,0.07)" }}
        >
          {/* Photo */}
          <div className="relative" style={{ minHeight: "320px" }}>
            <Image
              src="/debo-odulana.jpg"
              alt="Dr. Debo Odulana"
              fill
              className="object-cover object-top"
            />
          </div>

          {/* Bio */}
          <div className="p-8 md:p-10">
            <div className="flex flex-wrap gap-2 mb-6">
              {credentials.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "#EFF6FF", color: "#0B3C5D" }}
                >
                  <span className="font-bold">{c.label}</span>
                  <span style={{ color: "#0B3C5D", opacity: 0.6 }}>{c.detail}</span>
                </span>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: "#D4AF37" }}>
              Founding Partner
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Dr. Debo Odulana</h3>
            <div className="w-8 h-[2px] mb-5" style={{ background: "#D4AF37" }} />

            <ul className="space-y-3 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#D4AF37" }} />
                  {b}
                </li>
              ))}
            </ul>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: "#0B3C5D" }}
            >
              Full profile on About page
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
