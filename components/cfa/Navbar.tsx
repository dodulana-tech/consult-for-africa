"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "About",    href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Solutions", href: "/solutions" },
    { label: "Maarova\u2122", href: "/maarova" },
    { label: "Insights", href: "/insights" },
    { label: "Careers",  href: "/careers" },
    { label: "Contact",  href: "/contact", highlight: true },
  ];

  return (
    <header
      className={`fixed left-0 right-0 z-50 transition-all duration-300 glass-nav ${
        scrolled ? "shadow-lg shadow-black/[0.06]" : ""
      }`}
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-cfa.png"
            alt="Consult For Africa"
            width={34}
            height={34}
            priority
          />
          <span className="font-semibold tracking-tight text-[var(--brand-primary)]">
            Consult For Africa
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-700">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`transition hover:text-[var(--brand-primary)] ${
                link.highlight
                  ? "text-[var(--brand-primary)] font-medium"
                  : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Login + Mobile */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden md:inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "var(--brand-primary)", border: "1px solid rgba(15,39,68,0.2)" }}
          >
            Login
          </Link>
          <button
            className="md:hidden p-2 text-gray-700"
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          open ? "max-h-72 py-4" : "max-h-0"
        }`}
        style={{ borderTop: "1px solid rgba(200,210,220,0.3)" }}
      >
        <div className="px-6 flex flex-col gap-4 text-sm text-gray-700">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`transition ${
                link.highlight
                  ? "text-[var(--brand-primary)] font-medium"
                  : "hover:text-[var(--brand-primary)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="font-medium"
            style={{ color: "var(--brand-primary)" }}
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
