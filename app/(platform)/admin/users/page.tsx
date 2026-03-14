import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import AdminUsersManager from "@/components/platform/AdminUsersManager";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      consultantProfile: { select: { tier: true, availabilityStatus: true, totalProjects: true, averageRating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    consultantProfile: u.consultantProfile
      ? {
          ...u.consultantProfile,
          averageRating: u.consultantProfile.averageRating
            ? Number(u.consultantProfile.averageRating)
            : null,
        }
      : null,
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="User Management" subtitle="Invite and manage platform users" />
      <AdminUsersManager users={serialized} currentUserId={session.user.id} />
    </div>
  );
}
