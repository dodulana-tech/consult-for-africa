import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import TimesheetManager from "@/components/platform/TimesheetManager";

export default async function TimesheetsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isEM = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);

  const entries = await prisma.timeEntry.findMany({
    where: isEM
      ? { assignment: { project: { engagementManagerId: session.user.id } } }
      : { consultantId: session.user.id },
    include: {
      consultant: { select: { id: true, name: true, email: true } },
      assignment: {
        include: {
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // Get consultant's assignments for log form
  const myAssignments = !isEM
    ? await prisma.assignment.findMany({
        where: { consultantId: session.user.id, status: { in: ["ACTIVE", "PENDING"] } },
        include: { project: { select: { id: true, name: true } } },
      })
    : [];

  const serialized = entries.map((e) => ({
    ...e,
    hours: Number(e.hours),
    billableAmount: e.billableAmount ? Number(e.billableAmount) : null,
    date: e.date.toISOString(),
    approvedAt: e.approvedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    assignment: {
      ...e.assignment,
      rateAmount: Number((e.assignment as any).rateAmount ?? 0),
      startDate: (e.assignment as any).startDate?.toISOString?.() ?? "",
      endDate: (e.assignment as any).endDate?.toISOString?.() ?? null,
      createdAt: (e.assignment as any).createdAt?.toISOString?.() ?? "",
      updatedAt: (e.assignment as any).updatedAt?.toISOString?.() ?? "",
    },
  }));

  const serializedAssignments = myAssignments.map((a) => ({
    ...a,
    rateAmount: Number(a.rateAmount),
    estimatedHours: a.estimatedHours ?? null,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={isEM ? "Timesheets" : "My Time"}
        subtitle={isEM ? "Approve consultant time entries" : "Log and track your hours"}
      />
      <TimesheetManager
        entries={serialized}
        myAssignments={serializedAssignments}
        isEM={isEM}
        userId={session.user.id}
      />
    </div>
  );
}
