import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getRegulatoryBody } from "@/lib/cadreHealth/cadres";
import DocumentSubmissionClient from "./DocumentSubmissionClient";

const ALLOWED_STAGES = [
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_DONE",
  "OFFER",
  "PLACED",
];

export default async function DocumentsPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      cadre: true,
      subSpecialty: true,
      cvFileUrl: true,
      governmentIdUrl: true,
      passportPhotoUrl: true,
      documentsSubmittedAt: true,
      recruitmentStage: true,
      credentials: {
        select: {
          id: true,
          type: true,
          regulatoryBody: true,
          licenseNumber: true,
          documentUrl: true,
        },
        orderBy: { createdAt: "desc" },
      },
      qualifications: {
        select: {
          id: true,
          type: true,
          name: true,
          institution: true,
          yearObtained: true,
          documentUrl: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!professional) redirect("/oncadre/login");

  // Gate: only accessible for shortlisted+ stages
  if (
    !professional.recruitmentStage ||
    !ALLOWED_STAGES.includes(professional.recruitmentStage)
  ) {
    redirect("/oncadre/dashboard");
  }

  const regulatoryBody = getRegulatoryBody(professional.cadre);

  return (
    <DocumentSubmissionClient
      professional={{
        id: professional.id,
        firstName: professional.firstName,
        lastName: professional.lastName,
        cadre: professional.cadre,
        subSpecialty: professional.subSpecialty,
        regulatoryBody,
        cvFileUrl: professional.cvFileUrl,
        governmentIdUrl: professional.governmentIdUrl,
        passportPhotoUrl: professional.passportPhotoUrl,
        documentsSubmittedAt: professional.documentsSubmittedAt?.toISOString() ?? null,
        credentials: professional.credentials,
        qualifications: professional.qualifications,
      }}
    />
  );
}
