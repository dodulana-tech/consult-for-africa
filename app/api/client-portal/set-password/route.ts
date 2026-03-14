import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR", "ENGAGEMENT_MANAGER"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { contactId, password } = await req.json();
  if (!contactId || !password) {
    return new Response("contactId and password required", { status: 400 });
  }
  if ((password as string).length < 8) {
    return new Response("Password must be at least 8 characters", { status: 400 });
  }

  const contact = await prisma.clientContact.findUnique({
    where: { id: contactId as string },
    select: { id: true },
  });

  if (!contact) return new Response("Contact not found", { status: 404 });

  const passwordHash = await bcrypt.hash(password as string, 12);

  await prisma.clientContact.update({
    where: { id: contactId as string },
    data: { passwordHash, isPortalEnabled: true },
  });

  return Response.json({ ok: true });
}
