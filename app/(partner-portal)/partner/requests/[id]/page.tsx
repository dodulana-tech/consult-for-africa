import { prisma } from "@/lib/prisma";
import { getPartnerPortalSession } from "@/lib/partnerPortalAuth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PartnerPortalLogoutButton from "@/components/partner-portal/LogoutButton";
import DeploymentResponseButtons from "./DeploymentResponseButtons";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:          { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
  SUBMITTED:      { bg: "#EFF6FF", color: "#1D4ED8", label: "Submitted" },
  MATCHING:       { bg: "#FEF9E7", color: "#92400E", label: "Matching" },
  SHORTLIST_SENT: { bg: "#FEF3C7", color: "#92400E", label: "Shortlist Sent" },
  CONFIRMED:      { bg: "#D1FAE5", color: "#065F46", label: "Confirmed" },
  ACTIVE:         { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  COMPLETED:      { bg: "#F0FDF4", color: "#15803D", label: "Completed" },
  CANCELLED:      { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
};

const DEPLOYMENT_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PROPOSED:  { bg: "#FEF9E7", color: "#92400E", label: "Proposed" },
  ACCEPTED:  { bg: "#D1FAE5", color: "#065F46", label: "Accepted" },
  ACTIVE:    { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D", label: "Completed" },
  RECALLED:  { bg: "#F3F4F6", color: "#6B7280", label: "Recalled" },
  DECLINED:  { bg: "#FEE2E2", color: "#991B1B", label: "Declined" },
};

const TIMELINE_STEPS = [
  "SUBMITTED",
  "MATCHING",
  "SHORTLIST_SENT",
  "CONFIRMED",
  "ACTIVE",
  "COMPLETED",
];

const TIMELINE_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  MATCHING: "Matching",
  SHORTLIST_SENT: "Shortlist Sent",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

interface AnonymisedProfile {
  tier?: string;
  yearsExperience?: number;
  expertiseAreas?: string[];
  bio?: string;
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getPartnerPortalSession();
  if (!session) redirect("/partner/login");

  const { id } = await params;

  const request = await prisma.partnerStaffingRequest.findFirst({
    where: {
      id,
      partnerId: session.partnerId,
    },
    include: {
      deployments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) notFound();

  const statusStyle = STATUS_STYLES[request.status] ?? STATUS_STYLES.SUBMITTED;
  const currentStepIndex = TIMELINE_STEPS.indexOf(request.status);
  const isConfirmedOrLater = ["CONFIRMED", "ACTIVE", "COMPLETED"].includes(request.status);

  // For confirmed/active/completed, fetch consultant names
  let consultantNames: Record<string, string> = {};
  if (isConfirmedOrLater && request.deployments.length > 0) {
    const consultantIds = request.deployments.map((d) => d.consultantId);
    const consultants = await prisma.user.findMany({
      where: { id: { in: consultantIds } },
      select: { id: true, name: true },
    });
    consultantNames = Object.fromEntries(
      consultants.map((c) => [c.id, c.name || "Consultant"])
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFB" }}>
      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="C4A" style={{ height: 28, width: "auto" }} />
            <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Partner Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/partner/dashboard"
              className="text-xs font-medium hover:underline"
              style={{ color: "#0F2744" }}
            >
              Dashboard
            </Link>
            <PartnerPortalLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Back link */}
        <Link
          href="/partner/dashboard"
          className="text-xs font-medium hover:underline mb-6 inline-block"
          style={{ color: "#6B7280" }}
        >
          &larr; Back to Dashboard
        </Link>

        {/* Request Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {request.projectName}
            </h1>
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              {statusStyle.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">{request.requestCode}</p>
        </div>

        {/* Request Info */}
        <div
          className="bg-white rounded-2xl p-6 mb-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
            Request Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Project</span>
              <p className="mt-1" style={{ color: "#0F2744" }}>{request.projectName}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Consultants Needed</span>
              <p className="mt-1" style={{ color: "#0F2744" }}>{request.rolesNeeded}</p>
            </div>
            {request.skillsRequired.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Skills</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {request.skillsRequired.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {request.serviceTypes.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Service Area</span>
                <p className="mt-1" style={{ color: "#0F2744" }}>{request.serviceTypes.join(", ")}</p>
              </div>
            )}
            {request.seniority && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Seniority</span>
                <p className="mt-1" style={{ color: "#0F2744" }}>{request.seniority}</p>
              </div>
            )}
            {request.hoursPerWeek && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Hours/Week</span>
                <p className="mt-1" style={{ color: "#0F2744" }}>{request.hoursPerWeek}</p>
              </div>
            )}
            {request.startDate && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Start Date</span>
                <p className="mt-1" style={{ color: "#0F2744" }}>{formatDate(request.startDate)}</p>
              </div>
            )}
            {request.durationWeeks && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Duration</span>
                <p className="mt-1" style={{ color: "#0F2744" }}>{request.durationWeeks} weeks</p>
              </div>
            )}
          </div>
          {request.projectDescription && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e5eaf0" }}>
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Description</span>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                {request.projectDescription}
              </p>
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <div
          className="bg-white rounded-2xl p-6 mb-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2 className="text-sm font-semibold mb-5" style={{ color: "#0F2744" }}>
            Request Timeline
          </h2>
          <div className="flex items-center gap-0 overflow-x-auto">
            {TIMELINE_STEPS.map((step, i) => {
              const isCompleted = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isFuture = i > currentStepIndex;
              const dotBg = isCompleted
                ? "#065F46"
                : isCurrent
                  ? "#D4AF37"
                  : "#E5E7EB";
              const dotBorder = isCurrent ? "2px solid #D4AF37" : "none";
              const labelColor = isCompleted
                ? "#065F46"
                : isCurrent
                  ? "#0F2744"
                  : "#9CA3AF";
              const lineColor = isCompleted ? "#065F46" : "#E5E7EB";

              return (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center" style={{ minWidth: 80 }}>
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{
                        background: dotBg,
                        border: dotBorder,
                        boxShadow: isCurrent ? "0 0 0 3px rgba(212,175,55,0.2)" : "none",
                      }}
                    >
                      {isCompleted && (
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-medium mt-2 text-center"
                      style={{ color: labelColor }}
                    >
                      {TIMELINE_LABELS[step]}
                    </span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div
                      className="h-0.5 flex-1"
                      style={{
                        background: lineColor,
                        minWidth: 24,
                        marginTop: -16,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deployments / Proposed Consultants */}
        {request.deployments.length > 0 && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <h2 className="text-sm font-semibold mb-5" style={{ color: "#0F2744" }}>
              {request.status === "SHORTLIST_SENT"
                ? "Proposed Consultants"
                : "Deployments"}
            </h2>

            <div className="space-y-4">
              {request.deployments.map((dep, idx) => {
                const depStyle =
                  DEPLOYMENT_STATUS_STYLES[dep.status] ?? DEPLOYMENT_STATUS_STYLES.PROPOSED;
                const profile = dep.anonymisedProfile as AnonymisedProfile | null;
                const showName = isConfirmedOrLater && dep.status !== "DECLINED";
                const showActions = request.status === "SHORTLIST_SENT" && dep.status === "PROPOSED";

                return (
                  <div
                    key={dep.id}
                    className="rounded-xl p-5"
                    style={{ border: "1px solid #e5eaf0", background: "#FAFBFC" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3
                            className="text-sm font-semibold"
                            style={{ color: "#0F2744" }}
                          >
                            {showName
                              ? consultantNames[dep.consultantId] || "Consultant"
                              : `Candidate ${idx + 1}`}
                          </h3>
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: depStyle.bg, color: depStyle.color }}
                          >
                            {depStyle.label}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mb-2">{dep.role}</p>

                        {/* Anonymised profile details */}
                        {profile && !showName && (
                          <div className="space-y-1.5 mt-3">
                            {profile.tier && (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400 font-medium w-24">Tier</span>
                                <span className="text-xs" style={{ color: "#0F2744" }}>{profile.tier}</span>
                              </div>
                            )}
                            {profile.yearsExperience != null && (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400 font-medium w-24">Experience</span>
                                <span className="text-xs" style={{ color: "#0F2744" }}>
                                  {profile.yearsExperience} years
                                </span>
                              </div>
                            )}
                            {profile.expertiseAreas && profile.expertiseAreas.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-[11px] text-gray-400 font-medium w-24 shrink-0">Expertise</span>
                                <div className="flex flex-wrap gap-1">
                                  {profile.expertiseAreas.map((area) => (
                                    <span
                                      key={area}
                                      className="text-[11px] px-2 py-0.5 rounded-full"
                                      style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                                    >
                                      {area}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {profile.bio && (
                              <div className="mt-2">
                                <span className="text-[11px] text-gray-400 font-medium">Summary</span>
                                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                                  {profile.bio}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Confirmed deployment details */}
                        {showName && (
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            {dep.startDate && (
                              <span className="text-xs text-gray-500">
                                Start: {formatDate(dep.startDate)}
                              </span>
                            )}
                            {dep.endDate && (
                              <span className="text-xs text-gray-500">
                                End: {formatDate(dep.endDate)}
                              </span>
                            )}
                            {dep.hoursPerWeek && (
                              <span className="text-xs text-gray-500">
                                {dep.hoursPerWeek}h/week
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Accept/Decline buttons */}
                    {showActions && (
                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e5eaf0" }}>
                        <DeploymentResponseButtons
                          requestId={request.id}
                          deploymentId={dep.id}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="mt-auto py-6"
        style={{ borderTop: "1px solid #e5eaf0", background: "#fff" }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "#0F2744" }}
            >
              <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "#0F2744" }}>
              Consult For Africa
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            &copy; {new Date().getFullYear()} Consult For Africa. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
