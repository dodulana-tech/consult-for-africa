import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import DeliverableSubmit from "@/components/platform/DeliverableSubmit";

export default async function DeliverableSubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      assignment: {
        include: { consultant: { select: { id: true, name: true } } },
      },
    },
  });

  if (!deliverable) notFound();

  const serialized = {
    ...deliverable,
    submittedAt: deliverable.submittedAt?.toISOString() ?? null,
    reviewedAt: deliverable.reviewedAt?.toISOString() ?? null,
    approvedAt: deliverable.approvedAt?.toISOString() ?? null,
    createdAt: deliverable.createdAt.toISOString(),
    updatedAt: deliverable.updatedAt.toISOString(),
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Submit Deliverable" subtitle={deliverable.project.name} />
      <DeliverableSubmit deliverable={serialized} userId={session.user.id} />
    </div>
  );
}
