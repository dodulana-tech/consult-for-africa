import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import DeliverableReview from "@/components/platform/DeliverableReview";

export default async function DeliverableReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, budgetCurrency: true } },
      assignment: {
        include: {
          consultant: {
            select: {
              id: true,
              name: true,
              email: true,
              consultantProfile: { select: { title: true, location: true, tier: true } },
            },
          },
        },
      },
    },
  });

  if (!deliverable) notFound();

  const serialized = {
    ...deliverable,
    dueDate: deliverable.dueDate?.toISOString() ?? null,
    submittedAt: deliverable.submittedAt?.toISOString() ?? null,
    reviewedAt: deliverable.reviewedAt?.toISOString() ?? null,
    approvedAt: deliverable.approvedAt?.toISOString() ?? null,
    createdAt: deliverable.createdAt.toISOString(),
    updatedAt: deliverable.updatedAt.toISOString(),
    assignmentId: deliverable.assignmentId,
    assignment: deliverable.assignment
      ? {
          ...deliverable.assignment,
          id: deliverable.assignment.id,
          rateAmount: deliverable.assignment.rateAmount?.toString() ?? null,
          startDate: deliverable.assignment.startDate?.toISOString() ?? null,
          endDate: deliverable.assignment.endDate?.toISOString() ?? null,
          createdAt: deliverable.assignment.createdAt.toISOString(),
          updatedAt: deliverable.assignment.updatedAt.toISOString(),
        }
      : null,
  };

  const isEM = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Review Deliverable"
        subtitle={deliverable.project.name}
      />
      <DeliverableReview
        deliverable={serialized}
        isEM={isEM}
        userId={session.user.id}
        userName={session.user.name ?? "Unknown"}
      />
    </div>
  );
}
