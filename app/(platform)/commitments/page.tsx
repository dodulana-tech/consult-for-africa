import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { canUseOfficeDesk } from "@/lib/office";
import CommitmentsClient from "./CommitmentsClient";

export const metadata = { title: "Commitments | Consult For Africa" };

export default async function CommitmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!canUseOfficeDesk(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Commitments" subtitle="Who promised what, and when it was last chased" />
      <CommitmentsClient currentUserId={session.user.id} />
    </div>
  );
}
