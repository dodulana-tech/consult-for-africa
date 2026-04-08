import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import { MandateStatusControls } from "@/components/cadrehealth/MandateStatusControls";
import { FindMatchesButton } from "@/components/cadrehealth/FindMatchesButton";
import { MandateEditForm } from "@/components/cadrehealth/MandateEditForm";
import { ArrowLeft, MapPin, Clock, Mail, Phone, Pencil } from "lucide-react";
import MandateTabSwitcher from "./MandateTabSwitcher";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  SOURCING: "bg-blue-50 text-blue-700",
  SHORTLISTED: "bg-amber-50 text-amber-700",
  INTERVIEWING: "bg-purple-50 text-purple-700",
  OFFER_EXTENDED: "bg-indigo-50 text-indigo-700",
  PLACED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-50 text-red-600",
};

const MATCH_STATUS_COLORS: Record<string, string> = {
  MATCHED: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-amber-50 text-amber-700",
  INTERESTED: "bg-emerald-50 text-emerald-700",
  INTERVIEWING: "bg-purple-50 text-purple-700",
  OFFERED: "bg-indigo-50 text-indigo-700",
  PLACED: "bg-emerald-50 text-emerald-700",
  DECLINED: "bg-red-50 text-red-600",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

function formatCurrency(amount: number | null | undefined, currency: string | null) {
  if (!amount) return "N/A";
  const c = currency || "NGN";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(amount);
}

export default async function MandateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const isEditMode = tab === "edit";

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

  // Serialise for client component
  const editData = {
    id: mandate.id,
    title: mandate.title,
    description: mandate.description,
    cadre: mandate.cadre as string,
    subSpecialty: mandate.subSpecialty,
    minYearsExperience: mandate.minYearsExperience,
    requiredQualifications: mandate.requiredQualifications,
    preferredQualifications: mandate.preferredQualifications,
    valuesRequirements: mandate.valuesRequirements,
    locationState: mandate.locationState,
    locationCity: mandate.locationCity,
    isRemoteOk: mandate.isRemoteOk,
    isRelocationRequired: mandate.isRelocationRequired,
    type: mandate.type,
    salaryRangeMin: mandate.salaryRangeMin ? Number(mandate.salaryRangeMin) : null,
    salaryRangeMax: mandate.salaryRangeMax ? Number(mandate.salaryRangeMax) : null,
    salaryCurrency: mandate.salaryCurrency ?? "NGN",
    urgency: mandate.urgency,
    facilityName: mandate.facilityName,
    clientContact: mandate.clientContact,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/cadrehealth/mandates"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Mandates
          </Link>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            {mandate.title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>{getCadreLabel(mandate.cadre)}</span>
            <span className="text-gray-300">/</span>
            <span>{mandate.type}</span>
            {mandate.urgency && (
              <>
                <span className="text-gray-300">/</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    mandate.urgency === "URGENT"
                      ? "bg-red-50 text-red-700"
                      : mandate.urgency === "HIGH"
                      ? "bg-orange-50 text-orange-700"
                      : mandate.urgency === "MEDIUM"
                      ? "bg-amber-50 text-amber-700"
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
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${
            STATUS_COLORS[mandate.status] || "bg-gray-100 text-gray-600"
          }`}
        >
          {mandate.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Tab switcher */}
      <MandateTabSwitcher currentTab={isEditMode ? "edit" : "overview"} mandateId={mandate.id} />

      {isEditMode ? (
        /* ─── Edit Mode ─── */
        <MandateEditForm mandate={editData} />
      ) : (
        /* ─── Overview Mode ─── */
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            {mandate.description && (
              <Card title="Description">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {mandate.description}
                </p>
              </Card>
            )}

            <Card title="Requirements">
              <dl className="space-y-3 text-sm">
                <Row label="Cadre" value={getCadreLabel(mandate.cadre)} />
                {mandate.subSpecialty && <Row label="Sub-specialty" value={mandate.subSpecialty} />}
                {mandate.minYearsExperience != null && <Row label="Min Experience" value={`${mandate.minYearsExperience} years`} />}
                {mandate.requiredQualifications.length > 0 && <Row label="Required Quals" value={mandate.requiredQualifications.join(", ")} />}
                {mandate.preferredQualifications.length > 0 && <Row label="Preferred Quals" value={mandate.preferredQualifications.join(", ")} />}
                {mandate.valuesRequirements && <Row label="Values / Cultural" value={mandate.valuesRequirements} />}
              </dl>
            </Card>

            <Card title="Terms">
              <dl className="space-y-3 text-sm">
                <Row label="Type" value={mandate.type} />
                <Row label="Location" value={[mandate.locationCity, mandate.locationState].filter(Boolean).join(", ") || "Not specified"} />
                <Row label="Remote OK" value={mandate.isRemoteOk ? "Yes" : "No"} />
                <Row label="Relocation" value={mandate.isRelocationRequired ? "Yes" : "No"} />
                {(mandate.salaryRangeMin || mandate.salaryRangeMax) && (
                  <Row label="Salary Range" value={`${formatCurrency(Number(mandate.salaryRangeMin), mandate.salaryCurrency)} - ${formatCurrency(Number(mandate.salaryRangeMax), mandate.salaryCurrency)}`} />
                )}
                {mandate.facility && <Row label="Facility" value={mandate.facility.name} />}
                {!mandate.facility && mandate.facilityName && <Row label="Facility" value={mandate.facilityName} />}
                {mandate.clientContact && <Row label="Client Contact" value={mandate.clientContact} />}
              </dl>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card title="Status">
              <MandateStatusControls mandateId={mandate.id} currentStatus={mandate.status} />
            </Card>

            <Card title={`Matches (${mandate.matches.length})`} action={<FindMatchesButton mandateId={mandate.id} />} />

            {mandate.matches.length > 0 && (
              <div className="space-y-3">
                {mandate.matches.map((match) => (
                  <div key={match.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/cadrehealth/${match.professional.id}`} className="font-semibold hover:underline" style={{ color: "#0B3C5D" }}>
                          {match.professional.firstName} {match.professional.lastName}
                        </Link>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {getCadreLabel(match.professional.cadre)}
                          {match.professional.subSpecialty && ` / ${match.professional.subSpecialty}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {match.matchScore != null && (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${match.matchScore >= 80 ? "bg-emerald-50 text-emerald-700" : match.matchScore >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                            {match.matchScore}%
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${MATCH_STATUS_COLORS[match.status] || "bg-gray-100 text-gray-600"}`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400">
                      {match.professional.yearsOfExperience != null && (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{match.professional.yearsOfExperience} yrs exp</span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[match.professional.city, match.professional.state].filter(Boolean).join(", ") || "N/A"}
                      </span>
                      {match.professional.availability && <span>{match.professional.availability.replace(/_/g, " ")}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {match.professional.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{match.professional.email}</span>}
                      {match.professional.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{match.professional.phone}</span>}
                    </div>
                    {match.matchExplanation && (
                      <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">{match.matchExplanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>{title}</h2>
        {action}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-44 shrink-0 text-sm font-medium text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}
