import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import { MandateStatusControls } from "@/components/cadrehealth/MandateStatusControls";
import { FindMatchesButton } from "@/components/cadrehealth/FindMatchesButton";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  SOURCING: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-amber-100 text-amber-700",
  INTERVIEWING: "bg-purple-100 text-purple-700",
  OFFER_EXTENDED: "bg-indigo-100 text-indigo-700",
  PLACED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

const MATCH_STATUS_COLORS: Record<string, string> = {
  MATCHED: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  INTERESTED: "bg-green-100 text-green-700",
  INTERVIEWING: "bg-purple-100 text-purple-700",
  OFFERED: "bg-indigo-100 text-indigo-700",
  PLACED: "bg-emerald-100 text-emerald-700",
  DECLINED: "bg-red-100 text-red-600",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

function formatCurrency(amount: number | null | undefined, currency: string | null) {
  if (!amount) return "N/A";
  const c = currency || "NGN";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(amount);
}

export default async function MandateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const mandate = await prisma.cadreMandate.findUnique({
    where: { id },
    include: {
      facility: { select: { name: true, slug: true } },
      matches: {
        orderBy: { matchScore: "desc" },
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              cadre: true,
              subSpecialty: true,
              state: true,
              city: true,
              yearsOfExperience: true,
              accountStatus: true,
              availability: true,
            },
          },
        },
      },
    },
  });

  if (!mandate) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/cadrehealth/mandates"
            className="mb-2 inline-block text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; All Mandates
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{mandate.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>{getCadreLabel(mandate.cadre)}</span>
            <span>&middot;</span>
            <span>{mandate.type}</span>
            {mandate.urgency && (
              <>
                <span>&middot;</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    mandate.urgency === "URGENT"
                      ? "bg-red-100 text-red-700"
                      : mandate.urgency === "HIGH"
                      ? "bg-orange-100 text-orange-700"
                      : mandate.urgency === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {mandate.urgency}
                </span>
              </>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
            STATUS_COLORS[mandate.status] || "bg-gray-100 text-gray-600"
          }`}
        >
          {mandate.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: info */}
        <div className="space-y-6">
          {/* Description */}
          {mandate.description && (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-3 font-semibold text-gray-900">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-600">
                {mandate.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Requirements</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Cadre" value={getCadreLabel(mandate.cadre)} />
              {mandate.subSpecialty && (
                <Row label="Sub-specialty" value={mandate.subSpecialty} />
              )}
              {mandate.minYearsExperience != null && (
                <Row label="Min Experience" value={`${mandate.minYearsExperience} years`} />
              )}
              {mandate.requiredQualifications.length > 0 && (
                <Row
                  label="Required Qualifications"
                  value={mandate.requiredQualifications.join(", ")}
                />
              )}
              {mandate.preferredQualifications.length > 0 && (
                <Row
                  label="Preferred Qualifications"
                  value={mandate.preferredQualifications.join(", ")}
                />
              )}
              {mandate.valuesRequirements && (
                <Row label="Values / Cultural" value={mandate.valuesRequirements} />
              )}
            </dl>
          </div>

          {/* Terms */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Terms</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Type" value={mandate.type} />
              <Row
                label="Location"
                value={
                  [mandate.locationCity, mandate.locationState].filter(Boolean).join(", ") ||
                  "Not specified"
                }
              />
              <Row label="Remote OK" value={mandate.isRemoteOk ? "Yes" : "No"} />
              <Row
                label="Relocation Required"
                value={mandate.isRelocationRequired ? "Yes" : "No"}
              />
              {(mandate.salaryRangeMin || mandate.salaryRangeMax) && (
                <Row
                  label="Salary Range"
                  value={`${formatCurrency(
                    Number(mandate.salaryRangeMin),
                    mandate.salaryCurrency
                  )} - ${formatCurrency(
                    Number(mandate.salaryRangeMax),
                    mandate.salaryCurrency
                  )}`}
                />
              )}
              {mandate.facility && (
                <Row label="Facility" value={mandate.facility.name} />
              )}
              {!mandate.facility && mandate.facilityName && (
                <Row label="Facility" value={mandate.facilityName} />
              )}
              {mandate.clientContact && (
                <Row label="Client Contact" value={mandate.clientContact} />
              )}
            </dl>
          </div>
        </div>

        {/* Right column: controls + matches */}
        <div className="space-y-6">
          {/* Status controls */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Status</h2>
            <MandateStatusControls mandateId={mandate.id} currentStatus={mandate.status} />
          </div>

          {/* Find matches */}
          <div className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Matches ({mandate.matches.length})
              </h2>
              <FindMatchesButton mandateId={mandate.id} />
            </div>
          </div>

          {/* Match list */}
          {mandate.matches.length > 0 && (
            <div className="space-y-3">
              {mandate.matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-xl border bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/cadrehealth/${match.professional.id}`}
                        className="font-medium text-[#0B3C5D] hover:underline"
                      >
                        {match.professional.firstName} {match.professional.lastName}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {getCadreLabel(match.professional.cadre)}
                        {match.professional.subSpecialty &&
                          ` / ${match.professional.subSpecialty}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {match.matchScore != null && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            match.matchScore >= 80
                              ? "bg-green-100 text-green-700"
                              : match.matchScore >= 60
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {match.matchScore}%
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          MATCH_STATUS_COLORS[match.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {match.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    {match.professional.yearsOfExperience != null && (
                      <span>{match.professional.yearsOfExperience} yrs exp</span>
                    )}
                    <span>
                      {[match.professional.city, match.professional.state]
                        .filter(Boolean)
                        .join(", ") || "Location N/A"}
                    </span>
                    {match.professional.availability && (
                      <span>{match.professional.availability.replace(/_/g, " ")}</span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {match.professional.email && <span>{match.professional.email}</span>}
                    {match.professional.phone && <span>{match.professional.phone}</span>}
                  </div>

                  {match.matchExplanation && (
                    <p className="mt-2 text-xs text-gray-400">{match.matchExplanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-44 shrink-0 font-medium text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}
