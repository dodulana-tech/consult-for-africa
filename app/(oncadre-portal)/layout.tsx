import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EmailVerificationBanner from "./EmailVerificationBanner";
import CadreHealthAnalytics from "@/components/cadrehealth/Analytics";
import PortalNav from "./PortalNav";

export default async function OncadrePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  // Check profile completeness -- redirect to profile page if too low
  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: { profileCompleteness: true, emailVerified: true, cadre: true, state: true, isDiaspora: true, recruitmentStage: true },
  });

  // Core fields missing: redirect to profile to complete
  const needsProfileCompletion = professional && (
    !professional.cadre ||
    (!professional.state && !professional.isDiaspora)
  );

  // Show Documents nav only for shortlisted+ professionals
  const DOCS_STAGES = ["SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_DONE", "OFFER", "PLACED"];
  const showDocuments = Boolean(
    professional?.recruitmentStage && DOCS_STAGES.includes(professional.recruitmentStage)
  );

  return (
    <div className="min-h-screen" style={{ background: "#F8F9FB" }}>
      {/* Top nav + mobile tabs (client): primary items with a grouped "More" */}
      <PortalNav
        firstName={session.firstName}
        lastName={session.lastName}
        accountStatus={session.accountStatus}
        showDocuments={showDocuments}
      />

      {/* Email verification banner */}
      <EmailVerificationBanner professionalId={session.sub} />

      {/* Profile completion banner */}
      {needsProfileCompletion && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-2">
          <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm text-amber-800">
                Your profile is incomplete. Complete your profile to appear in searches and get matched with opportunities.
              </span>
            </div>
            <Link href="/oncadre/profile" className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#0B3C5D" }}>
              Complete Profile
            </Link>
          </div>
        </div>
      )}

      {/* Low completeness banner */}
      {professional && professional.profileCompleteness < 40 && !needsProfileCompletion && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-2">
          <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <span className="text-sm text-blue-800">
              Your profile is {professional.profileCompleteness}% complete. Add credentials, qualifications, and work history to stand out.
            </span>
            <Link href="/oncadre/profile" className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ color: "#0B3C5D", border: "1px solid #0B3C5D" }}>
              Improve Profile
            </Link>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        {children}
      </main>

      {/* Analytics */}
      <Suspense fallback={null}>
        <CadreHealthAnalytics />
      </Suspense>
    </div>
  );
}
