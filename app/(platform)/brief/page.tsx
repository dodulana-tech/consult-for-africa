import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { canUseOfficeDesk } from "@/lib/office";
import { canAssignToOthers } from "@/lib/tasks";
import BriefClient from "./BriefClient";

export const metadata = { title: "Brief | Consult For Africa" };

export default async function BriefPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!canUseOfficeDesk(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="The brief" subtitle="Everything waiting on you, and everything slipping" />
      <BriefClient currentUserId={session.user.id} canPickPrincipal={canAssignToOthers(session.user.role)} />
    </div>
  );
}
