"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/cadrehealth/NotificationBell";
import LogoutButton from "./LogoutButton";

type Item = { href: string; label: string; icon: string };

// A short primary set, everything else lives under "More". This is the whole
// point of the optimisation: four things a member reaches for daily, not twelve
// competing for the same row.
const PRIMARY: Item[] = [
  { href: "/oncadre/dashboard", label: "Dashboard", icon: "home" },
  { href: "/oncadre/jobs", label: "Jobs", icon: "jobs" },
  { href: "/oncadre/salary-map", label: "Salary Map", icon: "salary" },
  { href: "/oncadre/advisor", label: "Advisor", icon: "advisor" },
];

// "More", grouped so it reads as two clear intents rather than a dump of links.
// `docs: true` is only shown to shortlisted+ members (passed via showDocuments).
const MORE_GROUPS: { title: string; items: (Item & { docs?: boolean })[] }[] = [
  {
    title: "Your career",
    items: [
      { href: "/oncadre/profile", label: "Profile", icon: "user" },
      { href: "/oncadre/my-applications", label: "Applications", icon: "applications" },
      { href: "/oncadre/documents", label: "Documents", icon: "documents", docs: true },
      { href: "/oncadre/cv-generator", label: "CV Generator", icon: "cv" },
      { href: "/oncadre/career-report", label: "Assessment", icon: "assessment" },
    ],
  },
  {
    title: "Explore & grow",
    items: [
      { href: "/oncadre/explore", label: "Hospitals", icon: "hospital" },
      { href: "/oncadre/referrals", label: "Referrals", icon: "referral" },
      { href: "/oncadre/mentorship/my", label: "Mentorship", icon: "mentorship" },
      { href: "/oncadre/mezo", label: "Private Practice", icon: "practice" },
    ],
  },
];

const NAVY = "#0B3C5D";

export default function PortalNav({
  firstName,
  lastName,
  accountStatus,
  showDocuments,
}: {
  firstName?: string | null;
  lastName?: string | null;
  accountStatus?: string | null;
  showDocuments: boolean;
}) {
  const pathname = usePathname() || "";
  const [moreOpen, setMoreOpen] = useState(false); // desktop dropdown
  const [sheetOpen, setSheetOpen] = useState(false); // mobile sheet
  const moreRef = useRef<HTMLDivElement>(null);

  const groups = MORE_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.docs || showDocuments),
  }));
  const moreHrefs = groups.flatMap((g) => g.items.map((i) => i.href));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const moreActive = moreHrefs.some((h) => isActive(h));

  // Close on route change and on outside click / Escape.
  useEffect(() => {
    setMoreOpen(false);
    setSheetOpen(false);
  }, [pathname]);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setMoreOpen(false); setSheetOpen(false); }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <>
      {/* ---- Top bar ---- */}
      <nav
        className="sticky top-0 z-50 bg-white"
        style={{ borderBottom: "1px solid #E8EBF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/oncadre/dashboard" className="shrink-0 text-xl font-bold tracking-tight" style={{ color: NAVY }}>
            Cadre<span style={{ color: "#D4AF37" }}>Health</span>
          </Link>

          {/* Desktop primary links + More */}
          <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {PRIMARY.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200"
                  style={active
                    ? { color: NAVY, background: "rgba(11,60,93,0.08)" }
                    : { color: "#6B7280" }}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200"
                style={moreOpen || moreActive
                  ? { color: NAVY, background: "rgba(11,60,93,0.08)" }
                  : { color: "#6B7280" }}
              >
                More
                <svg className="h-4 w-4 transition-transform" style={{ transform: moreOpen ? "rotate(180deg)" : "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {moreOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl bg-white py-2"
                  style={{ border: "1px solid #E8EBF0", boxShadow: "0 12px 32px -8px rgba(11,60,93,0.24)" }}
                  role="menu"
                >
                  {groups.map((g) => (
                    <div key={g.title} className="px-2 py-1">
                      <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{g.title}</p>
                      {g.items.map((it) => {
                        const active = isActive(it.href);
                        return (
                          <Link
                            key={it.href}
                            href={it.href}
                            role="menuitem"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                            style={active ? { color: NAVY, background: "rgba(11,60,93,0.08)", fontWeight: 600 } : { color: "#374151" }}
                          >
                            <span style={{ color: active ? NAVY : "#9AA6B2" }}><NavIcon icon={it.icon} small /></span>
                            {it.label}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-3">
            <NotificationBell />
            {accountStatus === "VERIFIED" && (
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex"
                style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", color: "#065f46", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Verified
              </span>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: NAVY }}>
              {firstName?.[0]}{lastName?.[0]}
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* ---- Mobile bottom tabs: 4 primary + More ---- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 bg-white md:hidden"
        style={{ borderTop: "1px solid #E8EBF0", boxShadow: "0 -1px 3px rgba(0,0,0,0.04), 0 -4px 12px rgba(0,0,0,0.03)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5" style={{ minHeight: "58px" }}>
          {PRIMARY.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-1 py-2"
                style={{ minHeight: "44px", color: active ? NAVY : "#98A2AE" }}
              >
                <NavIcon icon={item.icon} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-expanded={sheetOpen}
            className="flex flex-col items-center justify-center gap-1 py-2"
            style={{ minHeight: "44px", color: moreActive ? NAVY : "#98A2AE" }}
          >
            <NavIcon icon="more" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ---- Mobile "More" sheet ---- */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0" style={{ background: "rgba(11,31,58,0.45)" }} onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4" style={{ boxShadow: "0 -12px 40px -8px rgba(0,0,0,0.3)", paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: "#E2E6EC" }} />
            {groups.map((g) => (
              <div key={g.title} className="mb-3">
                <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{g.title}</p>
                <div className="grid grid-cols-2 gap-2">
                  {g.items.map((it) => {
                    const active = isActive(it.href);
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm"
                        style={active ? { color: NAVY, background: "rgba(11,60,93,0.08)", fontWeight: 600 } : { color: "#374151", background: "#F6F8FB" }}
                      >
                        <span style={{ color: active ? NAVY : "#9AA6B2" }}><NavIcon icon={it.icon} small /></span>
                        {it.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function NavIcon({ icon, small }: { icon: string; small?: boolean }) {
  const cls = small ? "h-4 w-4" : "h-5 w-5";
  const p = (d: string) => (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
  switch (icon) {
    case "home": return p("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z");
    case "jobs": return p("M21 21l-4.35-4.35M11 18a7 7 0 110-14 7 7 0 010 14z");
    case "salary": return p("M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z");
    case "advisor": return p("M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z");
    case "more": return p("M4 6h16M4 12h16M4 18h16");
    case "user": return p("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z");
    case "applications": return p("M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z");
    case "documents": return p("M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z");
    case "cv": return p("M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z");
    case "assessment": return p("M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z");
    case "hospital": return p("M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4");
    case "referral": return p("M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z");
    case "mentorship": return p("M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z");
    case "practice": return p("M3 21h18M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M14 12h.01");
    default: return null;
  }
}
