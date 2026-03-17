import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { email360RaterInvite } from "@/lib/email";
import crypto from "crypto";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getMaarovaSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { requestId, raters } = body;

  if (!requestId || !Array.isArray(raters) || raters.length === 0) {
    return new Response("requestId and raters array required", { status: 400 });
  }

  // Verify the request belongs to this user
  const request = await prisma.maarova360Request.findFirst({
    where: { id: requestId, subjectId: session.sub },
  });

  if (!request) {
    return new Response("Request not found", { status: 404 });
  }

  if (request.status !== "COLLECTING") {
    return new Response("Request is no longer accepting new raters", {
      status: 400,
    });
  }

  const validRoles = ["SUPERVISOR", "PEER", "DIRECT_REPORT", "SELF"];

  const invites = [];
  for (const rater of raters) {
    const { raterEmail, raterName, role } = rater;
    if (!raterEmail?.trim() || !raterName?.trim()) continue;
    if (!validRoles.includes(role)) continue;

    // Check for existing invite with same email on this request
    const existing = await prisma.maarova360RaterInvite.findFirst({
      where: { requestId, raterEmail: raterEmail.toLowerCase() },
    });
    if (existing) continue;

    const token = crypto.randomBytes(32).toString("hex");

    const invite = await prisma.maarova360RaterInvite.create({
      data: {
        requestId,
        raterEmail: raterEmail.toLowerCase().trim(),
        raterName: raterName.trim(),
        role,
        token,
        status: "INVITED",
      },
      select: {
        id: true,
        raterEmail: true,
        raterName: true,
        role: true,
        status: true,
        completedAt: true,
        createdAt: true,
      },
    });

    invites.push(invite);

    // Fetch subject name for the email
    const subject = await prisma.maarovaUser.findUnique({
      where: { id: session.sub },
      select: { name: true },
    });

    email360RaterInvite({
      raterEmail: raterEmail.toLowerCase().trim(),
      raterName: raterName.trim(),
      subjectName: subject?.name ?? "a colleague",
      role,
      token,
    }).catch((err) => console.error("Failed to send 360 rater invite:", err));
  }

  return Response.json({ invites }, { status: 201 });
}
