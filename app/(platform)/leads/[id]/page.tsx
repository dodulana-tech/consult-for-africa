import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LeadDetailClient from "./LeadDetailClient";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      existingClient: { select: { id: true, name: true } },
      convertedToClient: { select: { id: true, name: true } },
      referrals: {
        select: { id: true, name: true, email: true, notes: true, referrer: { select: { name: true } } },
      },
      discoveryCalls: {
        select: { id: true, status: true, aiSummary: true, createdAt: true, aiServiceLineMatch: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) notFound();

  return (
    <div className="flex-1 overflow-y-auto">
      <LeadDetailClient lead={JSON.parse(JSON.stringify(lead))} />
    </div>
  );
}
