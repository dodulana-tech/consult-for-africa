import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { canAssignToOthers, canUseTaskBoard } from "@/lib/tasks";
import TaskDetailClient from "./TaskDetailClient";

export const metadata = { title: "Task | Consult For Africa" };

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!canUseTaskBoard(session.user.role)) redirect("/dashboard");

  const { id } = await params;
  if (!id) notFound();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Task" backHref="/tasks" />
      <TaskDetailClient
        taskId={id}
        currentUserId={session.user.id}
        canAssign={canAssignToOthers(session.user.role)}
      />
    </div>
  );
}
