import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { emailTaskQuestionAnswered } from "@/lib/email";
import { canUseTaskBoard, partyFor } from "@/lib/tasks";

/**
 * PATCH /api/tasks/[id]/questions/[questionId]
 *
 * Answering. Anyone party to the task except the person who asked, because
 * answering your own question records nothing anybody needed.
 */
export const PATCH = handler(async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; questionId: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseTaskBoard(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, questionId } = await ctx.params;
  const existing = await prisma.taskQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true, taskId: true, question: true, answeredAt: true,
      askedBy: { select: { id: true, name: true, email: true } },
      task: {
        select: {
          id: true, title: true,
          assignee: { select: { id: true } },
          assigner: { select: { id: true } },
        },
      },
    },
  });
  if (!existing || existing.taskId !== id) {
    return Response.json({ error: "Question not found" }, { status: 404 });
  }

  const party = partyFor(
    { assigneeId: existing.task.assignee.id, assignerId: existing.task.assigner.id },
    session.user.id,
  );
  if (party === "NONE") {
    return Response.json({ error: "This task is not on your desk." }, { status: 403 });
  }
  if (existing.askedBy.id === session.user.id) {
    return Response.json({ error: "You asked this one." }, { status: 403 });
  }

  const { answer } = await req.json();
  if (!answer?.trim()) {
    return Response.json({ error: "Write the answer." }, { status: 400 });
  }

  const updated = await prisma.taskQuestion.update({
    where: { id: questionId },
    data: { answer: answer.trim(), answeredById: session.user.id, answeredAt: new Date() },
    select: {
      id: true, question: true, answer: true, answeredAt: true, createdAt: true,
      askedBy: { select: { id: true, name: true, email: true, role: true } },
      answeredBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  emailTaskQuestionAnswered({
    askerEmail: existing.askedBy.email,
    askerName: existing.askedBy.name,
    answererName: session.user.name ?? "A colleague",
    title: existing.task.title,
    question: existing.question,
    answer: answer.trim(),
    taskId: id,
  }).catch((err) => console.error(`[tasks] answer email failed for ${id}:`, err));

  return Response.json({ question: JSON.parse(JSON.stringify(updated)) });
});
