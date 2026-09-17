import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { emailTaskQuestion } from "@/lib/email";
import { canUseTaskBoard, partyFor } from "@/lib/tasks";

/**
 * POST /api/tasks/[id]/questions
 *
 * "I do not know what you meant" without "I have stopped". The status is
 * deliberately untouched: asking is not blocking, and a task should not look
 * stalled because somebody wanted to get it right.
 */
export const POST = handler(async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseTaskBoard(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true, title: true,
      assignee: { select: { id: true, name: true, email: true } },
      assigner: { select: { id: true, name: true, email: true } },
    },
  });
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });

  const party = partyFor({ assigneeId: task.assignee.id, assignerId: task.assigner.id }, session.user.id);
  if (party === "NONE") {
    return Response.json({ error: "This task is not on your desk." }, { status: 403 });
  }

  const { question } = await req.json();
  if (!question?.trim()) {
    return Response.json({ error: "Write the question." }, { status: 400 });
  }

  const created = await prisma.taskQuestion.create({
    data: { taskId: id, askedById: session.user.id, question: question.trim() },
    select: {
      id: true, question: true, answer: true, answeredAt: true, createdAt: true,
      askedBy: { select: { id: true, name: true, email: true, role: true } },
      answeredBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  // Goes to the other side of the desk, whichever side asked.
  const recipient = session.user.id === task.assignee.id ? task.assigner : task.assignee;
  if (recipient.id !== session.user.id) {
    emailTaskQuestion({
      assignerEmail: recipient.email,
      assignerName: recipient.name,
      askerName: session.user.name ?? "A colleague",
      title: task.title,
      question: question.trim(),
      taskId: id,
    }).catch((err) => console.error(`[tasks] question email failed for ${id}:`, err));
  }

  return Response.json({ question: JSON.parse(JSON.stringify(created)) }, { status: 201 });
});
