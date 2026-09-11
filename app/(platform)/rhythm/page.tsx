import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { canManageRhythm, canUseOfficeDesk } from "@/lib/office";
import RhythmClient from "./RhythmClient";

export const metadata = { title: "Operating rhythm | Consult For Africa" };

export default async function RhythmPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!canUseOfficeDesk(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Operating rhythm" subtitle="The cadence that repeats, whoever is in the seat" />
      <RhythmClient canManage={canManageRhythm(session.user.role)} />
    </div>
  );
}
