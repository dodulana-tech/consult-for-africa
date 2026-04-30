import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import CommunicationsInbox from "@/components/platform/communications/CommunicationsInbox";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/dashboard");

  const params = await searchParams;
  const tab = params.tab || "all";
  const type = params.type;
  const q = params.q?.trim() || undefined;

  const where: Record<string, unknown> = { isArchived: false };
  if (type) where.type = type;
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { outcome: { contains: q, mode: "insensitive" } },
    ];
  }
  if (tab === "follow-ups") {
    where.nextActionDate = { not: null };
    where.status = { notIn: ["CANCELLED", "FAILED"] };
  } else if (tab === "mine") {
    where.loggedById = session.user.id;
  } else if (tab === "inbound") {
    where.direction = "INBOUND";
  }

  const [items, total, followUpCount, mineCount, inboundCount] = await Promise.all([
    prisma.communication.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 100,
      include: {
        loggedBy: { select: { id: true, name: true } },
        consultant: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        clientContact: { select: { id: true, name: true } },
        application: { select: { id: true, firstName: true, lastName: true } },
        cadreProfessional: { select: { id: true, firstName: true, lastName: true } },
        partnerFirm: { select: { id: true, name: true } },
        salesAgent: { select: { id: true, firstName: true, lastName: true } },
        nextActionAssignedTo: { select: { id: true, name: true } },
      },
    }),
    prisma.communication.count({ where: { isArchived: false } }),
    prisma.communication.count({
      where: { isArchived: false, nextActionDate: { not: null }, status: { notIn: ["CANCELLED", "FAILED"] } },
    }),
    prisma.communication.count({ where: { isArchived: false, loggedById: session.user.id } }),
    prisma.communication.count({ where: { isArchived: false, direction: "INBOUND" } }),
  ]);

  const serialized = items.map((c) => ({
    id: c.id,
    type: c.type,
    direction: c.direction,
    status: c.status,
    subject: c.subject,
    body: c.body,
    occurredAt: c.occurredAt.toISOString(),
    nextAction: c.nextAction,
    nextActionDate: c.nextActionDate?.toISOString() ?? null,
    outcome: c.outcome,
    loggedBy: c.loggedBy,
    nextActionAssignedTo: c.nextActionAssignedTo,
    subjectName:
      c.consultant?.name ||
      c.client?.name ||
      c.clientContact?.name ||
      (c.application ? `${c.application.firstName} ${c.application.lastName}` : "") ||
      (c.cadreProfessional ? `${c.cadreProfessional.firstName} ${c.cadreProfessional.lastName}` : "") ||
      c.partnerFirm?.name ||
      (c.salesAgent ? `${c.salesAgent.firstName} ${c.salesAgent.lastName}` : "") ||
      c.prospectName ||
      "Unknown",
    subjectLink:
      c.consultant ? `/consultants/${c.consultant.id}` :
      c.client ? `/clients/${c.client.id}` :
      c.application ? `/talent/${c.application.id}` :
      c.cadreProfessional ? `/admin/cadrehealth/${c.cadreProfessional.id}` :
      null,
    subjectType: c.subjectType,
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Communications"
        subtitle={`${total} total · ${followUpCount} follow-up${followUpCount !== 1 ? "s" : ""}`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <CommunicationsInbox
          items={serialized}
          tab={tab}
          counts={{ all: total, followUps: followUpCount, mine: mineCount, inbound: inboundCount }}
          activeType={type}
          activeSearch={q}
        />
      </main>
    </div>
  );
}
