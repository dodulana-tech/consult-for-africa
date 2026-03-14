import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import ReferralForm from "@/components/platform/ReferralForm";

export default async function ReferPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch user's own referrals
  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, type: true, name: true, email: true, organisation: true, status: true, createdAt: true,
    },
  });

  const serialized = referrals.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Refer & Invite" subtitle="Grow the CFA network" />
      <ReferralForm myReferrals={serialized} />
    </div>
  );
}
