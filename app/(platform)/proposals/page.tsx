import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import ProposalsList from "@/components/platform/ProposalsList";

export default async function ProposalsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canAccess = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canAccess) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Proposals"
        subtitle="Create, manage, and track client proposals"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <ProposalsList />
      </main>
    </div>
  );
}
