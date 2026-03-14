import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import AdminReferralsManager from "@/components/platform/AdminReferralsManager";

export default async function AdminReferralsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const referrals = await prisma.referral.findMany({
    include: {
      referrer: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = referrals.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const counts = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === "PENDING").length,
    contacted: referrals.filter((r) => r.status === "CONTACTED").length,
    converted: referrals.filter((r) => r.status === "CONVERTED").length,
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Referrals"
        subtitle={`${counts.pending} pending, ${counts.converted} converted`}
      />
      <AdminReferralsManager referrals={serialized} counts={counts} />
    </div>
  );
}
