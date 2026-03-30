import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import ProposalDetailClient from "./ProposalDetailClient";

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const canAccess = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canAccess) redirect("/dashboard");

  const { id } = await params;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Proposal" subtitle="View and edit proposal details" />
      <main className="flex-1 overflow-y-auto p-6">
        <ProposalDetailClient id={id} />
      </main>
    </div>
  );
}
