import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import AdvisorChat from "./AdvisorChat";

export default async function AdvisorPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: {
      cadre: true,
      firstName: true,
      lastName: true,
      subSpecialty: true,
      yearsOfExperience: true,
    },
  });

  if (!professional) redirect("/oncadre/register");

  const messages = await prisma.cadreAdvisorMessage.findMany({
    where: { professionalId: session.sub },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const serializedMessages = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  const cadreLabel = getCadreLabel(professional.cadre);

  return (
    <AdvisorChat
      initialMessages={serializedMessages}
      professional={{
        firstName: professional.firstName,
        lastName: professional.lastName,
        cadre: cadreLabel,
        subSpecialty: professional.subSpecialty,
        yearsOfExperience: professional.yearsOfExperience,
      }}
    />
  );
}
