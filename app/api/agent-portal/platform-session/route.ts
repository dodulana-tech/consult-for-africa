import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signAgentPortalJWT } from "@/lib/agentPortalAuth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Creates an agent portal session (JWT + cookie) for a platform user
 * who already has a linked, APPROVED SalesAgent profile.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agent = await prisma.salesAgent.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email! },
      ],
      status: "APPROVED",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
    },
  });

  if (!agent) {
    return NextResponse.json(
      { error: "No approved agent profile found" },
      { status: 404 }
    );
  }

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
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return NextResponse.json({ ok: true, redirect: "/agent/dashboard" });
}
