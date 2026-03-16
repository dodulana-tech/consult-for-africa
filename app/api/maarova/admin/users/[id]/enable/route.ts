import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { emailMaarovaInvite } from "@/lib/email";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const user = await prisma.maarovaUser.findUnique({
    where: { id },
    include: {
      organisation: { select: { name: true, isActive: true } },
    },
  });

  if (!user) return new Response("User not found", { status: 404 });
  if (!user.organisation.isActive) {
    return new Response("Organisation is inactive", { status: 400 });
  }

  // Generate new temporary password
  const tempPassword = randomBytes(12).toString("base64url") + "!1A";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.maarovaUser.update({
    where: { id },
    data: {
      passwordHash,
      isPortalEnabled: true,
      invitedAt: new Date(),
    },
  });

  // Send invite email (non-blocking)
  emailMaarovaInvite({
    email: user.email,
    name: user.name,
    organisationName: user.organisation.name,
    password: tempPassword,
  }).catch((err) => console.error("[maarova] enable portal email error:", err));

  return Response.json({ success: true });
}
