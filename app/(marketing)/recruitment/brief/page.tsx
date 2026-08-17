import type { Metadata } from "next";
import RecruitmentBriefForm from "./RecruitmentBriefForm";

export const metadata: Metadata = {
  title: "Start a Search | Consult For Africa",
  description:
    "Give us the brief and we open the search. Person specification, accountability, package and process in one form.",
  robots: { index: false, follow: false },
};

export default function RecruitmentBriefPage() {
  return (
    <main className="bg-[#F8F9FB] min-h-screen" style={{ paddingTop: "5rem" }}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "#D4AF37" }}>
            Consult For Africa  /  Executive and specialist search
          </p>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">Start a search</h1>
          <p className="mt-3 text-sm text-gray-500 max-w-lg mx-auto">
            Five short steps. The more precise the brief, the shorter the shortlist. Most of it takes ten minutes, and
            the only questions that really matter are whether the role owns a P&amp;L and what the package is.
          </p>
        </div>
        <RecruitmentBriefForm />
      </div>
    </main>
  );
}
