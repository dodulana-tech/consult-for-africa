import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import { ChevronRight, Star, Users, CheckCircle, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  SUBMITTED:            { bg: "#F3F4F6", color: "#6B7280" },
  AI_SCREENED:          { bg: "#EFF6FF", color: "#1D4ED8" },
  UNDER_REVIEW:         { bg: "#FEF3C7", color: "#92400E" },
  SHORTLISTED:          { bg: "#D1FAE5", color: "#065F46" },
  INTERVIEW_SCHEDULED:  { bg: "#DBEAFE", color: "#1E40AF" },
  OFFER_EXTENDED:       { bg: "#FDE68A", color: "#78350F" },
  HIRED:                { bg: "#BBF7D0", color: "#14532D" },
  REJECTED:             { bg: "#FEE2E2", color: "#991B1B" },
  WITHDRAWN:            { bg: "#F3F4F6", color: "#9CA3AF" },
};

const RECOMMENDATION_COLORS: Record<string, { bg: string; color: string }> = {
  STRONG_YES: { bg: "#D1FAE5", color: "#065F46" },
  YES:        { bg: "#DBEAFE", color: "#1E40AF" },
  MAYBE:      { bg: "#FEF3C7", color: "#92400E" },
  NO:         { bg: "#FEE2E2", color: "#991B1B" },
};

export default async function TalentPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"];
  if (!allowed.includes(session.user.role)) redirect("/dashboard");

  const [applications, stats] = await Promise.all([
    prisma.talentApplication.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        location: true,
        specialty: true,
        yearsExperience: true,
        currentRole: true,
        currentOrg: true,
        aiScore: true,
        aiRecommendation: true,
        aiStrengths: true,
        status: true,
        engagementTypes: true,
        createdAt: true,
      },
      orderBy: [{ aiScore: "desc" }, { createdAt: "desc" }],
    }),
    prisma.talentApplication.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const total = applications.length;
  const shortlisted = applications.filter((a) => ["SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFER_EXTENDED"].includes(a.status)).length;
  const hired = applications.filter((a) => a.status === "HIRED").length;
  const strongYes = applications.filter((a) => a.aiRecommendation === "STRONG_YES").length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Talent Pipeline" subtitle={`${total} applicants`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Applicants", value: total, icon: Users, color: "#3B82F6" },
              { label: "Strong AI Matches", value: strongYes, icon: Star, color: "#D4AF37" },
              { label: "In Pipeline", value: shortlisted, icon: CheckCircle, color: "#10B981" },
              { label: "Hired", value: hired, icon: CheckCircle, color: "#059669" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <div className="h-0.5 rounded-full mt-2 w-8" style={{ background: s.color }} />
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="rounded-xl p-4 bg-white flex flex-wrap gap-2" style={{ border: "1px solid #e5eaf0" }}>
            {stats.map((s) => (
              <span
                key={s.status}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={STATUS_COLORS[s.status] ?? { bg: "#F3F4F6", color: "#6B7280" }}
              >
                {s.status.replace(/_/g, " ")} ({s._count.id})
              </span>
            ))}
          </div>

          {/* Applications */}
          <div className="space-y-3">
            {applications.map((a) => {
              const statusStyle = STATUS_COLORS[a.status] ?? STATUS_COLORS.SUBMITTED;
              const recStyle = a.aiRecommendation ? RECOMMENDATION_COLORS[a.aiRecommendation] : null;

              return (
                <Link
                  key={a.id}
                  href={`/talent/${a.id}`}
                  className="flex items-center gap-4 rounded-xl p-5 group transition-shadow hover:shadow-sm bg-white"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  {/* Score circle */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
                    style={{
                      background: a.aiScore !== null
                        ? a.aiScore >= 75 ? "#059669" : a.aiScore >= 55 ? "#D97706" : "#EF4444"
                        : "#9CA3AF",
                    }}
                  >
                    {a.aiScore ?? "--"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-[#0F2744]">
                        {a.firstName} {a.lastName}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={statusStyle}>
                        {a.status.replace(/_/g, " ")}
                      </span>
                      {recStyle && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={recStyle}>
                          {a.aiRecommendation?.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {a.specialty.replace(/_/g, " ")} &middot; {a.yearsExperience}y exp &middot; {a.location}
                    </p>
                    {a.currentRole && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.currentRole}{a.currentOrg ? ` at ${a.currentOrg}` : ""}
                      </p>
                    )}
                    {a.aiStrengths.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.aiStrengths.slice(0, 2).map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">
                        {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.engagementTypes.length > 0
                          ? a.engagementTypes[0].replace(/_/g, " ").toLowerCase()
                          : ""}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Link>
              );
            })}

            {applications.length === 0 && (
              <div className="rounded-xl p-12 text-center bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <Users size={24} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No applications yet</p>
                <p className="text-xs text-gray-300 mt-1">Share the talent portal to start receiving applications</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
