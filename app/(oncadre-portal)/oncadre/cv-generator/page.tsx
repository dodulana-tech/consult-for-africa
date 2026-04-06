import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import CVPreview from "./CVPreview";

export const metadata = {
  title: "CV Generator | CadreHealth",
  description: "Generate a professional CV from your CadreHealth profile.",
};

export default async function CVGeneratorPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    include: {
      qualifications: { orderBy: { yearObtained: "desc" } },
      credentials: { orderBy: { createdAt: "desc" } },
      workHistory: {
        orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
      },
      cpdEntries: {
        orderBy: { dateCompleted: "desc" },
        take: 10,
      },
    },
  });

  if (!professional) redirect("/oncadre/register");

  const cadreLabel = getCadreLabel(professional.cadre);

  // Serialize dates for the client component
  const profileData = {
    firstName: professional.firstName,
    lastName: professional.lastName,
    email: professional.email,
    phone: professional.phone,
    cadre: cadreLabel,
    subSpecialty: professional.subSpecialty,
    yearsOfExperience: professional.yearsOfExperience,
    currentRole: professional.currentRole,
    currentFacility: professional.currentFacility,
    state: professional.state,
    city: professional.city,
    country: professional.country,
    qualifications: professional.qualifications.map((q) => ({
      id: q.id,
      type: q.type,
      name: q.name,
      institution: q.institution,
      yearObtained: q.yearObtained,
      score: q.score,
    })),
    credentials: professional.credentials.map((c) => ({
      id: c.id,
      type: c.type,
      regulatoryBody: c.regulatoryBody,
      licenseNumber: c.licenseNumber,
      issuedDate: c.issuedDate?.toISOString() ?? null,
      expiryDate: c.expiryDate?.toISOString() ?? null,
    })),
    workHistory: professional.workHistory.map((w) => ({
      id: w.id,
      facilityName: w.facilityName,
      role: w.role,
      department: w.department,
      startDate: w.startDate.toISOString(),
      endDate: w.endDate?.toISOString() ?? null,
      isCurrent: w.isCurrent,
    })),
    cpdSummary: {
      totalPoints: professional.cpdEntries.reduce(
        (sum, e) => sum + Number(e.points),
        0
      ),
      recentEntries: professional.cpdEntries.map((e) => ({
        id: e.id,
        title: e.activity,
        points: Number(e.points),
        dateCompleted: e.dateCompleted.toISOString(),
      })),
    },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CV Generator</h1>
        <p className="mt-2 text-sm text-gray-600">
          Generate a professional CV from your CadreHealth profile. Click
          &quot;Download as PDF&quot; to save using your browser&apos;s print
          function.
        </p>
      </div>
      <CVPreview profile={profileData} />
    </div>
  );
}
