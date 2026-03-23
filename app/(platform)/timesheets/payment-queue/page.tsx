import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import PaymentQueue from "@/components/platform/PaymentQueue";

export default async function PaymentQueuePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAuthorized = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(
    session.user.role
  );
  if (!isAuthorized) redirect("/timesheets");

  // All approved (not yet paid) entries
  const entries = await prisma.timeEntry.findMany({
    where: { status: "APPROVED" },
    include: {
      consultant: { select: { id: true, name: true, email: true } },
      assignment: {
        include: {
          engagement: { select: { id: true, name: true } },
          consultant: {
            select: {
              consultantProfile: {
                select: {
                  bankName: true,
                  accountNumber: true,
                  accountName: true,
                  swiftCode: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const serialized = entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    hours: Number(e.hours),
    description: e.description,
    billableAmount: e.billableAmount ? Number(e.billableAmount) : null,
    currency: e.currency,
    consultant: e.consultant,
    assignment: {
      rateType: e.assignment.rateType,
      engagement: e.assignment.engagement,
      consultant: e.assignment.consultant,
    },
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Payment Queue"
        subtitle="Approved entries pending payment"
        backHref="/timesheets"
      />
      <PaymentQueue entries={serialized} />
    </div>
  );
}
