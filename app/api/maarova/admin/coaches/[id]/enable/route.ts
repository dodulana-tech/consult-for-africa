import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emailMaarovaCoachCredentials } from "@/lib/email";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { NextRequest } from "next/server";

/**
 * POST /api/maarova/admin/coaches/[id]/enable
 * Enable coach portal access. Generates a temp password and marks coach as portal enabled.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const coach = await prisma.maarovaCoach.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, isPortalEnabled: true },
  });

  if (!coach) {
    return Response.json({ error: "Coach not found" }, { status: 404 });
  }

  const tempPassword = randomBytes(12).toString("base64url") + "!1A";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.maarovaCoach.update({
    where: { id },
    data: {
      passwordHash,
      isPortalEnabled: true,
    },
  });

  // Send credentials via email
  emailMaarovaCoachCredentials({
    email: coach.email,
    name: coach.name,
    password: tempPassword,
  }).catch((err) => console.error("[coach-enable] Failed to send credentials email:", err));

  return Response.json({
    coach: { id: coach.id, name: coach.name, email: coach.email },
    message: `Portal enabled for ${coach.name}. Credentials sent to ${coach.email}.`,
  });
}
