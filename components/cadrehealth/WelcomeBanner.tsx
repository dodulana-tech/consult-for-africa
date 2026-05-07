"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Stethoscope, Plane, BookOpen, ArrowRight } from "lucide-react";

type Segment = "ng" | "diaspora" | "alumni";

const COPY: Record<Segment, {
  eyebrow: string;
  heading: string;
  body: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  icon: React.ReactNode;
}> = {
  ng: {
    eyebrow: "Practising in Nigeria",
    heading: "Welcome to the network.",
    body: "Your profile is now part of a verified directory of Nigerian specialists. Here is what is available to you next:",
    bullets: [
      "Confirm your specialty record and contact preferences",
      "See salary, locum and fractional benchmarks for your specialty",
      "Receive selective role and advisory invitations",
    ],
    ctaLabel: "Complete your profile",
    ctaHref: "/oncadre/profile",
    icon: <Stethoscope className="h-5 w-5" />,
  },
  diaspora: {
    eyebrow: "Diaspora network",
    heading: "Welcome. We are glad to have you.",
    body: "Your engagement here is on your terms. The platform is built around episodic involvement, not relocation pressure. Here is what is available to you:",
    bullets: [
      "Visiting consultant slots at named Nigerian institutions, with logistics handled",
      "Visiting faculty and advisory roles at Nigerian universities and hospitals",
      "Selective invitations to working groups on Nigerian clinical guidelines",
    ],
    ctaLabel: "Tell us how you would like to engage",
    ctaHref: "/oncadre/profile",
    icon: <Plane className="h-5 w-5" />,
  },
  alumni: {
    eyebrow: "Alumni network",
    heading: "Welcome to the senior fellows track.",
    body: "Whether you are fully retired or stepped back from clinical work, your experience is the platform's most valuable asset. Here is what is available to you:",
    bullets: [
      "CadreHealth Emeritus Fellow designation, listed publicly",
      "Mentor a registrar or junior consultant on your terms",
      "Optional case review and second-opinion panels (opt-in)",
    ],
    ctaLabel: "Set your mentorship preferences",
    ctaHref: "/oncadre/profile",
    icon: <BookOpen className="h-5 w-5" />,
  },
};

export function WelcomeBanner({ welcome }: { welcome?: string }) {
  const segment: Segment | null =
    welcome === "ng" || welcome === "diaspora" || welcome === "alumni" ? welcome : null;

  const [dismissed, setDismissed] = useState(false);
  if (!segment || dismissed) return null;

  const copy = COPY[segment];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white p-6 sm:p-7"
      style={{
        borderColor: "#E8EBF0",
        boxShadow: "0 1px 3px rgba(11,60,93,0.06), 0 0 0 1px rgba(212,175,55,0.08) inset",
      }}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(11,60,93,0.06)", color: "#0B3C5D" }}
        >
          {copy.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: "#D4AF37" }}
          >
            {copy.eyebrow}
          </p>
          <h2
            className="mt-1 font-bold"
            style={{ fontSize: "clamp(1.1rem, 2vw, 1.3rem)", color: "#0F2744" }}
          >
            {copy.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {copy.body}
          </p>

          <ul className="mt-4 space-y-2">
            {copy.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span
                  className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "#D4AF37" }}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <Link
            href={copy.ctaHref}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#0B3C5D" }}
          >
            {copy.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
