import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0B2236] text-white">

      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-12">

        {/* BRAND */}
        <div>
          <Link href="/" className="font-semibold text-lg mb-4 inline-block">
            Consult For Africa
          </Link>

          <p className="text-white/70 text-sm leading-relaxed">
            Healthcare transformation and hospital performance improvement
            across Africa through disciplined execution, governance
            strengthening, and operational excellence.
          </p>

          <p className="mt-6 text-sm text-white/60">
            Pan-African operations • Global partnerships
          </p>
        </div>

        {/* SERVICES */}
        <div>
          <p className="font-semibold mb-4 text-sm uppercase tracking-wide">
            Services
          </p>

          <ul className="space-y-2 text-white/70 text-sm">
            {[
              "Hospital Turnaround",
              "Performance Improvement",
              "Capital Project Development",
              "Digital Health & Data Systems",
              "Accreditation Readiness",
            ].map((item) => (
              <li key={item}>
                <Link
                  href="/services"
                  className="hover:text-white transition-colors duration-200"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* NETWORK */}
        <div>
          <p className="font-semibold mb-4 text-sm uppercase tracking-wide">
            Network
          </p>

          <ul className="space-y-2 text-white/70 text-sm">
            <li>
              <a href="#network" className="hover:text-white transition-colors">
                Partner Hospitals
              </a>
            </li>
            <li>
              <a href="#network" className="hover:text-white transition-colors">
                Clinical & Diaspora Experts
              </a>
            </li>
            <li>
              <a href="#network" className="hover:text-white transition-colors">
                Development Partners
              </a>
            </li>
            <li>
              <a href="#network" className="hover:text-white transition-colors">
                Investor Network
              </a>
            </li>
            <li>
              <a href="#insights" className="hover:text-white transition-colors">
                Knowledge & Insights
              </a>
            </li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <p className="font-semibold mb-4 text-sm uppercase tracking-wide">
            Contact
          </p>

          <ul className="space-y-2 text-white/70 text-sm">
            <li>
              <a href="#contact" className="hover:text-white transition-colors">
                Partner With Us
              </a>
            </li>
            <li>Abuja • Lagos</li>

            <li>
              <a
                href="mailto:hello@consultforafrica.com"
                className="hover:text-white transition-colors"
              >
                hello@consultforafrica.com
              </a>
            </li>

            <li>Executive response within 48 hours</li>
          </ul>

          <p className="mt-6 text-xs text-white/50">
            Confidential engagements • NDA available upon request
          </p>
        </div>
      </div>

      {/* LOWER BAR */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-white/60 gap-4">

          <div className="text-center md:text-left">
            © {new Date().getFullYear()} Consult For Africa. All rights reserved.
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-6">
            <Link href="/services" className="hover:text-white transition">
              Services
            </Link>

            <a href="#process" className="hover:text-white transition">
              Process
            </a>

            <a href="#network" className="hover:text-white transition">
              Network
            </a>

            <a href="#contact" className="hover:text-white transition">
              Partner
            </a>
          </div>
        </div>
      </div>

    </footer>
  );
}
