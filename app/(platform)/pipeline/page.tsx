import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import PipelineClient from "./PipelineClient";

export default async function PipelinePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isElevated = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);

  const [leads, discoveryCalls, proposals, staffingRequests, expansionRequests] = await Promise.all([
    isElevated
      ? prisma.lead.findMany({
          where: { status: { not: "CONVERTED" } },
          orderBy: [{ qualificationScore: "asc" }, { createdAt: "desc" }],
          take: 100,
          include: {
            assignedTo: { select: { name: true } },
            _count: { select: { discoveryCalls: true } },
          },
        })
      : Promise.resolve([]),
    isElevated
      ? prisma.discoveryCall.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            conductedBy: { select: { name: true } },
            convertedToClient: { select: { id: true, name: true } },
          },
        })
      : Promise.resolve([]),
    prisma.proposal.findMany({
      where: isElevated ? {} : { createdById: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        clientName: true,
        serviceType: true,
        status: true,
        budgetRange: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.staffingRequest.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        engagement: { select: { id: true, name: true, client: { select: { name: true } } } },
        createdBy: { select: { name: true } },
      },
    }),
    isElevated
      ? prisma.clientExpansionRequest.findMany({
          where: { status: "PROPOSED" },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            client: { select: { id: true, name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const activeLeads = leads.filter((l) => !["CONVERTED", "LOST"].includes(l.status));
  const stats = {
    activeLeads: activeLeads.length,
    activeDiscovery: discoveryCalls.filter((d) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(d.status)).length,
    activeProposals: proposals.filter((p) => ["DRAFT", "REVIEW", "SENT"].includes(p.status)).length,
    openStaffing: staffingRequests.length,
    pendingExpansions: expansionRequests.length,
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Pipeline"
        subtitle={`${stats.activeLeads} leads, ${stats.activeDiscovery} discovery calls, ${stats.activeProposals} proposals`}
      />
      <PipelineClient
        leads={JSON.parse(JSON.stringify(leads.map((l) => ({ ...l, discoveryCallCount: l._count.discoveryCalls }))))}
        discoveryCalls={JSON.parse(JSON.stringify(discoveryCalls))}
        proposals={JSON.parse(JSON.stringify(proposals))}
        staffingRequests={JSON.parse(JSON.stringify(staffingRequests))}
        expansionRequests={JSON.parse(JSON.stringify(expansionRequests))}
        stats={stats}
        isElevated={isElevated}
      />
    </div>
  );
}
