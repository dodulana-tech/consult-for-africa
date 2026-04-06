import type { Metadata } from "next";
import ReadinessAssessment from "@/components/cadrehealth/ReadinessAssessment";

export const metadata: Metadata = {
  title: "Career Readiness Score | CadreHealth",
  description:
    "Free career readiness assessment for Nigerian healthcare professionals. See your employability score and international readiness for UK, US, Canada, and Gulf in 2 minutes.",
};

export default function ReadinessPage() {
  return (
    <main className="min-h-screen bg-gray-50">
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
