import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token?.trim()) {
    return new Response("Verification token is required", { status: 400 });
  }

  const agent = await prisma.salesAgent.findFirst({
    where: { emailVerifyToken: token.trim() },
    select: { id: true, emailVerified: true },
  });

  if (!agent) {
    return new Response("Invalid verification link.", { status: 400 });
  }

  if (agent.emailVerified) {
    return Response.json({ ok: true, alreadyVerified: true });
  }

  await prisma.salesAgent.update({
    where: { id: agent.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  return Response.json({ ok: true });
}
