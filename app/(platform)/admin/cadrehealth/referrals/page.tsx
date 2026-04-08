import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import FacilityReferralActions from "./FacilityReferralActions";
import {
  Users,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default async function CadreHealthReferralsAdmin() {
  const professionalsWithReferrals = await prisma.cadreProfessional.findMany({
    where: {
      referrals: { some: {} },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      cadre: true,
      referralCode: true,
      referrals: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          cadre: true,
          accountStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const facilityReferrals = await prisma.cadreFacilityReferral.findMany({
    include: {
      referredBy: {
        select: {
          firstName: true,
          lastName: true,
          cadre: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalProfessionalReferrals = professionalsWithReferrals.reduce(
    (sum, p) => sum + p.referrals.length,
    0
  );
  const convertedProfessionals = professionalsWithReferrals.reduce(
    (sum, p) =>
      sum +
      p.referrals.filter(
        (r) =>
          r.accountStatus === "UNVERIFIED" ||
          r.accountStatus === "PENDING_REVIEW" ||
          r.accountStatus === "VERIFIED"
      ).length,
    0
  );
  const verifiedProfessionals = professionalsWithReferrals.reduce(
    (sum, p) =>
      sum + p.referrals.filter((r) => r.accountStatus === "VERIFIED").length,
    0
  );

  const totalFacilityReferrals = facilityReferrals.length;
  const contactedFacilities = facilityReferrals.filter(
    (r) => r.status === "CONTACTED"
  ).length;
  const convertedFacilities = facilityReferrals.filter(
    (r) => r.status === "CONVERTED"
  ).length;

  const conversionRate =
    totalProfessionalReferrals > 0
      ? Math.round((convertedProfessionals / totalProfessionalReferrals) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          CadreHealth Referrals
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Track professional-to-professional and facility referrals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard
          label="Professional Referrals"
          value={totalProfessionalReferrals}
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-[#0B3C5D]/8"
          iconColor="text-[#0B3C5D]"
        />
        <StatCard
          label="Converted"
          value={convertedProfessionals}
          icon={<UserCheck className="h-5 w-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Verified"
          value={verifiedProfessionals}
          icon={<ShieldCheck className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Facility Referrals"
          value={totalFacilityReferrals}
          icon={<Building2 className="h-5 w-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Facilities Converted"
          value={convertedFacilities}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Top Referrers Leaderboard */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Top Referrers
          </h2>
        </div>
        {professionalsWithReferrals.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400">No professional referrals yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Referrer</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Cadre</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Code</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Total</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Converted</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Verified</th>
                </tr>
              </thead>
              <tbody>
                {professionalsWithReferrals
                  .sort((a, b) => b.referrals.length - a.referrals.length)
                  .map((p, i) => {
                    const conv = p.referrals.filter(
                      (r) =>
                        r.accountStatus === "UNVERIFIED" ||
                        r.accountStatus === "PENDING_REVIEW" ||
                        r.accountStatus === "VERIFIED"
                    ).length;
                    const ver = p.referrals.filter(
                      (r) => r.accountStatus === "VERIFIED"
                    ).length;
                    return (
                      <tr key={p.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60">
                        <td className="px-6 py-4">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {p.firstName} {p.lastName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {getCadreLabel(p.cadre)}
                        </td>
                        <td className="hidden px-6 py-4 sm:table-cell">
                          <span className="rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
                            {p.referralCode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold" style={{ color: "#0B3C5D" }}>
                            {p.referrals.length}
                          </span>
                        </td>
                        <td className="hidden px-6 py-4 md:table-cell">{conv}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">
                          {ver}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Professional Referral Details */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            All Professional Referrals
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Referred By</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Professional</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Cadre</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Date</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {professionalsWithReferrals.flatMap((p) =>
                p.referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60">
                    <td className="px-6 py-4 text-gray-600">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {ref.firstName} {ref.lastName}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-600 sm:table-cell">
                      {getCadreLabel(ref.cadre)}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-400 md:table-cell">
                      {new Date(ref.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <AccountStatusBadge status={ref.accountStatus} />
                    </td>
                  </tr>
                ))
              )}
              {totalProfessionalReferrals === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                    No professional referrals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facility Referrals */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Facility Referrals
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {totalFacilityReferrals} total, {contactedFacilities} contacted, {convertedFacilities} converted
          </p>
        </div>
        {facilityReferrals.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400">No facility referrals yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Facility</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Contact</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Type</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Need</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Location</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Referred By</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Date</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilityReferrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {ref.facilityName}
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <div className="text-gray-600">{ref.contactName}</div>
                      {ref.contactEmail && (
                        <div className="mt-0.5 text-xs text-gray-400">{ref.contactEmail}</div>
                      )}
                      {ref.contactPhone && (
                        <div className="text-xs text-gray-400">{ref.contactPhone}</div>
                      )}
                    </td>
                    <td className="hidden px-6 py-4 text-xs text-gray-600 lg:table-cell">
                      {ref.facilityType?.replace(/_/g, " ") ?? "-"}
                    </td>
                    <td className="hidden px-6 py-4 text-xs text-gray-600 lg:table-cell">
                      {ref.needType.replace(/_/g, " ")}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-600 sm:table-cell">
                      {[ref.city, ref.state].filter(Boolean).join(", ") || "-"}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-600 md:table-cell">
                      {ref.referredBy.firstName} {ref.referredBy.lastName}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-400 sm:table-cell">
                      {new Date(ref.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <FacilityStatusBadge status={ref.status} />
                    </td>
                    <td className="px-6 py-4">
                      <FacilityReferralActions
                        id={ref.id}
                        currentStatus={ref.status}
                        currentNotes={ref.adminNotes ?? ""}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className={`rounded-xl p-2.5 ${iconBg} ${iconColor}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
        {value}
      </p>
    </div>
  );
}

function AccountStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    VERIFIED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Verified" },
    UNVERIFIED: { bg: "bg-amber-50", text: "text-amber-700", label: "Registered" },
    IMPORTED: { bg: "bg-gray-100", text: "text-gray-600", label: "Imported" },
    SUSPENDED: { bg: "bg-red-50", text: "text-red-700", label: "Suspended" },
  };
  const s = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function FacilityStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
    CONTACTED: { bg: "bg-blue-50", text: "text-blue-700", label: "Contacted" },
    CONVERTED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Converted" },
    REJECTED: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
  };
  const s = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
