import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { canUseOfficeDesk } from "@/lib/office";
import DeskClient from "./DeskClient";

export const metadata = { title: "My desk | Consult For Africa" };

export default async function DeskPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!canUseOfficeDesk(session.user.role)) redirect("/dashboard");

  const firstName = (session.user.name ?? "").split(" ")[0];
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="My desk" subtitle="Whose move is it. Work down the list." />
      <DeskClient firstName={firstName} currentUserId={session.user.id} />
    </div>
  );
}
