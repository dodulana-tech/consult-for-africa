import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signAgentPortalJWT } from "@/lib/agentPortalAuth";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return new Response("Email and password required", { status: 400 });

  const agent = await prisma.salesAgent.findUnique({
    where: { email: (email as string).toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      passwordHash: true,
      isPortalEnabled: true,
      status: true,
    },
  });

  if (!agent || !agent.passwordHash) {
    return new Response("Invalid credentials", { status: 401 });
  }

  if (agent.status === "DEACTIVATED" || agent.status === "SUSPENDED") {
    return new Response("Account is not active. Contact support.", { status: 403 });
  }

  const valid = await bcrypt.compare(password as string, agent.passwordHash);
  if (!valid) return new Response("Invalid credentials", { status: 401 });

  const token = signAgentPortalJWT({
    sub: agent.id,
    email: agent.email,
    firstName: agent.firstName,
    lastName: agent.lastName,
    status: agent.status,
  });

  const cookieStore = await cookies();
  cookieStore.set("agent_portal_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60,
    path: "/agent",
  });

  await prisma.salesAgent.update({
    where: { id: agent.id },
    data: { lastLoginAt: new Date() },
  });

  return Response.json({ ok: true, firstName: agent.firstName, status: agent.status });
});

export const DELETE = handler(async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("agent_portal_token");
  return Response.json({ ok: true });
});
