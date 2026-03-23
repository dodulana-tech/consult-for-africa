import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import StatusBadge from "@/components/platform/StatusBadge";
import TierChanger from "./TierChanger";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MapPin,
  Star,
  Briefcase,
  Clock,
  DollarSign,
  Award,
  TrendingUp,
} from "lucide-react";
import RateConsultantForm from "@/components/platform/RateConsultantForm";

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  ELITE:      { bg: "#FEF3C7", color: "#D97706" },
  EXPERIENCED:{ bg: "#EFF6FF", color: "#1D4ED8" },
  STANDARD:   { bg: "#F3F4F6", color: "#6B7280" },
  EMERGING:   { bg: "#F0FDF4", color: "#15803D" },
};

export default async function ConsultantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      consultantProfile: {
        include: {
          ratings: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
      assignments: {
        include: {
          engagement: { select: { id: true, name: true, status: true, client: { select: { name: true } } } },
          timeEntries: {
            select: { hours: true, status: true, billableAmount: true, currency: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user || !user.consultantProfile) notFound();

  // Consultants may only view their own profile
  if (session.user.role === "CONSULTANT" && user.id !== session.user.id) {
    redirect("/dashboard");
  }

  const profile = user.consultantProfile;

  // Compute stats
  const allEntries = user.assignments.flatMap((a) => a.timeEntries);
  const approvedEntries = allEntries.filter((e) => ["APPROVED", "PAID"].includes(e.status));
  const totalHours = approvedEntries.reduce((s, e) => s + Number(e.hours), 0);
  const totalEarned = approvedEntries
    .filter((e) => e.billableAmount != null)
    .reduce((s, e) => s + Number(e.billableAmount), 0);
  const pendingHours = allEntries
    .filter((e) => e.status === "PENDING")
    .reduce((s, e) => s + Number(e.hours), 0);
  const activeAssignments = user.assignments.filter((a) =>
    ["ACTIVE", "PENDING"].includes(a.status)
  );

  const avgRating = profile.averageRating ? Number(profile.averageRating) : null;
  const tierStyle = TIER_COLORS[profile.tier] ?? TIER_COLORS.STANDARD;

  const canRate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  // Only show projects where this consultant was assigned
  const rateableProjects = user.assignments
    .filter((a) => ["ACTIVE", "COMPLETED"].includes(a.status))
    .map((a) => ({ id: a.engagement.id, name: a.engagement.name }))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i); // dedupe

  const backHref = session.user.role === "CONSULTANT" ? "/dashboard" : "/consultants";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={user.name}
        subtitle={profile.title}
        backHref={backHref}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-6">
          {/* Header card */}
          <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                style={{ background: "#0F2744" }}
              >
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-bold text-gray-900">{user.name}</h1>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={tierStyle}
                  >
                    {profile.tier}
                  </span>
                  {isElevated && (
                    <TierChanger profileId={profile.id} currentTier={profile.tier} />
                  )}
                  <StatusBadge status={profile.availabilityStatus} />
                  {profile.isDiaspora && (
                    <span className="text-[10px] text-blue-500 font-medium">Diaspora</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{profile.title}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin size={11} />
                  {profile.location}
                </p>
              </div>
              <div className="text-right shrink-0">
                {profile.hourlyRateUSD && (
                  <p className="text-sm font-semibold text-gray-800">
                    ${Number(profile.hourlyRateUSD)}/hr
                  </p>
                )}
                {profile.monthlyRateNGN && (
                  <p className="text-sm font-semibold text-gray-800">
                    {formatCurrency(Number(profile.monthlyRateNGN), "NGN")}/mo
                  </p>
                )}
                {avgRating && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 justify-end mt-1">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {avgRating.toFixed(1)} ({profile.ratings.length} reviews)
                  </p>
                )}
              </div>
            </div>
            {profile.bio && (
              <p className="mt-4 text-sm text-gray-600 border-t pt-4" style={{ borderColor: "#e5eaf0" }}>
                {profile.bio}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Clock, label: "Approved Hrs", value: totalHours.toFixed(1) },
              { icon: Briefcase, label: "Projects", value: profile.totalProjects },
              { icon: TrendingUp, label: "Years Exp", value: profile.yearsExperience },
              { icon: Star, label: "Avg Rating", value: avgRating ? avgRating.toFixed(1) : "N/A" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4 bg-white text-center"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <s.icon size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Expertise */}
          <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award size={14} />
              Expertise Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.expertiseAreas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{ background: "#F0F4FF", color: "#0F2744" }}
                >
                  {area.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>

          {/* Active assignments */}
          {activeAssignments.length > 0 && (
            <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase size={14} />
                Active Assignments ({activeAssignments.length})
              </h2>
              <div className="space-y-2">
                {activeAssignments.map((a) => {
                  const aHours = a.timeEntries
                    .filter((e) => ["APPROVED", "PAID"].includes(e.status))
                    .reduce((s, e) => s + Number(e.hours), 0);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5"
                      style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.engagement.name}</p>
                        <p className="text-xs text-gray-500">
                          {a.engagement.client.name} &middot; {a.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">{aHours.toFixed(1)} hrs logged</p>
                        <p className="text-xs text-gray-500">
                          {a.rateType === "HOURLY"
                            ? `$${Number(a.rateAmount)}/hr`
                            : formatCurrency(Number(a.rateAmount), a.rateCurrency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Earnings summary */}
          {totalEarned > 0 && (
            <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign size={14} />
                Earnings Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{totalHours.toFixed(0)}h</p>
                  <p className="text-xs text-gray-500">Approved hours</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{pendingHours.toFixed(0)}h</p>
                  <p className="text-xs text-gray-500">Pending approval</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(totalEarned, "NGN")}
                  </p>
                  <p className="text-xs text-gray-500">Total earned</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent ratings */}
          {profile.ratings.length > 0 && (
            <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star size={14} />
                Recent Reviews
              </h2>
              <div className="space-y-3">
                {profile.ratings.slice(0, 5).map((r) => (
                  <div key={r.id} className="border-b last:border-b-0 pb-3 last:pb-0" style={{ borderColor: "#e5eaf0" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            className={i < r.overallRating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(new Date(r.createdAt))}</span>
                    </div>
                    <div className="flex gap-4 text-[10px] text-gray-500">
                      <span>Technical: {r.technicalQuality}/5</span>
                      <span>Comms: {r.communication}/5</span>
                      <span>Timing: {r.timeliness}/5</span>
                      <span>Prof: {r.professionalism}/5</span>
                    </div>
                    {r.feedback && (
                      <p className="text-xs text-gray-600 mt-1">{r.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rate consultant - only visible to EMs/Elevated */}
          {canRate && rateableProjects.length > 0 && (
            <RateConsultantForm consultantUserId={id} projects={rateableProjects} />
          )}

          {/* Bank details - only visible to PARTNER/DIRECTOR/ADMIN */}
          {["PARTNER", "DIRECTOR", "ADMIN"].includes(session.user.role) &&
            profile.bankName && (
              <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Payment Details
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <p className="text-xs text-gray-400">Bank</p>
                    <p>{profile.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Account Name</p>
                    <p>{profile.accountName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Account Number</p>
                    <p className="font-mono">{profile.accountNumber}</p>
                  </div>
                  {profile.swiftCode && (
                    <div>
                      <p className="text-xs text-gray-400">SWIFT</p>
                      <p className="font-mono">{profile.swiftCode}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
