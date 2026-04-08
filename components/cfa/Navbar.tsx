"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, LogIn } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close on route change / escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const navLinks = [
    { label: "About",       href: "/about" },
    { label: "Services",    href: "/services" },
    { label: "Solutions",   href: "/solutions" },
    { label: "Maarova\u2122", href: "/maarova" },
    { label: "CadreHealth", href: "/oncadre" },
    { label: "Insights",    href: "/insights" },
    { label: "Careers",     href: "/careers" },
    { label: "Contact",     href: "/contact", highlight: true },
  ];

  return (
    <>
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
          <nav className="hidden lg:flex items-center gap-7 text-sm text-gray-700">
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

          {/* Right side: Login + Hamburger */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden lg:inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--brand-primary)", border: "1px solid rgba(15,39,68,0.2)" }}
            >
              Login
            </Link>
            {/* Mobile login icon -- always visible on mobile */}
            <Link
              href="/login"
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
              style={{ color: "var(--brand-primary)", border: "1px solid rgba(15,39,68,0.15)" }}
              aria-label="Login"
            >
              <LogIn size={18} />
            </Link>
            <button
              className="lg:hidden p-2 text-gray-700"
              aria-label="Toggle menu"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE OVERLAY MENU */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}
      <nav
        className={`lg:hidden fixed top-0 right-0 z-50 h-full w-72 max-w-[80vw] bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
      >
        <div className="flex items-center justify-between px-5 pb-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Menu</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: "calc(100dvh - 120px)" }}>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                link.highlight
                  ? "text-[var(--brand-primary)] font-semibold bg-blue-50/50"
                  : "text-gray-700 hover:bg-gray-50 hover:text-[var(--brand-primary)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #e5eaf0" }}>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ color: "var(--brand-primary)" }}
            >
              <LogIn size={16} />
              Login to Platform
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
