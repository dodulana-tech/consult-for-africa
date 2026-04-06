import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import Link from "next/link";
import ProfilePersonalInfo from "./ProfilePersonalInfo";
import ProfileCredentials from "./ProfileCredentials";
import ProfileQualifications from "./ProfileQualifications";
import ProfileCPD from "./ProfileCPD";
import ProfileWorkHistory from "./ProfileWorkHistory";
import CVUploadBuilder from "@/components/cadrehealth/CVUploadBuilder";

export default async function ProfilePage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    include: {
      credentials: { orderBy: { createdAt: "desc" } },
      qualifications: { orderBy: { createdAt: "desc" } },
      cpdEntries: { orderBy: { dateCompleted: "desc" } },
      workHistory: {
        orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
      },
    },
  });

  if (!professional) redirect("/oncadre/register");

  // Compute CPD summary
  const cycleStart = new Date(new Date().getFullYear(), 0, 1);
  const cycleEnd = new Date(new Date().getFullYear(), 11, 31);
  const cycleEntries = professional.cpdEntries.filter(
    (e) => e.dateCompleted >= cycleStart && e.dateCompleted <= cycleEnd
  );
  const totalPoints = cycleEntries.reduce(
    (sum, e) => sum + Number(e.points),
    0
  );
  const targetPoints = 25;
  const daysUntilRenewal = Math.max(
    0,
    Math.ceil((cycleEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const cadreLabel = getCadreLabel(professional.cadre);

  // Serialize dates for client components
  const serializedCredentials = professional.credentials.map((c) => ({
    id: c.id,
    type: c.type,
    regulatoryBody: c.regulatoryBody,
    licenseNumber: c.licenseNumber,
    issuedDate: c.issuedDate?.toISOString() || null,
    expiryDate: c.expiryDate?.toISOString() || null,
    verificationStatus: c.verificationStatus,
    documentUrl: c.documentUrl,
  }));

  const serializedQualifications = professional.qualifications.map((q) => ({
    id: q.id,
    type: q.type,
    name: q.name,
    institution: q.institution,
    yearObtained: q.yearObtained,
    score: q.score,
    expiryDate: q.expiryDate?.toISOString() || null,
    documentUrl: q.documentUrl,
    verificationStatus: q.verificationStatus,
  }));

  const serializedCPD = professional.cpdEntries.map((e) => ({
    id: e.id,
    activity: e.activity,
    category: e.category,
    provider: e.provider,
    points: Number(e.points),
    dateCompleted: e.dateCompleted.toISOString(),
    certificateUrl: e.certificateUrl,
    verified: e.verified,
  }));

  const serializedWorkHistory = professional.workHistory.map((w) => ({
    id: w.id,
    facilityName: w.facilityName,
    facilityId: w.facilityId,
    role: w.role,
    department: w.department,
    startDate: w.startDate.toISOString(),
    endDate: w.endDate?.toISOString() || null,
    isCurrent: w.isCurrent,
    confirmedByFacility: w.confirmedByFacility,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Professional Profile
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {cadreLabel}
            {professional.subSpecialty
              ? ` / ${professional.subSpecialty}`
              : ""}
          </p>
        </div>
        <Link
          href="/oncadre/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Quick Setup: CV Upload */}
      {professional.profileCompleteness < 60 && (
        <div
          className="rounded-2xl border p-6"
          style={{
            borderColor: "#D4AF37",
            background: "linear-gradient(135deg, #FFFDF5, #FFF)",
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #D4AF37, #c4a030)" }}
            >
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quick Setup</h2>
              <p className="text-sm text-gray-500">Upload your CV to auto-fill your profile in seconds</p>
            </div>
          </div>
          <CVUploadBuilder />
        </div>
      )}

      {/* Profile completeness bar */}
      {professional.profileCompleteness < 100 && (
        <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Profile completeness
            </p>
            <span className="text-sm font-bold text-[#D4AF37]">
              {professional.profileCompleteness}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#D4AF37]/20">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-all"
              style={{ width: `${professional.profileCompleteness}%` }}
            />
          </div>
        </div>
      )}

      {/* Section 1: Personal Info */}
      <ProfilePersonalInfo
        professional={{
          id: professional.id,
          firstName: professional.firstName,
          lastName: professional.lastName,
          email: professional.email,
          phone: professional.phone,
          cadre: professional.cadre,
          subSpecialty: professional.subSpecialty,
          yearsOfExperience: professional.yearsOfExperience,
          state: professional.state,
          city: professional.city,
          isDiaspora: professional.isDiaspora,
          diasporaCountry: professional.diasporaCountry,
          country: professional.country,
        }}
      />

      {/* Section 2: Credentials */}
      <ProfileCredentials
        initialCredentials={serializedCredentials}
        cadre={professional.cadre}
      />

      {/* Section 3: Qualifications */}
      <ProfileQualifications
        initialQualifications={serializedQualifications}
      />

      {/* Section 4: CPD Tracker */}
      <ProfileCPD
        initialEntries={serializedCPD}
        initialSummary={{
          totalPoints,
          targetPoints,
          daysUntilRenewal,
          cycleYear: new Date().getFullYear(),
        }}
      />

      {/* Section 5: Work History */}
      <ProfileWorkHistory initialHistory={serializedWorkHistory} />
    </div>
  );
}
