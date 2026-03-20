"use client";

import { useState } from "react";
import Link from "next/link";
import CoachLogoutButton from "./CoachLogoutButton";

export default function CoachMobileNav({
  userName,
  navItems,
}: {
  userName: string;
  navItems: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ backgroundColor: "#0f1a2a" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#D4A574" }}>
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="text-white font-semibold text-sm">Coach Portal</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-white p-1">
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <div className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-64 flex flex-col" style={{ backgroundColor: "#0f1a2a" }}>
            <div className="flex items-center justify-end px-4 py-3 border-b border-white/10">
              <button onClick={() => setOpen(false)} className="text-white p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: "#D4A574" }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <p className="text-white text-sm font-medium truncate">{userName}</p>
              </div>
              <CoachLogoutButton />
            </div>
          </div>
        </>
      )}
    </>
  );
}
