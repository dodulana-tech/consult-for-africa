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
            Pan-African operations · Global partnerships
          </p>
        </div>

        {/* SERVICES — each links to the services page */}
        <div>
          <p className="font-semibold mb-4 text-sm uppercase tracking-wide">
            Services
          </p>

          <ul className="space-y-2 text-white/70 text-sm">
            {[
              { label: "Hospital Turnaround", href: "/turnaround" },
              { label: "Strategy & Growth", href: "/services" },
              { label: "Clinical Governance", href: "/services" },
              { label: "Digital Health & Data", href: "/services" },
              { label: "Healthcare HR (Maarova\u2122)", href: "/maarova" },
              { label: "Fractional Leadership", href: "/services" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="hover:text-white transition-colors duration-200"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* COMPANY — real pages, no dead anchors */}
        <div>
          <p className="font-semibold mb-4 text-sm uppercase tracking-wide">
            Company
          </p>

          <ul className="space-y-2 text-white/70 text-sm">
            <li>
              <Link href="/about" className="hover:text-white transition-colors">
                About CFA
              </Link>
            </li>
            <li>
              <Link href="/insights" className="hover:text-white transition-colors">
                Insights & Research
              </Link>
            </li>
            <li>
              <Link href="/careers" className="hover:text-white transition-colors">
                Careers
              </Link>
            </li>
            <li>
              <Link href="/maarova" className="hover:text-white transition-colors">
                Maarova Platform
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                Partner With Us
              </Link>
            </li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <p className="font-semibold mb-4 text-sm uppercase tracking-wide">
            Get in Touch
          </p>

          <ul className="space-y-2 text-white/70 text-sm">
            <li>
              <a
                href="mailto:hello@consultforafrica.com"
                className="hover:text-white transition-colors"
              >
                hello@consultforafrica.com
              </a>
            </li>
            <li>
              <a href="tel:+2349138138553" className="hover:text-white transition-colors">
                +234 913 813 8553
              </a>
            </li>
            <li>Abuja · Lagos</li>
            <li className="pt-1 text-white/50">Response within 48 hours</li>
          </ul>

          <p className="mt-6 text-xs text-white/50">
            Confidential engagements · NDA available upon request
          </p>
        </div>
      </div>

      {/* LOWER BAR */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-white/60 gap-4">

          <div className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Consult For Africa. All rights reserved.
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-6">
            <Link href="/about" className="hover:text-white transition">
              About
            </Link>
            <Link href="/services" className="hover:text-white transition">
              Services
            </Link>
            <Link href="/insights" className="hover:text-white transition">
              Insights
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
