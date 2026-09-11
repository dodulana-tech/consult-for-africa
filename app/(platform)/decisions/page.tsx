import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { canUseOfficeDesk } from "@/lib/office";
import DecisionsClient from "./DecisionsClient";

export const metadata = { title: "Decisions | Consult For Africa" };

export default async function DecisionsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!canUseOfficeDesk(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Decisions" subtitle="Teed up so they can be cleared in one sitting" />
      <DecisionsClient currentUserId={session.user.id} />
    </div>
  );
}
