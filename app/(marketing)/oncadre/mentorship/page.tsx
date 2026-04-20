import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Mentorship for Healthcare Professionals | CadreHealth by Consult For Africa",
  description:
    "Connect with experienced healthcare professionals who have walked the path before you. Free peer mentorship for Nigerian doctors, nurses, pharmacists, and all healthcare cadres. Backed by MANSAG, ANPA, DFC, and NDF-SA.",
  keywords: [
    "healthcare mentorship Nigeria",
    "doctor mentor Nigeria",
    "nurse mentor UK migration",
    "pharmacist career mentor",
    "MANSAG mentorship",
    "ANPA mentorship",
    "diaspora healthcare mentor",
    "Nigerian healthcare career guidance",
    "CadreHealth mentorship",
    "peer mentorship healthcare",
  ].join(", "),
  openGraph: {
    title: "Mentorship for Healthcare Professionals | CadreHealth",
    description:
      "Connect with experienced healthcare professionals who have walked the path before you. Free peer mentorship backed by MANSAG, ANPA, DFC, and NDF-SA.",
    type: "website",
    url: "https://consultforafrica.com/oncadre/mentorship",
    siteName: "CadreHealth by Consult For Africa",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentorship | CadreHealth",
    description:
      "Free peer mentorship for Nigerian healthcare professionals. Learn from those who walked the path before you.",
  },
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/mentorship",
  },
};

const PARTNER_ORGS = [
  {
    name: "MANSAG",
    fullName: "Medical and Dental Consultants Association of Nigeria in the Diaspora",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    name: "ANPA",
    fullName: "Association of Nigerian Physicians in the Americas",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  {
    name: "DFC",
    fullName: "Doctors Foundation for Care",
    color: "#B8860B",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  {
    name: "NDF-SA",
    fullName: "Nigerian Doctors Forum, South Africa",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
];

const MENTOR_AREAS = [
  {
    title: "UK Migration",
    description: "PLAB, GMC registration, NHS career paths, and settlement",
    icon: "🇬🇧",
  },
  {
    title: "US Residency Match",
    description: "USMLE preparation, match strategy, and visa pathways",
    icon: "🇺🇸",
  },
  {
    title: "Fellowship Preparation",
    description: "West African and international fellowship exam guidance",
    icon: "🎓",
  },
  {
    title: "Career Transition",
    description: "Moving between specialties, sectors, or career tracks",
    icon: "🔄",
  },
  {
    title: "Leadership Development",
    description: "Hospital management, departmental leadership, and influence",
    icon: "📈",
  },
  {
    title: "Private Practice Setup",
    description: "Starting and growing a private healthcare practice",
    icon: "🏥",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Browse Mentors",
    description:
      "Explore verified mentors by cadre, specialty, partner organization, and area of expertise.",
  },
  {
    step: 2,
    title: "Request Mentorship",
    description:
      "Send a request with your topic and a brief message. Your mentor reviews and accepts.",
  },
  {
    step: 3,
    title: "Learn and Grow",
    description:
      "Exchange messages, get guidance, and build a relationship with someone who has been where you are going.",
  },
];

export default async function MentorshipHubPage() {
  const [mentorCount, mentorshipCount] = await Promise.all([
    prisma.cadreMentorProfile.count({ where: { status: "ACTIVE" } }),
    prisma.cadreMentorship.count({
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Healthcare Mentorship | CadreHealth",
    description:
      "Free peer mentorship for Nigerian healthcare professionals. Connect with experienced professionals who have walked the path before you.",
    provider: {
      "@type": "Organization",
      name: "CadreHealth by Consult For Africa",
      url: "https://consultforafrica.com",
    },
    isAccessibleForFree: true,
    inLanguage: "en",
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0B3C5D 0%, #0a2d44 50%, #071e2e 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 50%, #D4AF37 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
              style={{
                background: "rgba(212, 175, 55, 0.12)",
                color: "#D4AF37",
                border: "1px solid rgba(212, 175, 55, 0.25)",
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Peer Mentorship
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learn from those who walked
              <br />
              <span style={{ color: "#D4AF37" }}>the path before you</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-300 sm:text-xl">
              Connect with experienced healthcare professionals across the
              diaspora. Get guidance on migration, fellowships, career
              transitions, and more.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/oncadre/mentorship/mentors"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(135deg, #D4AF37, #b8962e)",
                  boxShadow: "0 4px 14px rgba(212,175,55,0.3)",
                }}
              >
                Find a Mentor
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="/oncadre/login?redirect=/oncadre/mentorship/become-mentor"
                className="inline-flex items-center gap-2 rounded-xl border px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                Become a Mentor
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-md grid-cols-2 gap-8 sm:max-w-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-white sm:text-4xl">
                {mentorCount}+
              </p>
              <p className="mt-1 text-sm text-gray-400">Active Mentors</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white sm:text-4xl">
                {mentorshipCount}+
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Mentorships Completed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Organizations */}
      <section style={{ background: "#F8F9FB" }} className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: "#D4AF37" }}
            >
              Backed By
            </p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              Partner Organizations
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500">
              Our mentors are verified professionals from leading diaspora
              healthcare organizations.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {PARTNER_ORGS.map((org) => (
              <div
                key={org.name}
                className="flex flex-col items-center rounded-2xl border p-6 text-center transition-all hover:shadow-md"
                style={{
                  background: org.bg,
                  borderColor: org.border,
                }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: org.color }}
                >
                  {org.name}
                </span>
                <p className="mt-2 text-xs leading-snug text-gray-500">
                  {org.fullName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500">
              Three simple steps to connect with a mentor who understands your
              journey.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #0B3C5D, #0d4a73)",
                  }}
                >
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Mentor Areas */}
      <section style={{ background: "#F8F9FB" }} className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              What You Can Get Help With
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500">
              Our mentors cover a wide range of career topics relevant to
              healthcare professionals at every stage.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MENTOR_AREAS.map((area) => (
              <div
                key={area.title}
                className="rounded-2xl border bg-white p-6 transition-all hover:shadow-md"
                style={{ borderColor: "#E8EBF0" }}
              >
                <span className="text-2xl">{area.icon}</span>
                <h3 className="mt-3 text-base font-bold text-gray-900">
                  {area.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 sm:py-20"
        style={{
          background: "linear-gradient(135deg, #0B3C5D 0%, #071e2e 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to accelerate your career?
          </h2>
          <p className="mt-4 text-base text-gray-300">
            Whether you are looking for guidance or ready to give back, there
            is a place for you in the CadreHealth mentorship community.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/mentorship/mentors"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #b8962e)",
                boxShadow: "0 4px 14px rgba(212,175,55,0.3)",
              }}
            >
              Browse Mentors
            </Link>
            <Link
              href="/oncadre/login?redirect=/oncadre/mentorship/become-mentor"
              className="inline-flex items-center gap-2 rounded-xl border px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.2)" }}
            >
              Apply as Mentor
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
