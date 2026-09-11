import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { canAssignToOthers, canSeeAllTasks, canUseTaskBoard } from "@/lib/tasks";
import TaskBoardClient from "./TaskBoardClient";

export const metadata = { title: "Tasks | Consult For Africa" };

export default async function TasksPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!canUseTaskBoard(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Tasks"
        subtitle="Every task carries a brief and a definition of done"
      />
      <TaskBoardClient
        currentUserId={session.user.id}
        canAssign={canAssignToOthers(session.user.role)}
        canSeeAll={canSeeAllTasks(session.user.role)}
      />
    </div>
  );
}
