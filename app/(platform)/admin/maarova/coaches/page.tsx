import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import MaarovaCoachList from "@/components/platform/maarova/MaarovaCoachList";

export default async function MaarovaCoachesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const coaches = await prisma.maarovaCoach.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { matches: true } } },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Coaches" subtitle="Manage coach network and vetting" backHref="/admin/maarova" />
      <div className="flex-1 overflow-y-auto">
        <MaarovaCoachList coaches={JSON.parse(JSON.stringify(coaches))} />
      </div>
    </div>
  );
}
