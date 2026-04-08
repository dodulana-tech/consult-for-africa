import { prisma } from "@/lib/prisma";
import OpportunityCreateForm from "./OpportunityCreateForm";

export default async function CreateAgentOpportunityPage() {
  const [clients, engagements] = await Promise.all([
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.engagement.findMany({
      where: { status: { in: ["ACTIVE", "PLANNING"] } },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Create Opportunity
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Define a new commission-based sales opportunity for agents
        </p>
      </div>
      <OpportunityCreateForm
        clients={clients}
        engagements={engagements}
      />
    </div>
  );
}
