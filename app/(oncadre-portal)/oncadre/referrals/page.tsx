import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import Link from "next/link";
import ReferralSharePanel from "./ReferralSharePanel";

export default async function ReferralsPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      firstName: true,
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
  });

  if (!professional) redirect("/oncadre/register");

  const totalReferrals = professional.referrals.length;
  const converted = professional.referrals.filter(
    (r) => r.accountStatus === "UNVERIFIED" || r.accountStatus === "PENDING_REVIEW" || r.accountStatus === "VERIFIED"
  ).length;
  const verified = professional.referrals.filter(
    (r) => r.accountStatus === "VERIFIED"
  ).length;

  const referralCode = professional.referralCode ?? "N/A";
  const shareLink = `https://consultforafrica.com/oncadre/register?ref=${referralCode}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="mt-1 text-gray-500">
            Invite colleagues to CadreHealth and track your referrals.
          </p>
        </div>
        <Link
          href="/oncadre/refer-facility"
          className="inline-flex items-center justify-center rounded-lg bg-[#0B3C5D] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0A3350] transition"
        >
          Refer a Facility
        </Link>
      </div>

      {/* Referral Code & Share */}
      <ReferralSharePanel
        referralCode={referralCode}
        shareLink={shareLink}
        firstName={professional.firstName}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Total Referrals</p>
          <p className="mt-1 text-3xl font-bold text-[#0B3C5D]">{totalReferrals}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Converted</p>
          <p className="mt-1 text-3xl font-bold text-[#0B3C5D]">{converted}</p>
          <p className="mt-0.5 text-xs text-gray-400">Set password</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Verified</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{verified}</p>
        </div>
      </div>

      {/* Referred Professionals Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Referred Professionals
          </h2>
        </div>

        {professional.referrals.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-lg font-medium">No referrals yet</p>
            <p className="mt-1 text-sm">
              Share your referral link with colleagues to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Cadre</th>
                  <th className="px-6 py-3 font-medium">Date Joined</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {professional.referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-50">
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
                      <StatusBadge status={ref.accountStatus} />
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    VERIFIED: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Verified" },
    UNVERIFIED: { bg: "bg-amber-100", text: "text-amber-700", label: "Registered" },
    IMPORTED: { bg: "bg-gray-100", text: "text-gray-600", label: "Invited" },
    SUSPENDED: { bg: "bg-red-100", text: "text-red-700", label: "Suspended" },
  };
  const s = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
