import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

// NO AUTH REQUIRED - token-based access for external raters

export const GET = handler(async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "360-rate", { windowMs: 60_000, max: 20 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;

  const invite = await prisma.maarova360RaterInvite.findUnique({
    where: { token },
    include: {
      request: {
        include: {
          subject: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!invite) {
    return Response.json({ error: "Invalid or unknown token" }, { status: 404 });
  }

  if (invite.status === "COMPLETED") {
    return Response.json(
      { error: "already_completed", message: "You have already submitted your feedback. Thank you." },
      { status: 400 }
    );
  }

  if (invite.status === "EXPIRED" || new Date() > invite.request.deadline) {
    return Response.json(
      { error: "expired", message: "This feedback request has expired." },
      { status: 400 }
    );
  }

  // Fetch 360 module questions
  const module = await prisma.maarovaModule.findFirst({
    where: { type: "THREE_SIXTY", isActive: true },
    include: {
      questionGroups: {
        where: { questions: { some: { isActive: true } } },
        orderBy: { order: "asc" },
        include: {
          questions: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              text: true,
              format: true,
              options: true,
              dimension: true,
              subDimension: true,
              order: true,
            },
          },
        },
      },
    },
  });

  const subjectFirstName = invite.request.subject.name.split(" ")[0];

  return Response.json({
    subjectFirstName,
    raterName: invite.raterName,
    role: invite.role,
    deadline: invite.request.deadline,
    module: module
      ? {
          id: module.id,
          name: module.name,
          description: module.description,
          groups: module.questionGroups.map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description,
            context: g.context,
            questions: g.questions,
          })),
        }
      : null,
  });
});

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "360-rate-submit", { windowMs: 60_000, max: 10 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;

  const invite = await prisma.maarova360RaterInvite.findUnique({
    where: { token },
    include: {
      request: {
        select: {
          id: true,
          status: true,
          minRaters: true,
          invites: { select: { id: true, status: true } },
        },
      },
    },
  });

  if (!invite) {
    return Response.json({ error: "Invalid token" }, { status: 404 });
  }

  if (invite.status === "COMPLETED") {
    return Response.json(
      { error: "already_completed", message: "Feedback already submitted." },
      { status: 400 }
    );
  }

  if (invite.status === "EXPIRED") {
    return Response.json(
      { error: "expired", message: "This feedback request has expired." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { responses } = body;

  if (!responses || typeof responses !== "object") {
    return Response.json({ error: "responses object required" }, { status: 400 });
  }

  // Save responses and mark complete
  await prisma.maarova360RaterInvite.update({
    where: { id: invite.id },
    data: {
      responses,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  // Check if all invites are completed
  const allInvites = invite.request.invites;
  const completedCount =
    allInvites.filter((i) => i.status === "COMPLETED").length + 1; // +1 for this one
  const totalInvites = allInvites.length;

  // If all invites are done, update request status
  if (completedCount >= totalInvites) {
    await prisma.maarova360Request.update({
      where: { id: invite.request.id },
      data: { status: "COMPLETE" },
    });
  }

  return Response.json({
    ok: true,
    message: "Thank you for your feedback.",
  });
});
