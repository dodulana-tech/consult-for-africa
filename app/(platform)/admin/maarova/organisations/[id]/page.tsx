import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import MaarovaOrgDetail from "@/components/platform/maarova/MaarovaOrgDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MaarovaOrgDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const org = await prisma.maarovaOrganisation.findUnique({
    where: { id },
    include: {
      users: {
        orderBy: { createdAt: "desc" },
        include: {
          sessions: {
            select: { id: true, status: true, completedAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!org) notFound();

  const serializedOrg = {
    id: org.id,
    name: org.name,
    type: org.type,
    country: org.country,
    city: org.city,
    contactName: org.contactName,
    contactEmail: org.contactEmail,
    contactPhone: org.contactPhone,
    stream: org.stream,
    maxAssessments: org.maxAssessments,
    usedAssessments: org.usedAssessments,
    isActive: org.isActive,
    notes: org.notes,
    createdAt: org.createdAt.toISOString(),
  };

  const serializedUsers = org.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    title: u.title,
    department: u.department,
    isPortalEnabled: u.isPortalEnabled,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    latestSessionStatus: u.sessions[0]?.status ?? null,
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={org.name}
        subtitle={`${
          { private_hospital: "Private Hospital", hospital_group: "Hospital Group", government: "Government", ngo: "NGO" }[org.type] ?? org.type
        } - ${
          { RECRUITMENT: "Recruitment", DEVELOPMENT: "Development", INTELLIGENCE: "Intelligence" }[org.stream] ?? org.stream
        }`}
        backHref="/admin/maarova/organisations"
      />
      <MaarovaOrgDetail org={serializedOrg} users={serializedUsers} />
    </div>
  );
}
