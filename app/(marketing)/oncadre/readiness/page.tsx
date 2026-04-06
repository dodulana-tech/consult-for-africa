import type { Metadata } from "next";
import ReadinessAssessment from "@/components/cadrehealth/ReadinessAssessment";

export const metadata: Metadata = {
  title:
    "Career Readiness Score | Free Assessment for Nigerian Healthcare Professionals | CadreHealth",
  description:
    "How ready are you for the UK, US, Canada, or Gulf? Free 2-minute career readiness assessment for Nigerian doctors, nurses, pharmacists, and all healthcare cadres. Instant results with personalized roadmap.",
  keywords: [
    "career readiness healthcare Nigeria",
    "PLAB readiness",
    "UK readiness Nigerian doctor",
    "nurse migration readiness",
    "healthcare career assessment Nigeria",
    "doctor readiness score",
    "nurse readiness UK",
    "pharmacist readiness assessment",
    "healthcare migration Nigeria",
    "international healthcare career",
    "OSCE preparation Nigeria",
    "Gulf healthcare jobs Nigerian",
    "Canada healthcare migration",
    "CadreHealth readiness",
  ].join(", "),
  openGraph: {
    title:
      "Career Readiness Score | Free Assessment for Nigerian Healthcare Professionals",
    description:
      "How ready are you for the UK, US, Canada, or Gulf? Free 2-minute assessment for Nigerian doctors, nurses, pharmacists. Instant results with personalized roadmap.",
    type: "website",
    url: "https://consultforafrica.com/oncadre/readiness",
    siteName: "CadreHealth by Consult For Africa",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Career Readiness Score | CadreHealth",
    description:
      "Free 2-minute career readiness assessment for Nigerian healthcare professionals. How ready are you for international practice?",
  },
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/readiness",
  },
};

export default function ReadinessPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "Career Readiness Score",
    description:
      "Free career readiness assessment for Nigerian healthcare professionals. Covers domestic employability and international readiness for UK, US, Canada, and Gulf markets.",
    about: {
      "@type": "Thing",
      name: "Career readiness for healthcare professionals",
    },
    educationalLevel: "Professional",
    provider: {
      "@type": "Organization",
      name: "CadreHealth by Consult For Africa",
      url: "https://consultforafrica.com",
    },
    isAccessibleForFree: true,
    inLanguage: "en",
    typicalAgeRange: "22-65",
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
            Free assessment - no account needed
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Career Readiness Score
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            Answer a few questions about your qualifications and experience.
            Get your domestic employability score and international readiness
            for the UK, US, Canada, and the Gulf.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Takes about 2 minutes. Your answers are confidential.
          </p>
        </div>

        <div className="mt-12">
          <ReadinessAssessment />
        </div>
      </div>
    </main>
  );
}
