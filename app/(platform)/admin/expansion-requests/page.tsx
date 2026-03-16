import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import ExpansionRequestsClient from "./ExpansionRequestsClient";

const SERVICE_LABELS: Record<string, string> = {
  HOSPITAL_OPERATIONS: "Hospital Operations",
  TURNAROUND: "Turnaround",
  EMBEDDED_LEADERSHIP: "Embedded Leadership",
  CLINICAL_GOVERNANCE: "Clinical Governance",
  DIGITAL_HEALTH: "Digital Health",
  HEALTH_SYSTEMS: "Health Systems",
  DIASPORA_EXPERTISE: "Diaspora Expertise",
  EM_AS_SERVICE: "EM as a Service",
};

export default async function ExpansionRequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!allowed) redirect("/dashboard");

  const requests = await prisma.clientExpansionRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  const serialized = requests.map((r) => ({
    id: r.id,
    clientName: r.client.name,
    clientId: r.clientId,
    contactId: r.contactId,
    serviceType: r.serviceType ? (SERVICE_LABELS[r.serviceType] ?? r.serviceType) : "Not specified",
    description: r.description,
    urgency: r.urgency,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Expansion Requests"
        subtitle={`${requests.length} requests from clients`}
        backHref="/dashboard"
      />
      <ExpansionRequestsClient requests={serialized} />
    </div>
  );
}
