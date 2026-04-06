import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import FacilityReferralActions from "./FacilityReferralActions";

export default async function CadreHealthReferralsAdmin() {
  // Professional referrals: who referred whom
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

  // Facility referrals
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

  // Stats
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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          CadreHealth Referrals
        </h1>
        <p className="text-gray-500">
          Track professional-to-professional and facility referrals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Professional Referrals" value={totalProfessionalReferrals} />
        <StatCard label="Converted" value={convertedProfessionals} />
        <StatCard label="Verified" value={verifiedProfessionals} color="emerald" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} />
        <StatCard label="Facility Referrals" value={totalFacilityReferrals} />
        <StatCard
          label="Facilities Converted"
          value={convertedFacilities}
          color="emerald"
        />
      </div>

      {/* Top Referrers Leaderboard */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Top Referrers
          </h2>
        </div>
        {professionalsWithReferrals.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No professional referrals yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">#</th>
                  <th className="px-6 py-3 font-medium">Referrer</th>
                  <th className="px-6 py-3 font-medium">Cadre</th>
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Converted</th>
                  <th className="px-6 py-3 font-medium">Verified</th>
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
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {p.firstName} {p.lastName}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {getCadreLabel(p.cadre)}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-gray-500">
                          {p.referralCode}
                        </td>
                        <td className="px-6 py-3 font-semibold text-[#0B3C5D]">
                          {p.referrals.length}
                        </td>
                        <td className="px-6 py-3">{conv}</td>
                        <td className="px-6 py-3 text-emerald-600 font-medium">
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
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            All Professional Referrals
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Referred By</th>
                <th className="px-6 py-3 font-medium">Referred Professional</th>
                <th className="px-6 py-3 font-medium">Cadre</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {professionalsWithReferrals.flatMap((p) =>
                p.referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-50">
                    <td className="px-6 py-3 text-gray-600">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {ref.firstName} {ref.lastName}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {getCadreLabel(ref.cadre)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(ref.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <AccountStatusBadge status={ref.accountStatus} />
                    </td>
                  </tr>
                ))
              )}
              {totalProfessionalReferrals === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No professional referrals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facility Referrals */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Facility Referrals
          </h2>
          <p className="text-sm text-gray-500">
            {totalFacilityReferrals} total, {contactedFacilities} contacted, {convertedFacilities} converted
          </p>
        </div>
        {facilityReferrals.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No facility referrals yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Facility</th>
                  <th className="px-6 py-3 font-medium">Contact</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Need</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium">Referred By</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilityReferrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {ref.facilityName}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      <div>{ref.contactName}</div>
                      {ref.contactEmail && (
                        <div className="text-xs text-gray-400">{ref.contactEmail}</div>
                      )}
                      {ref.contactPhone && (
                        <div className="text-xs text-gray-400">{ref.contactPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-xs">
                      {ref.facilityType?.replace(/_/g, " ") ?? "-"}
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-xs">
                      {ref.needType.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {[ref.city, ref.state].filter(Boolean).join(", ") || "-"}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {ref.referredBy.firstName} {ref.referredBy.lastName}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(ref.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <FacilityStatusBadge status={ref.status} />
                    </td>
                    <td className="px-6 py-3">
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
  color,
}: {
  label: string;
  value: string | number;
  color?: "emerald";
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          color === "emerald" ? "text-emerald-600" : "text-[#0B3C5D]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AccountStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    VERIFIED: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Verified" },
    UNVERIFIED: { bg: "bg-amber-100", text: "text-amber-700", label: "Registered" },
    IMPORTED: { bg: "bg-gray-100", text: "text-gray-600", label: "Imported" },
    SUSPENDED: { bg: "bg-red-100", text: "text-red-700", label: "Suspended" },
  };
  const s = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function FacilityStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
    CONTACTED: { bg: "bg-blue-100", text: "text-blue-700", label: "Contacted" },
    CONVERTED: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Converted" },
    REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
  };
  const s = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
